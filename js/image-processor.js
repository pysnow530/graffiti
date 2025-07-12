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

    /**
     * 根据两个数组生成网格数据
     * @param {Array<{x: number, y: number}>} arr1 - 第一个数组
     * @param {Array<{x: number, y: number}>} arr2 - 第二个数组
     * @param {number} tolerance - 容差
     * @returns {Array<Array<{x: number, y: number}>>} 网格数据
     */
    generateGridData(arr1, arr2, tolerance = 10) {
        const virticalGroups = [];
        
        let idx1 = 1;
        let idx2 = 1;

        while (idx1 < arr1.length-1 && idx2 < arr2.length-1) {
            // 1. 距离足够近的点，归为一组
            if (Math.abs(arr1[idx1].x - arr2[idx2].x) < tolerance) {
                virticalGroups.push([arr1[idx1], arr2[idx2]]);
                idx1++;
                idx2++;
                continue;
            }

            // 2. 如果距离不够近，则补充点位置
            if (arr1[idx1].x < arr2[idx2].x) {
                const xNew = arr1[idx1].x;
                const [xNext, yNext] = [arr2[idx2].x, arr2[idx2].y];
                const [xPrev, yPrev] = [arr2[idx2-1].x, arr2[idx2-1].y];
                const yNew = yPrev + (yNext - yPrev) * (xNew - xPrev) / (xNext - xPrev);
                virticalGroups.push([arr1[idx1], {x: xNew, y: yNew}]);
                idx1++;
            } else {
                const xNew = arr2[idx2].x;
                const [xNext, yNext] = [arr1[idx1].x, arr1[idx1].y];
                const [xPrev, yPrev] = [arr1[idx1-1].x, arr1[idx1-1].y];
                const yNew = yPrev + (yNext - yPrev) * (xNew - xPrev) / (xNext - xPrev);
                virticalGroups.push([{x: xNew, y: yNew}, arr2[idx2]]);
                idx2++;
                         }
         }
         
         console.log(`🔗 生成网格数据完成，共 ${virticalGroups.length} 组连接点`);
         return virticalGroups;
     }
    
    /**
     * 绘制网格连线
     * @param {Array<Array<{x: number, y: number}>>} gridData - 网格数据，每个元素包含两个点
     * @param {Object} options - 绘制配置
     * @param {string} options.gridColor - 网格线颜色（默认绿色）
     * @param {number} options.gridLineWidth - 网格线宽度（默认1）
     * @param {boolean} options.drawGridPoints - 是否绘制网格点（默认false）
     * @param {number} options.gridPointRadius - 网格点半径（默认2）
     * @param {string} options.gridPointColor - 网格点颜色（默认与网格线相同）
     * @param {boolean} options.drawSubdivisions - 是否绘制6等分网格（默认true）
     * @param {string} options.subdivisionColor - 等分线颜色（默认与主网格相同）
     * @param {number} options.subdivisionLineWidth - 等分线宽度（默认1）
     */
    drawGrid(gridData, options = {}) {
        if (!gridData || gridData.length === 0) {
            console.warn('没有网格数据可以绘制');
            return;
        }
        
                 const defaultOptions = {
             gridColor: '#00ff00',          // 绿色
             gridLineWidth: 1,
             drawGridPoints: false,
             gridPointRadius: 2,
             gridPointColor: null,          // 默认与网格线颜色相同
             drawSubdivisions: true,        // 是否绘制6等分网格
             subdivisionColor: '#00ff00',   // 等分线颜色（与主网格相同）
             subdivisionLineWidth: 1        // 等分线宽度
         };
        
        const finalOptions = { ...defaultOptions, ...options };
        finalOptions.gridPointColor = finalOptions.gridPointColor || finalOptions.gridColor;
        
        console.log(`🎯 开始绘制网格，共 ${gridData.length} 条连线`);
        
        // 保存当前绘图状态
        const originalStrokeStyle = this.ctx.strokeStyle;
        const originalFillStyle = this.ctx.fillStyle;
        const originalLineWidth = this.ctx.lineWidth;
        const originalLineCap = this.ctx.lineCap;
        
        // 设置网格线样式
        this.ctx.strokeStyle = finalOptions.gridColor;
        this.ctx.lineWidth = finalOptions.gridLineWidth;
        this.ctx.lineCap = 'round';
        
        // 绘制主要的垂直连线
        let drawnLines = 0;
        for (const pointPair of gridData) {
            if (pointPair && pointPair.length === 2) {
                const [point1, point2] = pointPair;
                
                if (point1 && point2 && 
                    typeof point1.x === 'number' && typeof point1.y === 'number' &&
                    typeof point2.x === 'number' && typeof point2.y === 'number') {
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(point1.x, point1.y);
                    this.ctx.lineTo(point2.x, point2.y);
                    this.ctx.stroke();
                    drawnLines++;
                }
            }
        }
        
        // 绘制6等分网格
        if (finalOptions.drawSubdivisions) {
            this.drawSubdivisionGrid(gridData, finalOptions);
        }
        
        // 绘制网格点（如果启用）
        if (finalOptions.drawGridPoints) {
            this.ctx.fillStyle = finalOptions.gridPointColor;
            this.ctx.strokeStyle = finalOptions.gridPointColor;
            
            let drawnPoints = 0;
            for (const pointPair of gridData) {
                if (pointPair && pointPair.length === 2) {
                    const [point1, point2] = pointPair;
                    
                    // 绘制第一个点
                    if (point1 && typeof point1.x === 'number' && typeof point1.y === 'number') {
                        this.ctx.beginPath();
                        this.ctx.arc(point1.x, point1.y, finalOptions.gridPointRadius, 0, 2 * Math.PI);
                        this.ctx.fill();
                        drawnPoints++;
                    }
                    
                    // 绘制第二个点
                    if (point2 && typeof point2.x === 'number' && typeof point2.y === 'number') {
                        this.ctx.beginPath();
                        this.ctx.arc(point2.x, point2.y, finalOptions.gridPointRadius, 0, 2 * Math.PI);
                        this.ctx.fill();
                        drawnPoints++;
                    }
                }
            }
            console.log(`📍 绘制了 ${drawnPoints} 个网格点`);
        }
        
        // 恢复原始绘图状态
        this.ctx.strokeStyle = originalStrokeStyle;
        this.ctx.fillStyle = originalFillStyle;
        this.ctx.lineWidth = originalLineWidth;
        this.ctx.lineCap = originalLineCap;
        
        console.log(`✅ 网格绘制完成！绘制了 ${drawnLines} 条垂直连线，颜色: ${finalOptions.gridColor}`);
    }
    
    /**
     * 绘制6等分细分网格
     * @param {Array<Array<{x: number, y: number}>>} gridData - 网格数据
     * @param {Object} options - 绘制配置
     */
    drawSubdivisionGrid(gridData, options) {
        if (!gridData || gridData.length < 2) {
            console.warn('需要至少2组数据才能绘制等分网格');
            return;
        }
        
        console.log(`🔷 开始绘制6等分网格`);
        
        // 设置等分线样式（使用与主网格相同的颜色）
        this.ctx.strokeStyle = options.gridColor;
        this.ctx.lineWidth = options.subdivisionLineWidth;
        
        // 计算每组的6等分点
        const subdivisionPoints = [];
        for (let i = 0; i < gridData.length; i++) {
            const pointPair = gridData[i];
            if (pointPair && pointPair.length === 2) {
                const [point1, point2] = pointPair;
                
                if (point1 && point2 && 
                    typeof point1.x === 'number' && typeof point1.y === 'number' &&
                    typeof point2.x === 'number' && typeof point2.y === 'number') {
                    
                    const divisions = this.calculateSubdivisionPoints(point1, point2, 6);
                    subdivisionPoints.push(divisions);
                }
            }
        }
        
        console.log(`📐 计算了 ${subdivisionPoints.length} 组等分点，每组 ${subdivisionPoints[0] ? subdivisionPoints[0].length : 0} 个点`);
        
        // 绘制相邻组之间的水平连线
        let horizontalLines = 0;
        for (let i = 0; i < subdivisionPoints.length - 1; i++) {
            const currentDivisions = subdivisionPoints[i];
            const nextDivisions = subdivisionPoints[i + 1];
            
            if (currentDivisions && nextDivisions && 
                currentDivisions.length === nextDivisions.length) {
                
                // 为每个等分点绘制水平连线
                for (let j = 0; j < currentDivisions.length; j++) {
                    const startPoint = currentDivisions[j];
                    const endPoint = nextDivisions[j];
                    
                    if (startPoint && endPoint) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(startPoint.x, startPoint.y);
                        this.ctx.lineTo(endPoint.x, endPoint.y);
                        this.ctx.stroke();
                        horizontalLines++;
                    }
                }
            }
        }
        
        console.log(`🔗 绘制了 ${horizontalLines} 条水平等分连线`);
    }
    
    /**
     * 计算两点之间的n等分点
     * @param {Object} point1 - 起始点 {x, y}
     * @param {Object} point2 - 结束点 {x, y}
     * @param {number} divisions - 等分数量
     * @returns {Array<{x: number, y: number}>} 等分点数组（包含起始点和结束点）
     */
    calculateSubdivisionPoints(point1, point2, divisions) {
        const points = [];
        
        for (let i = 0; i <= divisions; i++) {
            const ratio = i / divisions;
            const x = point1.x + (point2.x - point1.x) * ratio;
            const y = point1.y + (point2.y - point1.y) * ratio;
            points.push({ x, y });
        }
        
        return points;
    }
     
     /**
      * 根据轮廓位置计算厚度的函数集合
      */
     static thicknessFunctions = {
         /**
          * 鱼形厚度函数 - 头尖、身体厚、尾巴细
          * @param {number} t - 位置参数 (0-1)
          * @param {number} maxThickness - 最大厚度
          * @returns {number} 厚度值
          */
         fish: (t, maxThickness) => {
             // 鱼形：头部尖(0.1)，身体厚(0.3-0.7)，尾部细
             if (t < 0.1) {
                 // 头部：从0逐渐增加到最大厚度的60%
                 return maxThickness * 0.6 * (t / 0.1);
             } else if (t < 0.3) {
                 // 前身：从60%增加到100%
                 return maxThickness * (0.6 + 0.4 * ((t - 0.1) / 0.2));
             } else if (t < 0.7) {
                 // 身体中部：保持最大厚度
                 return maxThickness;
             } else if (t < 0.9) {
                 // 后身：从100%减少到30%
                 return maxThickness * (1 - 0.7 * ((t - 0.7) / 0.2));
             } else {
                 // 尾部：从30%减少到10%
                 return maxThickness * (0.3 - 0.2 * ((t - 0.9) / 0.1));
             }
         },
         
         /**
          * 椭圆形厚度函数 - 中间厚，两端细
          * @param {number} t - 位置参数 (0-1)
          * @param {number} maxThickness - 最大厚度
          * @returns {number} 厚度值
          */
         ellipse: (t, maxThickness) => {
             return maxThickness * Math.sin(Math.PI * t);
         },
         
         /**
          * 纺锤形厚度函数 - 渐变更平滑
          * @param {number} t - 位置参数 (0-1)
          * @param {number} maxThickness - 最大厚度
          * @returns {number} 厚度值
          */
         spindle: (t, maxThickness) => {
             // 使用平滑的三次函数
             const smoothT = 3 * t * t - 2 * t * t * t; // 平滑插值
             return maxThickness * Math.sin(Math.PI * smoothT);
         },
         
         /**
          * 叶子形厚度函数 - 一端尖，一端圆
          * @param {number} t - 位置参数 (0-1)
          * @param {number} maxThickness - 最大厚度
          * @returns {number} 厚度值
          */
         leaf: (t, maxThickness) => {
             return maxThickness * Math.sqrt(t * (1 - t * t));
         }
     };
     
     /**
      * 计算封闭图形的厚度填充数据
      * @param {Array<{x: number, y: number}>} contour - 轮廓点数组
      * @param {Object} options - 厚度配置
      * @param {string} options.thicknessFunction - 厚度函数名 ('fish', 'ellipse', 'spindle', 'leaf')
      * @param {number} options.maxThickness - 最大厚度
      * @param {number} options.minThickness - 最小厚度
      * @returns {Object} 厚度填充数据
      */
     calculateContourThickness(contour, options = {}) {
         const defaultOptions = {
             thicknessFunction: 'fish',
             maxThickness: 20,
             minThickness: 2
         };
         
         const finalOptions = { ...defaultOptions, ...options };
         
         if (!contour || contour.length === 0) {
             return null;
         }
         
         console.log(`📏 开始计算封闭图形厚度，使用 ${finalOptions.thicknessFunction} 函数`);
         
         // 确保轮廓是封闭的
         const closedContour = this.ensureClosedContour(contour);
         
         // 计算边界框
         const bounds = this.calculateBounds(closedContour);
         
         // 根据厚度函数计算填充区域
         const thicknessData = this.calculateRegionThickness(closedContour, bounds, finalOptions);
         
         console.log(`✅ 封闭图形厚度计算完成`);
         return thicknessData;
     }
     
     /**
      * 确保轮廓是封闭的
      * @param {Array<{x: number, y: number}>} contour - 原始轮廓
      * @returns {Array<{x: number, y: number}>} 封闭的轮廓
      */
     ensureClosedContour(contour) {
         if (contour.length < 3) {
             return contour;
         }
         
         const firstPoint = contour[0];
         const lastPoint = contour[contour.length - 1];
         
         // 如果首尾点距离较远，添加闭合点
         const distance = this.getDistance(firstPoint, lastPoint);
         if (distance > 5) {
             return [...contour, firstPoint];
         }
         
         return contour;
     }
     
     /**
      * 计算边界框
      * @param {Array<{x: number, y: number}>} points - 点数组
      * @returns {Object} 边界框 {minX, maxX, minY, maxY, width, height}
      */
     calculateBounds(points) {
         if (points.length === 0) {
             return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
         }
         
         let minX = points[0].x;
         let maxX = points[0].x;
         let minY = points[0].y;
         let maxY = points[0].y;
         
         for (const point of points) {
             minX = Math.min(minX, point.x);
             maxX = Math.max(maxX, point.x);
             minY = Math.min(minY, point.y);
             maxY = Math.max(maxY, point.y);
         }
         
         return {
             minX,
             maxX,
             minY,
             maxY,
             width: maxX - minX,
             height: maxY - minY,
             centerX: (minX + maxX) / 2,
             centerY: (minY + maxY) / 2
         };
     }
     
     /**
      * 计算区域厚度数据
      * @param {Array<{x: number, y: number}>} contour - 封闭轮廓
      * @param {Object} bounds - 边界框
      * @param {Object} options - 厚度选项
      * @returns {Object} 厚度数据
      */
     calculateRegionThickness(contour, bounds, options) {
         let thicknessFunc = ImageProcessor.thicknessFunctions[options.thicknessFunction];
         if (!thicknessFunc) {
             console.warn(`未知的厚度函数: ${options.thicknessFunction}，使用默认的 fish 函数`);
             thicknessFunc = ImageProcessor.thicknessFunctions.fish;
         }
         
         return {
             contour: contour,
             bounds: bounds,
             thicknessFunction: thicknessFunc,
             maxThickness: options.maxThickness,
             minThickness: options.minThickness,
             functionName: options.thicknessFunction
         };
     }

     /**
      * 绘制带厚度的封闭图形
      * @param {Object} thicknessData - 厚度数据
      * @param {Object} options - 绘制选项
      * @param {string} options.fillColor - 填充颜色
      * @param {string} options.strokeColor - 描边颜色
      * @param {number} options.strokeWidth - 描边宽度
      * @param {boolean} options.drawOutline - 是否绘制轮廓线
      * @param {boolean} options.drawFill - 是否填充
      * @param {string} options.thicknessVisualization - 厚度可视化方式 ('solid', 'gradient', 'shadow')
      */
     drawThickContour(thicknessData, options = {}) {
         const defaultOptions = {
             fillColor: '#ff6b35',
             strokeColor: '#dc3545',
             strokeWidth: 1,
             drawOutline: true,
             drawFill: true,
             thicknessVisualization: 'gradient'
         };
         
         const finalOptions = { ...defaultOptions, ...options };
         
         if (!thicknessData || !thicknessData.contour) {
             console.warn('没有厚度数据可以绘制');
             return;
         }
         
         console.log(`🎨 开始绘制带厚度的封闭图形，使用 ${finalOptions.thicknessVisualization} 效果`);
         
         // 保存绘图状态
         const originalFillStyle = this.ctx.fillStyle;
         const originalStrokeStyle = this.ctx.strokeStyle;
         const originalLineWidth = this.ctx.lineWidth;
         
         // 根据可视化方式绘制
         switch (finalOptions.thicknessVisualization) {
             case 'solid':
                 this.drawSolidRegion(thicknessData, finalOptions);
                 break;
             case 'gradient':
                 this.drawGradientRegion(thicknessData, finalOptions);
                 break;
             case 'shadow':
                 this.drawShadowRegion(thicknessData, finalOptions);
                 break;
             default:
                 this.drawGradientRegion(thicknessData, finalOptions);
         }
         
         // 恢复绘图状态
         this.ctx.fillStyle = originalFillStyle;
         this.ctx.strokeStyle = originalStrokeStyle;
         this.ctx.lineWidth = originalLineWidth;
         
         console.log(`✅ 封闭图形厚度绘制完成，使用 ${finalOptions.thicknessVisualization} 方式`);
     }
     
     /**
      * 绘制纯色填充的封闭图形
      * @private
      */
     drawSolidRegion(thicknessData, options) {
         const { contour } = thicknessData;
         
         // 绘制基础填充
         this.ctx.beginPath();
         this.ctx.moveTo(contour[0].x, contour[0].y);
         
         for (let i = 1; i < contour.length; i++) {
             this.ctx.lineTo(contour[i].x, contour[i].y);
         }
         
         this.ctx.closePath();
         
         if (options.drawFill) {
             this.ctx.fillStyle = options.fillColor;
             this.ctx.fill();
         }
         
         if (options.drawOutline) {
             this.ctx.strokeStyle = options.strokeColor;
             this.ctx.lineWidth = options.strokeWidth;
             this.ctx.stroke();
         }
     }
     
     /**
      * 绘制渐变填充的封闭图形（模拟厚度效果）
      * @private
      */
     drawGradientRegion(thicknessData, options) {
         const { contour, bounds, thicknessFunction, maxThickness } = thicknessData;
         
         // 创建径向渐变效果
         const gradient = this.ctx.createRadialGradient(
             bounds.centerX, bounds.centerY, 0,
             bounds.centerX, bounds.centerY, Math.max(bounds.width, bounds.height) / 2
         );
         
         // 根据厚度函数设置渐变颜色
         const baseColor = this.hexToRgb(options.fillColor);
         const steps = 10;
         
         for (let i = 0; i <= steps; i++) {
             const t = i / steps;
             const thickness = thicknessFunction(t, maxThickness);
             const alpha = 0.2 + (thickness / maxThickness) * 0.8; // 根据厚度调整透明度
             
             gradient.addColorStop(t, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${alpha})`);
         }
         
         // 绘制填充区域
         this.ctx.beginPath();
         this.ctx.moveTo(contour[0].x, contour[0].y);
         
         for (let i = 1; i < contour.length; i++) {
             this.ctx.lineTo(contour[i].x, contour[i].y);
         }
         
         this.ctx.closePath();
         
         if (options.drawFill) {
             this.ctx.fillStyle = gradient;
             this.ctx.fill();
         }
         
         if (options.drawOutline) {
             this.ctx.strokeStyle = options.strokeColor;
             this.ctx.lineWidth = options.strokeWidth;
             this.ctx.stroke();
         }
     }
     
     /**
      * 绘制阴影效果的封闭图形（模拟立体厚度）
      * @private
      */
     drawShadowRegion(thicknessData, options) {
         const { contour, bounds, thicknessFunction, maxThickness } = thicknessData;
         
         // 计算阴影偏移
         const shadowOffset = maxThickness * 0.3;
         
         // 先绘制阴影
         this.ctx.beginPath();
         this.ctx.moveTo(contour[0].x + shadowOffset, contour[0].y + shadowOffset);
         
         for (let i = 1; i < contour.length; i++) {
             this.ctx.lineTo(contour[i].x + shadowOffset, contour[i].y + shadowOffset);
         }
         
         this.ctx.closePath();
         
         // 阴影填充
         this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
         this.ctx.fill();
         
         // 再绘制主体
         this.ctx.beginPath();
         this.ctx.moveTo(contour[0].x, contour[0].y);
         
         for (let i = 1; i < contour.length; i++) {
             this.ctx.lineTo(contour[i].x, contour[i].y);
         }
         
         this.ctx.closePath();
         
         if (options.drawFill) {
             this.ctx.fillStyle = options.fillColor;
             this.ctx.fill();
         }
         
         if (options.drawOutline) {
             this.ctx.strokeStyle = options.strokeColor;
             this.ctx.lineWidth = options.strokeWidth;
             this.ctx.stroke();
         }
     }
     
     /**
      * 将十六进制颜色转换为RGB
      * @param {string} hex - 十六进制颜色值
      * @returns {Object} RGB颜色对象
      */
     hexToRgb(hex) {
         const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
         return result ? {
             r: parseInt(result[1], 16),
             g: parseInt(result[2], 16),
             b: parseInt(result[3], 16)
         } : { r: 255, g: 107, b: 53 }; // 默认橙色
     }
     
     /**
      * 完整的厚度轮廓处理流程
      * @param {Array<{x: number, y: number}>} contour - 原始轮廓点
      * @param {Object} thicknessOptions - 厚度计算选项
      * @param {Object} drawOptions - 绘制选项
      * @returns {Object} 厚度数据
      */
     processAndDrawThickContour(contour, thicknessOptions = {}, drawOptions = {}) {
         console.log(`🔄 开始处理带厚度的封闭图形，输入 ${contour.length} 个点`);
         
         // 1. 计算厚度数据
         const thicknessData = this.calculateContourThickness(contour, thicknessOptions);
         
         // 2. 绘制厚度图形
         if (thicknessData) {
             this.drawThickContour(thicknessData, drawOptions);
         }
         
         console.log(`✅ 厚度图形处理完成`);
         return thicknessData;
     }
}