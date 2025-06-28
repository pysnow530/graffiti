// Canvas 涂鸦板 JavaScript
class GraffitiCanvas {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentColor = '#000000';
        this.currentSize = 5;
        this.gridSize = 5;
        
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
        const gridSize = document.getElementById('gridSize');
        const gridSizeDisplay = document.getElementById('gridSizeDisplay');
        const imageUpload = document.getElementById('imageUpload');
        const edgeButton = document.getElementById('edgeDetection');
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
        
        // 栅格大小调节事件
        gridSize.addEventListener('input', (e) => {
            this.gridSize = parseInt(e.target.value);
            gridSizeDisplay.textContent = this.gridSize;
        });
        
        // 图片导入事件
        imageUpload.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });
        
        // 图像描边事件
        edgeButton.addEventListener('click', () => {
            this.detectEdges();
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
    
    // 处理图片上传
    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            this.showNotification('请选择有效的图片文件！', 'error');
            return;
        }
        
        // 检查文件大小（限制为10MB）
        if (file.size > 10 * 1024 * 1024) {
            this.showNotification('图片文件过大，请选择小于10MB的图片！', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                this.drawImageToCanvas(img);
                this.showNotification('图片导入成功！', 'success');
            };
            img.onerror = () => {
                this.showNotification('图片加载失败，请重试！', 'error');
            };
            img.src = event.target.result;
        };
        
        reader.onerror = () => {
            this.showNotification('文件读取失败，请重试！', 'error');
        };
        
        reader.readAsDataURL(file);
        
        // 清空input的值，允许重复选择同一文件
        e.target.value = '';
    }
    
    // 将图片绘制到画布上
    drawImageToCanvas(img) {
        // 清空画布并填充白色背景
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 计算缩放比例，保持图片比例并适应画布
        const canvasRatio = this.canvas.width / this.canvas.height;
        const imageRatio = img.width / img.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imageRatio > canvasRatio) {
            // 图片更宽，以宽度为准
            drawWidth = this.canvas.width;
            drawHeight = this.canvas.width / imageRatio;
            offsetX = 0;
            offsetY = (this.canvas.height - drawHeight) / 2;
        } else {
            // 图片更高，以高度为准
            drawHeight = this.canvas.height;
            drawWidth = this.canvas.height * imageRatio;
            offsetX = (this.canvas.width - drawWidth) / 2;
            offsetY = 0;
        }
        
        // 绘制图片
        this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
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
    
    // 图像描边功能
    detectEdges() {
        try {
            // === 性能计时开始 ===
            const totalStartTime = performance.now();
            console.log('🔍 开始边缘检测算法...');
            
            // 获取画布像素数据
            const imageDataStartTime = performance.now();
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const data = imageData.data;
            const width = this.canvas.width;
            const height = this.canvas.height;
            const imageDataTime = performance.now() - imageDataStartTime;
            console.log(`📊 获取图像数据耗时: ${imageDataTime.toFixed(2)}ms`);
            
            // 存储边缘点
            const edgePoints = new Set();
            
            // 检查像素是否为非空（不是白色或透明）
            const isPixelNotEmpty = (x, y) => {
                if (x < 0 || x >= width || y < 0 || y >= height) return false;
                const index = (y * width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const a = data[index + 3];
                
                // 检查是否不是白色背景且不透明
                return a > 0 && !(r > 250 && g > 250 && b > 250);
            };
            
            // 多角度全覆盖扫描
            const angleStep = this.gridSize; // 角度步长，gridSize作为度数间隔
            const totalAngles = Math.ceil(180 / angleStep);
            console.log(`🎯 开始多角度扫描，角度步长: ${angleStep}°, 总角度数: ${totalAngles}`);
            
            const scanStartTime = performance.now();
            let angleCount = 0;
            const angleTimings = [];
            
            // 按角度扫描（每gridSize度扫描一次，0-180度即可覆盖所有方向）
            for (let angle = 0; angle < 180; angle += angleStep) {
                const angleStartTime = performance.now();
                const initialEdgeCount = edgePoints.size;
                
                this.scanInDirection(angle, edgePoints, width, height, isPixelNotEmpty);
                
                const angleTime = performance.now() - angleStartTime;
                const newEdgeCount = edgePoints.size - initialEdgeCount;
                angleTimings.push({angle, time: angleTime, newEdges: newEdgeCount});
                angleCount++;
                
                // 每10个角度打印一次进度
                if (angleCount % 10 === 0 || angle === 0) {
                    console.log(`  📐 角度 ${angle}° 完成，耗时: ${angleTime.toFixed(2)}ms，新增边缘点: ${newEdgeCount}`);
                }
            }
            
            const totalScanTime = performance.now() - scanStartTime;
            console.log(`⚡ 扫描阶段总耗时: ${totalScanTime.toFixed(2)}ms`);
            console.log(`📈 平均每角度耗时: ${(totalScanTime / angleCount).toFixed(2)}ms`);
            
            // 找出耗时最长和最短的角度
            const sortedTimings = [...angleTimings].sort((a, b) => b.time - a.time);
            console.log(`🐌 最慢角度: ${sortedTimings[0].angle}° (${sortedTimings[0].time.toFixed(2)}ms)`);
            console.log(`🚀 最快角度: ${sortedTimings[sortedTimings.length-1].angle}° (${sortedTimings[sortedTimings.length-1].time.toFixed(2)}ms)`);
            
            // 绘制边缘点
            const drawStartTime = performance.now();
            this.drawEdgePoints(edgePoints);
            const drawTime = performance.now() - drawStartTime;
            console.log(`🎨 绘制边缘点耗时: ${drawTime.toFixed(2)}ms`);
            
            // === 性能计时结束 ===
            const totalTime = performance.now() - totalStartTime;
            console.log('='.repeat(50));
            console.log(`✅ 边缘检测算法完成！`);
            console.log(`📊 总耗时: ${totalTime.toFixed(2)}ms`);
            console.log(`📊 检测到边缘点: ${edgePoints.size} 个`);
            console.log(`📊 处理效率: ${(edgePoints.size / totalTime * 1000).toFixed(0)} 点/秒`);
            console.log(`📊 像素处理速度: ${((width * height) / totalTime * 1000).toFixed(0)} 像素/秒`);
            console.log('='.repeat(50));
            
            // 显示成功通知
            this.showNotification(`边缘检测完成！检测到 ${edgePoints.size} 个边缘点，耗时 ${totalTime.toFixed(0)}ms`, 'success');
            
        } catch (error) {
            this.showNotification('边缘检测失败，请重试', 'error');
            console.error('边缘检测错误:', error);
        }
    }
    
    // 在指定角度方向进行全覆盖扫描
    scanInDirection(angleDegrees, edgePoints, width, height, isPixelNotEmpty) {
        const radians = (angleDegrees * Math.PI) / 180;
        const cosAngle = Math.cos(radians);
        const sinAngle = Math.sin(radians);
        
        // 扫描线方向向量
        const dirX = cosAngle;
        const dirY = sinAngle;
        
        // 垂直于扫描线的方向向量
        const perpX = -sinAngle;
        const perpY = cosAngle;
        
        // 计算画布的四个角点
        const corners = [
            {x: 0, y: 0},
            {x: width, y: 0},
            {x: width, y: height},
            {x: 0, y: height}
        ];
        
        // 计算所有角点在垂直方向上的投影，确定扫描范围
        let minProj = Infinity;
        let maxProj = -Infinity;
        
        corners.forEach(corner => {
            const proj = corner.x * perpX + corner.y * perpY;
            minProj = Math.min(minProj, proj);
            maxProj = Math.max(maxProj, proj);
        });
        
        // 扩展扫描范围，确保完全覆盖
        const margin = this.gridSize * 2;
        minProj -= margin;
        maxProj += margin;
        
        // 性能统计变量
        let totalScanLines = 0;
        let totalPixelsChecked = 0;
        let totalEdgePointsFound = 0;
        
        // 在垂直方向上每隔gridSize距离放置一条扫描带（5个点宽度）
        for (let perpDist = minProj; perpDist <= maxProj; perpDist += this.gridSize) {
            totalScanLines++;
            
            // 沿扫描方向寻找边缘点
            const scanRange = Math.sqrt(width * width + height * height);
            let firstEdge = null;
            let lastEdge = null;
            let linePixelsChecked = 0;
            
            // 正向扫描
            for (let dist = -scanRange; dist <= scanRange; dist += 1) {
                // 计算中心点
                const centerX = Math.round(perpDist * perpX + dist * dirX);
                const centerY = Math.round(perpDist * perpY + dist * dirY);
                
                // 圆形区域检测
                let foundEdge = false;
                const detectionRadius = 2;
                for (let dx = -detectionRadius; dx <= detectionRadius; dx++) {
                    if (foundEdge) break;
                    for (let dy = -detectionRadius; dy <= detectionRadius; dy++) {
                        if (foundEdge) break;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance <= detectionRadius) {
                            const x = centerX + dx;
                            const y = centerY + dy;
                            // 检测圆形区域内的每个点
                            if (x >= 0 && x < width && y >= 0 && y < height) {
                                linePixelsChecked++;
                                if (isPixelNotEmpty(x, y)) {
                                    // 记录边缘点
                                    const edgePoint = `${x},${y}`;
                                    if (!firstEdge) {
                                        firstEdge = edgePoint;
                                    }
                                    lastEdge = edgePoint;
                                    foundEdge = true;
                                }
                            }
                        }
                    }
                }
            }
            
            totalPixelsChecked += linePixelsChecked;
            
            // 添加找到的边缘点
            if (firstEdge) {
                edgePoints.add(firstEdge);
                totalEdgePointsFound++;
            }
            if (lastEdge && lastEdge !== firstEdge) {
                edgePoints.add(lastEdge);
                totalEdgePointsFound++;
            }
        }
        
        // 输出详细的角度统计（仅对关键角度）
        if (angleDegrees % 30 === 0 || angleDegrees < 10) {
            console.log(`    🔎 角度 ${angleDegrees}°: 扫描线 ${totalScanLines} 条, 检测像素 ${totalPixelsChecked} 个, 发现边缘点 ${totalEdgePointsFound} 个`);
        }
    }
    
    // 绘制边缘点
    drawEdgePoints(edgePoints) {
        // 保存当前绘图状态
        const originalStrokeStyle = this.ctx.strokeStyle;
        const originalFillStyle = this.ctx.fillStyle;
        const originalLineWidth = this.ctx.lineWidth;
        
        // 设置边缘点样式
        this.ctx.fillStyle = '#007bff'; // 蓝色
        this.ctx.strokeStyle = '#007bff';
        this.ctx.lineWidth = 1;
        
        // 绘制每个边缘点
        edgePoints.forEach(pointStr => {
            const [x, y] = pointStr.split(',').map(Number);
            
            // 绘制小圆点
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        
        // 恢复原始绘图状态
        this.ctx.strokeStyle = originalStrokeStyle;
        this.ctx.fillStyle = originalFillStyle;
        this.ctx.lineWidth = originalLineWidth;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new GraffitiCanvas();
    console.log('Canvas 涂鸦板已初始化完成！');
}); 