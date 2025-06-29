/**
 * 图像处理器
 * 负责图片导入、处理和在画布上绘制
 */
class ImageProcessor {
    constructor(drawingEngine) {
        this.drawingEngine = drawingEngine;
        this.ctx = drawingEngine.getContext();
        this.canvas = drawingEngine.canvas;
    }
    
    /**
     * 处理图片上传
     */
    handleImageUpload(file, onSuccess, onError) {
        if (!file) return;
        
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            onError('请选择有效的图片文件！');
            return;
        }
        
        // 检查文件大小（限制为10MB）
        if (file.size > 10 * 1024 * 1024) {
            onError('图片文件过大，请选择小于10MB的图片！');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                this.drawImageToCanvas(img);
                onSuccess('图片导入成功！');
            };
            img.onerror = () => {
                onError('图片加载失败，请重试！');
            };
            img.src = event.target.result;
        };
        
        reader.onerror = () => {
            onError('文件读取失败，请重试！');
        };
        
        reader.readAsDataURL(file);
    }
    
    /**
     * 将图片绘制到画布上
     */
    drawImageToCanvas(img) {
        // 清空画布并填充白色背景
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 计算缩放比例，保持图片比例并适应画布
        const scale = Math.min(
            this.canvas.width / img.width,
            this.canvas.height / img.height
        );
        
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // 计算居中位置
        const x = (this.canvas.width - scaledWidth) / 2;
        const y = (this.canvas.height - scaledHeight) / 2;
        
        // 绘制图片
        this.ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    }
    
    /**
     * 获取画布的图像数据
     */
    getImageData() {
        return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * 检查像素是否为非空（不是白色或透明）
     */
    isPixelNotEmpty(imageData, x, y) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        if (x < 0 || x >= width || y < 0 || y >= height) return false;
        
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        
        // 检查是否不是白色背景且不透明
        return a > 0 && !(r > 250 && g > 250 && b > 250);
    }
    
    /**
     * 在画布上绘制点集
     * @param {Array} points - 点数组，支持两种格式：
     *   - 推荐：对象格式 [{x: number, y: number}, ...]
     *   - 兼容：字符串格式 ["x,y", ...]
     * @param {string} color - 绘制颜色
     * @param {number} radius - 点的半径
     */
    drawPoints(points, color = '#007bff', radius = 2) {
        // 保存当前绘图状态
        const originalStrokeStyle = this.ctx.strokeStyle;
        const originalFillStyle = this.ctx.fillStyle;
        const originalLineWidth = this.ctx.lineWidth;
        
        // 设置绘制样式
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        
        // 绘制每个点
        points.forEach(point => {
            let x, y;
            if (typeof point === 'string') {
                // 向后兼容：支持字符串格式 "x,y"
                [x, y] = point.split(',').map(Number);
            } else if (point && typeof point.x === 'number' && typeof point.y === 'number') {
                // 推荐格式：点对象 {x: number, y: number}
                x = point.x;
                y = point.y;
            } else {
                console.warn('无效的点格式:', point);
                return;
            }
            
            // 绘制小圆点
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        
        // 恢复原始绘图状态
        this.ctx.strokeStyle = originalStrokeStyle;
        this.ctx.fillStyle = originalFillStyle;
        this.ctx.lineWidth = originalLineWidth;
    }
} 