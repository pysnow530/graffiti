// Canvas 涂鸦板 JavaScript
class GraffitiCanvas {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentColor = '#000000';
        this.currentSize = 5;
        
        this.initCanvas();
        this.bindEvents();
    }
    
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
    
    bindEvents() {
        // 获取控制元素
        const colorPicker = document.getElementById('colorPicker');
        const brushSize = document.getElementById('brushSize');
        const sizeDisplay = document.getElementById('sizeDisplay');
        const clearButton = document.getElementById('clearCanvas');
        const saveButton = document.getElementById('saveCanvas');
        
        // 颜色选择器事件
        colorPicker.addEventListener('change', (e) => {
            this.currentColor = e.target.value;
            this.ctx.strokeStyle = this.currentColor;
        });
        
        // 画笔大小调节事件
        brushSize.addEventListener('input', (e) => {
            this.currentSize = e.target.value;
            this.ctx.lineWidth = this.currentSize;
            sizeDisplay.textContent = this.currentSize;
        });
        
        // 清空画布事件
        clearButton.addEventListener('click', () => {
            this.clearCanvas();
        });
        
        // 保存图片事件
        saveButton.addEventListener('click', () => {
            this.saveCanvas();
        });
        
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
    
    // 获取鼠标在canvas上的相对位置
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
    
    // 开始绘制
    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
    }
    
    // 绘制过程
    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
    }
    
    // 停止绘制
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.ctx.beginPath();
        }
    }
    
    // 清空画布
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // 重新填充白色背景
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 显示清空确认
        this.showNotification('画布已清空！', 'info');
    }
    
    // 保存画布为图片
    saveCanvas() {
        try {
            const link = document.createElement('a');
            link.download = `涂鸦作品_${new Date().toLocaleString('zh-CN').replace(/[\/\s:]/g, '_')}.png`;
            link.href = this.canvas.toDataURL();
            link.click();
            
            this.showNotification('图片保存成功！', 'success');
        } catch (error) {
            this.showNotification('保存失败，请重试', 'error');
            console.error('保存图片失败:', error);
        }
    }
    
    // 显示通知消息
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            border-radius: 5px;
            z-index: 1000;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 3秒后自动消失
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new GraffitiCanvas();
    console.log('Canvas 涂鸦板已初始化完成！');
}); 