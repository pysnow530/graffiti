/**
 * 涂鸦应用主控制器
 * 负责整体协调、UI交互和通知系统
 */
class GraffitiApp {
    constructor() {
        // 获取画布元素
        this.canvas = document.getElementById('drawingCanvas');
        
        // 初始化各个模块
        this.drawingEngine = new DrawingEngine(this.canvas);
        this.imageProcessor = new ImageProcessor(this.drawingEngine);
        this.edgeDetection = new EdgeDetectionAlgorithm(this.imageProcessor);
        
        // 边缘绘制配置
        this.edgeDrawConfig = {
            color: '#007bff',  // 蓝色
            radius: 2,         // 点半径
            enabled: true,     // 是否自动绘制
            drawLines: true,   // 是否绘制连线
            lineWidth: 1,      // 连线宽度
            lineColor: '#007bff', // 连线颜色（默认与点颜色相同）
            drawPoints: true   // 是否绘制点
        };
        
        // 边缘点预处理配置
        this.edgeProcessConfig = {
            enableSort: true,      // 启用路径排序
            enableCompress: true,  // 启用道格拉斯-普克压缩
            tolerance: 2.0         // 压缩容差
        };
        
        // 初始化应用
        this.initializeApp();
    }
    
    /**
     * 初始化应用
     */
    initializeApp() {
        this.bindUIEvents();
        console.log('🎨 Canvas 涂鸦板已初始化完成！');
    }
    
    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        // 获取控制元素
        const colorPicker = document.getElementById('colorPicker');
        const brushSize = document.getElementById('brushSize');
        const sizeDisplay = document.getElementById('sizeDisplay');
        const gridSize = document.getElementById('gridSize');
        const gridSizeDisplay = document.getElementById('gridSizeDisplay');
        const imageUpload = document.getElementById('imageUpload');
        const edgeButton = document.getElementById('edgeDetection');
        const clearButton = document.getElementById('clearCanvas');
        const saveButton = document.getElementById('saveCanvas');
        
        // 颜色选择器事件
        colorPicker.addEventListener('change', (e) => {
            this.drawingEngine.setColor(e.target.value);
        });
        
        // 画笔大小调节事件
        brushSize.addEventListener('input', (e) => {
            const size = e.target.value;
            this.drawingEngine.setSize(size);
            sizeDisplay.textContent = size;
        });
        
        // 栅格大小调节事件
        gridSize.addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            this.edgeDetection.setGridSize(size);
            gridSizeDisplay.textContent = size;
        });
        
        // 图片导入事件
        imageUpload.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });
        
        // 图像描边事件
        edgeButton.addEventListener('click', () => {
            this.handleEdgeDetection();
        });
        
        // 清空画布事件
        clearButton.addEventListener('click', () => {
            this.drawingEngine.clearCanvas();
            this.showNotification('画布已清空', 'success');
        });
        
        // 保存图片事件
        saveButton.addEventListener('click', () => {
            this.drawingEngine.saveCanvas();
            this.showNotification('图片保存成功！', 'success');
        });
    }
    
    /**
     * 处理图片上传
     */
    handleImageUpload(e) {
        const file = e.target.files[0];
        
        this.imageProcessor.handleImageUpload(
            file,
            (message) => this.showNotification(message, 'success'),
            (error) => this.showNotification(error, 'error')
        );
        
        // 清空input的值，允许重复选择同一文件
        e.target.value = '';
    }
    
    /**
     * 处理边缘检测
     * 负责协调边缘检测算法执行和结果绘制
     */
    handleEdgeDetection() {
        // 显示开始通知
        this.showNotification('开始边缘检测...', 'info');
        
        // 进度回调
        const onProgress = (current, total, angle) => {
            const progress = Math.round((current / total) * 100);
            if (current % 5 === 0) { // 每5个角度更新一次进度
                this.showNotification(`边缘检测进度: ${progress}% (角度: ${angle}°)`, 'info');
            }
        };
        
        // 完成回调
        const onComplete = (edgePoints, stats) => {
            let processTime = 0;
            let drawTime = 0;
            let processedPoints = edgePoints;
            
            // 预处理边缘点：排序 + 压缩
            if (this.edgeProcessConfig.enableSort || this.edgeProcessConfig.enableCompress) {
                const processStartTime = performance.now();
                processedPoints = this.imageProcessor.preprocessEdgePoints(
                    edgePoints, 
                    this.edgeProcessConfig
                );
                processTime = performance.now() - processStartTime;
                
                console.log(`🔧 边缘点预处理耗时: ${processTime.toFixed(2)}ms`);
            }
            
            // 根据配置决定是否绘制边缘点
            if (this.edgeDrawConfig.enabled) {
                const drawStartTime = performance.now();
                this.imageProcessor.drawContour(processedPoints, this.edgeDrawConfig);
                drawTime = performance.now() - drawStartTime;
                
                console.log(`🎨 绘制边缘轮廓耗时: ${drawTime.toFixed(2)}ms`);
            }
            
            // 更新统计信息
            stats.originalPointsCount = edgePoints.length;
            stats.processedPointsCount = processedPoints.length;
            stats.compressionRate = ((edgePoints.length - processedPoints.length) / edgePoints.length * 100).toFixed(1);
            stats.processTime = processTime;
            stats.drawTime = drawTime;
            stats.totalTimeWithProcessAndDraw = stats.totalTime + processTime + drawTime;
            
            console.log(`📊 包含预处理和绘制的总耗时: ${stats.totalTimeWithProcessAndDraw.toFixed(2)}ms`);
            
            // 构建通知消息
            const processInfo = (this.edgeProcessConfig.enableSort || this.edgeProcessConfig.enableCompress) ? 
                `，预处理后 ${processedPoints.length} 个点 (压缩${stats.compressionRate}%)` : '';
            const drawInfo = this.edgeDrawConfig.enabled ? 
                `，绘制耗时 ${drawTime.toFixed(0)}ms` : 
                '（未绘制）';
            const message = `边缘检测完成！检测到 ${stats.edgePointsCount} 个边缘点${processInfo}，算法耗时 ${stats.totalTime.toFixed(0)}ms${drawInfo}`;
            this.showNotification(message, 'success');
        };
        
        // 错误回调
        const onError = (error) => {
            this.showNotification('边缘检测失败，请重试', 'error');
        };
        
        // 执行边缘检测
        this.edgeDetection.detectEdges(onProgress, onComplete, onError);
    }
    
    /**
     * 设置边缘绘制配置
     * @param {Object} config - 绘制配置
     * @param {string} config.color - 边缘点颜色
     * @param {number} config.radius - 边缘点半径
     * @param {boolean} config.enabled - 是否启用自动绘制
     * @param {boolean} config.drawLines - 是否绘制连线
     * @param {number} config.lineWidth - 连线宽度
     * @param {string} config.lineColor - 连线颜色
     * @param {boolean} config.drawPoints - 是否绘制点
     */
    setEdgeDrawConfig(config) {
        this.edgeDrawConfig = { ...this.edgeDrawConfig, ...config };
    }
    
    /**
     * 设置边缘点预处理配置
     * @param {Object} config - 预处理配置
     * @param {boolean} config.enableSort - 是否启用路径排序
     * @param {boolean} config.enableCompress - 是否启用道格拉斯-普克压缩
     * @param {number} config.tolerance - 压缩容差（越小保留的点越多）
     */
    setEdgeProcessConfig(config) {
        this.edgeProcessConfig = { ...this.edgeProcessConfig, ...config };
    }
    
    /**
     * 手动绘制边缘点
     * @param {Array<{x: number, y: number}>} edgePoints - 边缘点数组
     * @param {Object} drawConfig - 可选的绘制配置
     * @param {Object} processConfig - 可选的预处理配置
     * @param {boolean} skipPreprocess - 是否跳过预处理（默认false）
     */
    drawEdgePoints(edgePoints, drawConfig = null, processConfig = null, skipPreprocess = false) {
        let processedPoints = edgePoints;
        
        // 预处理边缘点
        if (!skipPreprocess && (this.edgeProcessConfig.enableSort || this.edgeProcessConfig.enableCompress)) {
            const config = processConfig || this.edgeProcessConfig;
            processedPoints = this.imageProcessor.preprocessEdgePoints(edgePoints, config);
        }
        
        // 绘制处理后的点
        const finalDrawConfig = { ...this.edgeDrawConfig, ...drawConfig };
        this.imageProcessor.drawContour(processedPoints, finalDrawConfig);
        
        return processedPoints; // 返回处理后的点数组
    }
    
    /**
     * 显示通知消息
     */
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 添加显示动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // 3秒后自动移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new GraffitiApp();
}); 