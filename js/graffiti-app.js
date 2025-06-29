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
            const message = `边缘检测完成！检测到 ${stats.edgePointsCount} 个边缘点，耗时 ${stats.totalTime.toFixed(0)}ms`;
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