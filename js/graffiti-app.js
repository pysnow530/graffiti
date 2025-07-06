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
            drawPoints: true,  // 是否绘制点
            tolerance: 10,     // 网格生成的容差（像素）
            gridColor: '#00ff00', // 网格线颜色（绿色）
            gridLineWidth: 1,  // 网格线宽度
            drawGridPoints: false, // 是否绘制网格点
            gridPointRadius: 2, // 网格点半径
            drawSubdivisions: true, // 是否绘制6等分网格
            subdivisionColor: '#00ff00', // 等分线颜色（与主网格相同）
            subdivisionLineWidth: 1 // 等分线宽度
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
            let splitResult = null;
            let gridData = null;
            
            // 预处理边缘点：排序 + 压缩
            if (this.edgeProcessConfig.enableSort || this.edgeProcessConfig.enableCompress) {
                const processStartTime = performance.now();
                processedPoints = this.imageProcessor.preprocessEdgePoints(
                    edgePoints, 
                    this.edgeProcessConfig
                );
                processTime = performance.now() - processStartTime;
                
                console.log(`🔧 边缘点预处理耗时: ${processTime.toFixed(2)}ms`);
                
                // 切分成两条线
                if (processedPoints.length > 0) {
                    splitResult = this.imageProcessor.splitPointsAtRightmost(processedPoints);
                    gridData = this.imageProcessor.generateGridData(splitResult.firstArray, splitResult.secondArray, this.edgeDrawConfig.tolerance);
                    console.log('网格数据:', gridData);
                }
            }
            
            // 根据配置决定是否绘制边缘点
            if (this.edgeDrawConfig.enabled) {
                const drawStartTime = performance.now();
                
                if (splitResult && (splitResult.firstArray.length > 0 || splitResult.secondArray.length > 0)) {
                    // 使用 image-processor 的方法绘制切分后的两条线
                    this.imageProcessor.drawSplitLines(splitResult, {
                        firstLineColor: this.edgeDrawConfig.color,
                        secondLineColor: '#ff0000',  // 红色
                        lineWidth: this.edgeDrawConfig.lineWidth,
                        pointRadius: this.edgeDrawConfig.radius,
                        drawPoints: this.edgeDrawConfig.drawPoints,
                        drawLines: this.edgeDrawConfig.drawLines
                    });

                        if (gridData) {
                         this.imageProcessor.drawGrid(gridData, {
                             gridColor: this.edgeDrawConfig.gridColor,
                             gridLineWidth: this.edgeDrawConfig.gridLineWidth,
                             drawGridPoints: this.edgeDrawConfig.drawGridPoints,
                             gridPointRadius: this.edgeDrawConfig.gridPointRadius,
                             drawSubdivisions: this.edgeDrawConfig.drawSubdivisions,
                             subdivisionColor: this.edgeDrawConfig.subdivisionColor,
                             subdivisionLineWidth: this.edgeDrawConfig.subdivisionLineWidth
                         });
                     }
                } else {
                    // 如果没有切分结果，使用原始方式绘制
                    this.imageProcessor.drawContour(processedPoints, this.edgeDrawConfig);
                }
                
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
            
            // 添加切分统计信息
            if (splitResult) {
                stats.splitResult = {
                    firstArrayCount: splitResult.firstArray.length,
                    secondArrayCount: splitResult.secondArray.length,
                    maxXIndex: splitResult.maxXIndex
                };
            }
            
            // 添加网格统计信息
            if (gridData) {
                stats.gridData = {
                    connectionCount: gridData.length,
                    tolerance: this.edgeDrawConfig.tolerance,
                    subdivisionEnabled: this.edgeDrawConfig.drawSubdivisions,
                    estimatedSubdivisionLines: this.edgeDrawConfig.drawSubdivisions ? (gridData.length - 1) * 7 : 0
                };
            }
            
            console.log(`📊 包含预处理和绘制的总耗时: ${stats.totalTimeWithProcessAndDraw.toFixed(2)}ms`);
            
            // 构建通知消息
            const processInfo = (this.edgeProcessConfig.enableSort || this.edgeProcessConfig.enableCompress) ? 
                `，预处理后 ${processedPoints.length} 个点 (压缩${stats.compressionRate}%)` : '';
            const splitInfo = stats.splitResult ? 
                `，切分为两条线 (${stats.splitResult.firstArrayCount}+${stats.splitResult.secondArrayCount}个点)` : '';
            const gridInfo = gridData ? 
                `，生成 ${gridData.length} 组网格连接${this.edgeDrawConfig.drawSubdivisions ? '（含6等分）' : ''}` : '';
            const drawInfo = this.edgeDrawConfig.enabled ? 
                `，绘制耗时 ${drawTime.toFixed(0)}ms` : 
                '（未绘制）';
            const message = `边缘检测完成！检测到 ${stats.edgePointsCount} 个边缘点${processInfo}${splitInfo}${gridInfo}，算法耗时 ${stats.totalTime.toFixed(0)}ms${drawInfo}`;
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
     * 测试6等分网格功能
     * 创建一些测试数据并绘制6等分网格
     */
    testSubdivisionGrid() {
        console.log('🧪 开始测试6等分网格功能');
        
        // 创建测试数据：4个垂直连接
        const testGridData = [
            [{x: 100, y: 100}, {x: 100, y: 200}],  // 第一条垂直线
            [{x: 150, y: 120}, {x: 150, y: 180}],  // 第二条垂直线
            [{x: 200, y: 90}, {x: 200, y: 210}],   // 第三条垂直线
            [{x: 250, y: 110}, {x: 250, y: 190}]   // 第四条垂直线
        ];
        
        // 清空画布
        this.drawingEngine.clearCanvas();
        
        // 绘制6等分网格
        this.imageProcessor.drawGrid(testGridData, {
            gridColor: '#00ff00',          // 绿色主网格
            gridLineWidth: 2,
            drawSubdivisions: true,        // 启用6等分
            subdivisionColor: '#00ff00',   // 等分线颜色（与主网格相同）
            subdivisionLineWidth: 1,
            drawGridPoints: true,          // 显示网格点
            gridPointRadius: 3,
            gridPointColor: '#ff0000'      // 红色网格点
        });
        
        console.log('✅ 6等分网格测试完成');
        console.log('📊 测试数据：4组垂直连接，每组6等分，预期产生21条水平连线（与垂直线颜色一致）');
        
        // 显示测试结果通知
        this.showNotification('6等分网格测试完成！统一颜色网格效果', 'success');
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
    window.graffitiApp = new GraffitiApp();
    
    // 网格和切分功能使用示例（在浏览器控制台中运行）
    // 
    // 1. 基本切分操作（通过 imageProcessor）：
    // const points = [{x: 100, y: 100}, {x: 200, y: 150}, {x: 300, y: 100}, {x: 250, y: 200}];
    // const splitResult = graffitiApp.imageProcessor.splitPointsAtRightmost(points);
    // console.log('切分结果:', splitResult);
    //
    // 2. 生成和绘制网格：
    // const splitResult = graffitiApp.imageProcessor.splitPointsAtRightmost(points);
    // const gridData = graffitiApp.imageProcessor.generateGridData(splitResult.firstArray, splitResult.secondArray, 10);
    // graffitiApp.imageProcessor.drawGrid(gridData);
    //
         // 3. 自定义网格样式：
     // graffitiApp.imageProcessor.drawGrid(gridData, {
     //     gridColor: '#ff6b35',          // 橙色网格线
     //     gridLineWidth: 2,              // 更粗的线条
     //     drawGridPoints: true,          // 显示网格点
     //     gridPointRadius: 3,            // 更大的网格点
     //     gridPointColor: '#dc3545',     // 红色网格点
     //     drawSubdivisions: true,        // 绘制6等分网格
     //     subdivisionColor: '#ff6b35',   // 等分线颜色（与主网格相同）
     //     subdivisionLineWidth: 1        // 等分线宽度
     // });
    //
    // 4. 切分线自定义样式：
    // const splitResult = graffitiApp.imageProcessor.splitPointsAtRightmost(points);
    // graffitiApp.imageProcessor.drawSplitLines(splitResult, {
    //     firstLineColor: '#ff6b35',     // 橙色第一条线
    //     secondLineColor: '#6f42c1',    // 紫色第二条线
    //     lineWidth: 3,
    //     pointRadius: 4,
    //     drawPoints: true,
    //     drawLines: true
    // });
    //
    // 5. 完整流程（预处理 -> 切分 -> 网格 -> 绘制）：
    // const rawPoints = [{x: 50, y: 100}, {x: 150, y: 50}, {x: 250, y: 100}, {x: 200, y: 150}];
    // const splitResult = graffitiApp.imageProcessor.processAndSplitPoints(rawPoints);
    // const gridData = graffitiApp.imageProcessor.generateGridData(splitResult.firstArray, splitResult.secondArray);
    // graffitiApp.imageProcessor.drawGrid(gridData);
    //
    // 6. 边缘检测自动处理：
    // // 边缘检测现在会自动执行：切分 -> 生成网格 -> 绘制所有内容
    // graffitiApp.handleEdgeDetection(); 
    //
         // 7. 配置6等分网格参数：
     // graffitiApp.setEdgeDrawConfig({
     //     tolerance: 15,                 // 网格生成容差
     //     gridColor: '#00ffff',          // 青色网格
     //     gridLineWidth: 2,              // 网格线宽度
     //     drawGridPoints: true,          // 显示网格点
     //     gridPointRadius: 4,            // 网格点大小
     //     drawSubdivisions: true,        // 启用6等分网格
     //     subdivisionColor: '#00ffff',   // 等分线颜色（与主网格相同）
     //     subdivisionLineWidth: 2        // 等分线宽度
     // });
    //
         // 8. 单独控制6等分网格：
     // // 只绘制主网格，不绘制6等分
     // graffitiApp.imageProcessor.drawGrid(gridData, {
     //     drawSubdivisions: false        // 关闭6等分网格
     // });
     //
     // // 只绘制6等分网格，不绘制主网格
     // graffitiApp.imageProcessor.drawGrid(gridData, {
     //     gridColor: 'transparent',      // 隐藏主网格
     //     drawSubdivisions: true,        // 启用6等分网格
     //     subdivisionColor: 'transparent', // 等分线颜色（自定义，可不同于主网格）
     //     subdivisionLineWidth: 1
     // });
     //
     // 9. 测试6等分网格功能：
     // graffitiApp.testSubdivisionGrid();
     //
     // 10. 分析结果：
     // const splitResult = graffitiApp.imageProcessor.splitPointsAtRightmost(points);
     // const gridData = graffitiApp.imageProcessor.generateGridData(splitResult.firstArray, splitResult.secondArray);
     // console.log('第一条线点数:', splitResult.stats.firstArrayCount);
     // console.log('第二条线点数:', splitResult.stats.secondArrayCount);
     // console.log('网格连接数:', gridData.length);
     // console.log('最大X值:', splitResult.stats.maxX);
     // console.log('6等分网格:', '每个垂直连接被分为6段，产生7个等分点，横向线与纵向线颜色一致');
}); 