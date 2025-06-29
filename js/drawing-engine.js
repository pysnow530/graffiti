/**
 * 画布绘图引擎
 * 负责画笔绘制、画布初始化和基本操作
 */
class DrawingEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isDrawing = false;
        this.currentColor = '#000000';
        this.currentSize = 5;
        
        this.initCanvas();
        this.bindDrawingEvents();
    }
    
    /**
     * 初始化画布
     */
    initCanvas() {
        // 设置canvas尺寸
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // 设置canvas默认样式
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.currentSize;
        
        // 填充白色背景
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * 绑定绘图相关事件
     */
    bindDrawingEvents() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // 触摸事件（移动端支持）
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
    }
    
    /**
     * 获取鼠标在canvas上的相对位置
     */
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
    
    /**
     * 开始绘制
     */
    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
    }
    
    /**
     * 绘制过程
     */
    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
    }
    
    /**
     * 停止绘制
     */
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.ctx.beginPath();
        }
    }
    
    /**
     * 设置画笔颜色
     */
    setColor(color) {
        this.currentColor = color;
        this.ctx.strokeStyle = color;
    }
    
    /**
     * 设置画笔大小
     */
    setSize(size) {
        this.currentSize = size;
        this.ctx.lineWidth = size;
    }
    
    /**
     * 清空画布
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * 保存画布为图片
     */
    saveCanvas() {
        const dataURL = this.canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = '涂鸦作品_' + new Date().getTime() + '.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    /**
     * 获取画布上下文（用于其他模块操作）
     */
    getContext() {
        return this.ctx;
    }
    
    /**
     * 获取画布尺寸
     */
    getCanvasSize() {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }
} 