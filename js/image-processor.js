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
     * 将散乱的点排序成路径
     * @param {Array<{x: number, y: number}>} points - 点数组
     * @returns {Array<{x: number, y: number}>} 排序后的点数组
     */
    sortPointsToPath(points) {
        if (points.length <= 2) return points;
        
        console.log(`🔄 开始路径排序，原始点数: ${points.length}`);
        const startTime = performance.now();
        
        // 复制点数组避免修改原数组
        const availablePoints = [...points];
        const sortedPath = [];
        
        // 从x值最小的点开始
        let currentIndex = 0;
        let minX = availablePoints[0].x;
        
        for (let i = 1; i < availablePoints.length; i++) {
            if (availablePoints[i].x < minX) {
                currentIndex = i;
                minX = availablePoints[i].x;
            }
        }
        
        // 使用最近邻算法构建路径
        while (availablePoints.length > 0) {
            const currentPoint = availablePoints.splice(currentIndex, 1)[0];
            sortedPath.push(currentPoint);
            
            if (availablePoints.length === 0) break;
            
            // 找到距离当前点最近的下一个点
            let nearestIndex = 0;
            let minDistance = this.getDistance(currentPoint, availablePoints[0]);
            
            for (let i = 1; i < availablePoints.length; i++) {
                const distance = this.getDistance(currentPoint, availablePoints[i]);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = i;
                }
            }
            
            currentIndex = nearestIndex;
        }
        
        const sortTime = performance.now() - startTime;
        console.log(`📏 路径排序完成，耗时: ${sortTime.toFixed(2)}ms`);
        
        return sortedPath;
    }
    
    /**
     * 道格拉斯-普克算法进行路径压缩
     * @param {Array<{x: number, y: number}>} points - 路径点数组
     * @param {number} tolerance - 容差值，越小保留的点越多
     * @returns {Array<{x: number, y: number}>} 压缩后的点数组
     */
    douglasPeucker(points, tolerance = 2.0) {
        if (points.length <= 2) return points;
        
        console.log(`🗜️ 开始道格拉斯-普克压缩，原始点数: ${points.length}，容差: ${tolerance}`);
        const startTime = performance.now();
        
        const result = this.douglasPeuckerRecursive(points, tolerance);
        
        const compressTime = performance.now() - startTime;
        const compressionRate = ((points.length - result.length) / points.length * 100).toFixed(1);
        
        console.log(`🗜️ 压缩完成，压缩后点数: ${result.length}，压缩率: ${compressionRate}%，耗时: ${compressTime.toFixed(2)}ms`);
        
        return result;
    }
    
    /**
     * 道格拉斯-普克算法递归实现
     * @param {Array<{x: number, y: number}>} points - 点数组
     * @param {number} tolerance - 容差值
     * @returns {Array<{x: number, y: number}>} 简化后的点数组
     */
    douglasPeuckerRecursive(points, tolerance) {
        if (points.length <= 2) return points;
        
        // 找到距离首尾连线最远的点
        let maxDistance = 0;
        let maxIndex = 0;
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        
        for (let i = 1; i < points.length - 1; i++) {
            const distance = this.getPointToLineDistance(points[i], firstPoint, lastPoint);
            if (distance > maxDistance) {
                maxDistance = distance;
                maxIndex = i;
            }
        }
        
        // 如果最大距离大于容差，则递归处理
        if (maxDistance > tolerance) {
            // 递归处理前半部分和后半部分
            const firstHalf = this.douglasPeuckerRecursive(points.slice(0, maxIndex + 1), tolerance);
            const secondHalf = this.douglasPeuckerRecursive(points.slice(maxIndex), tolerance);
            
            // 合并结果，去除重复的中间点
            return firstHalf.slice(0, -1).concat(secondHalf);
        } else {
            // 如果最大距离小于容差，则只保留首尾两个点
            return [firstPoint, lastPoint];
        }
    }
    
    /**
     * 计算两点之间的距离
     * @param {Object} point1 - 第一个点 {x, y}
     * @param {Object} point2 - 第二个点 {x, y}
     * @returns {number} 距离
     */
    getDistance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * 计算点到直线的距离
     * @param {Object} point - 点 {x, y}
     * @param {Object} lineStart - 直线起点 {x, y}
     * @param {Object} lineEnd - 直线终点 {x, y}
     * @returns {number} 距离
     */
    getPointToLineDistance(point, lineStart, lineEnd) {
        const A = lineEnd.y - lineStart.y;
        const B = lineStart.x - lineEnd.x;
        const C = lineEnd.x * lineStart.y - lineStart.x * lineEnd.y;
        
        const denominator = Math.sqrt(A * A + B * B);
        if (denominator === 0) return 0; // 起点和终点重合
        
        return Math.abs(A * point.x + B * point.y + C) / denominator;
    }
    
    /**
     * 预处理边缘点：排序 + 压缩
     * @param {Array<{x: number, y: number}>} points - 原始边缘点
     * @param {Object} options - 处理选项
     * @param {boolean} options.enableSort - 是否启用排序，默认true
     * @param {boolean} options.enableCompress - 是否启用压缩，默认true
     * @param {number} options.tolerance - 道格拉斯-普克算法容差，默认2.0
     * @returns {Array<{x: number, y: number}>} 处理后的点数组
     */
    preprocessEdgePoints(points, options = {}) {
        const {
            enableSort = true,
            enableCompress = true,
            tolerance = 2.0
        } = options;
        
        if (points.length === 0) return points;
        
        console.log(`🎯 开始边缘点预处理，原始点数: ${points.length}`);
        const totalStartTime = performance.now();
        
        let processedPoints = points;
        
        // 第一步：路径排序
        if (enableSort) {
            processedPoints = this.sortPointsToPath(processedPoints);
        }
        
        // 第二步：道格拉斯-普克压缩
        if (enableCompress) {
            processedPoints = this.douglasPeucker(processedPoints, tolerance);
        }
        
        // 第三步：检查并处理首尾点合并（如果是闭合轮廓）
        if (processedPoints.length > 2) {
            const firstPoint = processedPoints[0];
            const lastPoint = processedPoints[processedPoints.length - 1];
            
            // 如果首尾点距离很近，认为是闭合轮廓，移除最后一个点
            const distance = this.getDistance(firstPoint, lastPoint);
            if (distance <= tolerance) {
                processedPoints = processedPoints.slice(0, -1);
                console.log(`🔄 检测到闭合轮廓，移除重复的末尾点`);
            }
        }
        
        const totalTime = performance.now() - totalStartTime;
        const reductionRate = ((points.length - processedPoints.length) / points.length * 100).toFixed(1);
        
        console.log(`✅ 边缘点预处理完成！`);
        console.log(`📊 处理结果: ${points.length} → ${processedPoints.length} 个点 (减少${reductionRate}%)`);
        console.log(`📊 总耗时: ${totalTime.toFixed(2)}ms`);
        console.log('='.repeat(50));
        
        return processedPoints;
    }
    
    /**
     * 绘制轮廓线（专门用于边缘检测结果）
     * @param {Array<{x: number, y: number}>} points - 边缘点数组
     * @param {Object} options - 绘制配置
     * @returns {void}
     */
    drawContour(points, options = {}) {
        const defaultOptions = {
            color: '#007bff',
            radius: 2,
            drawLines: true,
            lineWidth: 1,
            lineColor: options.color || '#007bff',
            drawPoints: true
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        this.drawPoints(
            points, 
            finalOptions.color, 
            finalOptions.radius, 
            {
                drawLines: finalOptions.drawLines,
                lineWidth: finalOptions.lineWidth,
                lineColor: finalOptions.lineColor,
                drawPoints: finalOptions.drawPoints
            }
        );
    }
    
    
    /**
     * 在画布上绘制点集（支持连线）
     * @param {Array} points - 点数组，支持两种格式：
     *   - 推荐：对象格式 [{x: number, y: number}, ...]
     *   - 兼容：字符串格式 ["x,y", ...]
     * @param {string} color - 绘制颜色
     * @param {number} radius - 点的半径
     * @param {Object} options - 绘制选项
     * @param {boolean} options.drawLines - 是否在点之间绘制连线，默认true
     * @param {number} options.lineWidth - 连线宽度，默认1
     * @param {string} options.lineColor - 连线颜色，默认与点颜色相同
     * @param {boolean} options.drawPoints - 是否绘制点，默认true
     */
    drawPoints(points, color = '#007bff', radius = 2, options = {}) {
        // 解析选项
        const {
            drawLines = true,
            lineWidth = 1,
            lineColor = color,
            drawPoints = true
        } = options;
        
        if (points.length === 0) return;
        
        // 保存当前绘图状态
        const originalStrokeStyle = this.ctx.strokeStyle;
        const originalFillStyle = this.ctx.fillStyle;
        const originalLineWidth = this.ctx.lineWidth;
        
        // 转换所有点为标准格式
        const normalizedPoints = [];
        for (const point of points) {
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
                continue;
            }
            normalizedPoints.push({x, y});
        }
        
        if (normalizedPoints.length === 0) return;
        
        // 1. 绘制连线（如果启用且有足够的点）
        if (drawLines && normalizedPoints.length > 1) {
            this.ctx.strokeStyle = lineColor;
            this.ctx.lineWidth = lineWidth;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            // 绘制除最后一条边之外的所有连线
            for (let i = 0; i < normalizedPoints.length - 1; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(normalizedPoints[i].x, normalizedPoints[i].y);
                this.ctx.lineTo(normalizedPoints[i + 1].x, normalizedPoints[i + 1].y);
                this.ctx.stroke();
            }
            
            // 单独标识第一个点（用不同颜色或样式）
            if (normalizedPoints.length > 0) {
                const firstPoint = normalizedPoints[0];
                const originalFillStyle = this.ctx.fillStyle;
                const originalStrokeStyle = this.ctx.strokeStyle;
                
                // 用红色圆圈标识第一个点
                this.ctx.fillStyle = '#ff0000';
                this.ctx.strokeStyle = '#ff0000';
                this.ctx.beginPath();
                this.ctx.arc(firstPoint.x, firstPoint.y, radius + 2, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // 恢复原始样式
                this.ctx.fillStyle = originalFillStyle;
                this.ctx.strokeStyle = originalStrokeStyle;
            }
        }
        
        // 2. 绘制点（如果启用）
        if (drawPoints) {
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = color;
            
            for (const point of normalizedPoints) {
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
        
        // 恢复原始绘图状态
        this.ctx.strokeStyle = originalStrokeStyle;
        this.ctx.fillStyle = originalFillStyle;
        this.ctx.lineWidth = originalLineWidth;
    }
    
    /**
     * 从最右侧的点切分成两条线
     * @param {Array<{x: number, y: number}>} processedPoints - 预处理后的点数组
     * @returns {Object} {firstArray: Array, secondArray: Array, maxXIndex: number, stats: Object}
     */
    splitPointsAtRightmost(processedPoints) {
        if (!processedPoints || processedPoints.length === 0) {
            return {
                firstArray: [],
                secondArray: [],
                maxXIndex: -1,
                stats: { originalPointsCount: 0, firstArrayCount: 0, secondArrayCount: 0 }
            };
        }
        
        console.log(`✂️ 开始从最右侧点切分，输入点数: ${processedPoints.length}`);
        const startTime = performance.now();
        
        // 找到x值最大的点
        let maxXIndex = 0;
        let maxX = processedPoints[0].x;
        
        for (let i = 1; i < processedPoints.length; i++) {
            if (processedPoints[i].x > maxX) {
                maxX = processedPoints[i].x;
                maxXIndex = i;
            }
        }
        
        // 切分成两个数组，切分点归到第一个数组中
        const firstArray = processedPoints.slice(0, maxXIndex + 1);
        const secondArray = [firstArray[0], ...processedPoints.slice(maxXIndex).reverse()];
        
        const processingTime = performance.now() - startTime;
        
        const result = {
            firstArray: firstArray,
            secondArray: secondArray,
            maxXIndex: maxXIndex,
            stats: {
                originalPointsCount: processedPoints.length,
                firstArrayCount: firstArray.length,
                secondArrayCount: secondArray.length,
                processingTime: processingTime,
                maxX: maxX
            }
        };
        
        console.log(`✅ 切分完成！`);
        console.log(`📊 原始点数: ${result.stats.originalPointsCount}`);
        console.log(`📊 第一个数组: ${result.stats.firstArrayCount} 个点`);
        console.log(`📊 第二个数组: ${result.stats.secondArrayCount} 个点`);
        console.log(`📊 最大x值: ${maxX}, 索引: ${maxXIndex}`);
        console.log(`📊 处理耗时: ${processingTime.toFixed(2)}ms`);
        
        return result;
    }
    
    /**
     * 绘制切分后的两条线
     * @param {Object} splitResult - splitPointsAtRightmost 的返回值
     * @param {Object} options - 绘制选项
     * @param {string} options.firstLineColor - 第一条线的颜色（默认蓝色）
     * @param {string} options.secondLineColor - 第二条线的颜色（默认红色）
     * @param {number} options.lineWidth - 线条宽度（默认1）
     * @param {number} options.pointRadius - 点的半径（默认2）
     * @param {boolean} options.drawPoints - 是否绘制点（默认true）
     * @param {boolean} options.drawLines - 是否绘制连线（默认true）
     */
    drawSplitLines(splitResult, options = {}) {
        const defaultOptions = {
            firstLineColor: '#007bff',   // 蓝色
            secondLineColor: '#ff0000',  // 红色
            lineWidth: 1,
            pointRadius: 2,
            drawPoints: true,
            drawLines: true
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        if (splitResult.firstArray.length === 0 && splitResult.secondArray.length === 0) {
            console.warn('没有可绘制的线段');
            return;
        }
        
        console.log(`🎨 开始绘制切分后的线段...`);
        
        // 绘制第一条线
        if (splitResult.firstArray.length > 0) {
            this.drawContour(splitResult.firstArray, {
                color: finalOptions.firstLineColor,
                lineColor: finalOptions.firstLineColor,
                radius: finalOptions.pointRadius,
                drawLines: finalOptions.drawLines,
                lineWidth: finalOptions.lineWidth,
                drawPoints: finalOptions.drawPoints
            });
            console.log(`📏 第一条线已绘制: ${splitResult.firstArray.length} 个点，颜色: ${finalOptions.firstLineColor}`);
        }
        
        // 绘制第二条线
        if (splitResult.secondArray.length > 0) {
            this.drawContour(splitResult.secondArray, {
                color: finalOptions.secondLineColor,
                lineColor: finalOptions.secondLineColor,
                radius: finalOptions.pointRadius,
                drawLines: finalOptions.drawLines,
                lineWidth: finalOptions.lineWidth,
                drawPoints: finalOptions.drawPoints
            });
            console.log(`📏 第二条线已绘制: ${splitResult.secondArray.length} 个点，颜色: ${finalOptions.secondLineColor}`);
        }
        
        console.log(`✅ 切分线段绘制完成！`);
    }
    
    /**
     * 完整的处理流程：预处理 -> 切分 -> 绘制
     * @param {Array<{x: number, y: number}>} rawPoints - 原始边缘点
     * @param {Object} processConfig - 预处理配置（可选）
     * @param {Object} drawOptions - 绘制选项（可选）
     * @returns {Object} 切分结果
     */
    processAndSplitPoints(rawPoints, processConfig = null, drawOptions = null) {
        if (!rawPoints || rawPoints.length === 0) {
            console.warn('没有输入点进行处理');
            return null;
        }
        
        console.log(`🔧 开始完整处理流程，原始点数: ${rawPoints.length}`);
        
        // 第一步：预处理
        const defaultProcessConfig = {
            enableSort: true,
            enableCompress: true,
            tolerance: 2.0
        };
        const config = { ...defaultProcessConfig, ...processConfig };
        const processedPoints = this.preprocessEdgePoints(rawPoints, config);
        
        // 第二步：切分
        const splitResult = this.splitPointsAtRightmost(processedPoints);
        
        // 第三步：绘制
        if (drawOptions !== false) { // 如果 drawOptions 不是 false，则绘制
            this.drawSplitLines(splitResult, drawOptions);
        }
        
        return splitResult;
    }
} 