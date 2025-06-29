/**
 * 边缘检测算法
 * 负责图像边缘检测和相关算法实现
 * 
 * 设计原则：
 * - 只负责算法计算，不直接操作画布绘制
 * - 返回结构化的边缘点数据，由调用方决定如何处理
 * - 提供详细的性能统计信息
 */
class EdgeDetectionAlgorithm {
    constructor(imageProcessor) {
        this.imageProcessor = imageProcessor;
        this.gridSize = 5; // 默认栅格大小
    }
    
    /**
     * 设置栅格大小
     */
    setGridSize(size) {
        this.gridSize = size;
    }
    
    /**
     * 执行边缘检测算法
     * @param {Function} onProgress - 进度回调函数 (current, total, angle)
     * @param {Function} onComplete - 完成回调函数 (edgePoints, stats)
     *   - edgePoints: Array<{x: number, y: number}> 边缘点对象数组
     *   - stats: 性能统计对象
     * @param {Function} onError - 错误回调函数 (error)
     */
    detectEdges(onProgress, onComplete, onError) {
        try {
            // === 性能计时开始 ===
            const totalStartTime = performance.now();
            console.log('🔍 开始边缘检测算法...');
            
            // 获取画布像素数据
            const imageDataStartTime = performance.now();
            const imageData = this.imageProcessor.getImageData();
            const width = imageData.width;
            const height = imageData.height;
            const imageDataTime = performance.now() - imageDataStartTime;
            console.log(`📊 获取图像数据耗时: ${imageDataTime.toFixed(2)}ms`);
            
            // 存储边缘点
            const edgePoints = [];
            
            // 创建像素检测函数
            const isPixelNotEmpty = (x, y) => this.imageProcessor.isPixelNotEmpty(imageData, x, y);
            
            // 多角度全覆盖扫描
            const angleStep = this.gridSize;
            const totalAngles = Math.ceil(180 / angleStep);
            console.log(`🎯 开始多角度扫描，角度步长: ${angleStep}°, 总角度数: ${totalAngles}`);
            
            const scanStartTime = performance.now();
            let angleCount = 0;
            const angleTimings = [];
            
            // 按角度扫描（每gridSize度扫描一次，0-180度即可覆盖所有方向）
            for (let angle = 0; angle < 180; angle += angleStep) {
                const angleStartTime = performance.now();
                const initialEdgeCount = edgePoints.length;
                
                this.scanInDirection(angle, edgePoints, width, height, isPixelNotEmpty);
                
                const angleTime = performance.now() - angleStartTime;
                const newEdgeCount = edgePoints.length - initialEdgeCount;
                angleTimings.push({angle, time: angleTime, newEdges: newEdgeCount});
                angleCount++;
                
                // 进度回调
                if (onProgress) {
                    onProgress(angleCount, totalAngles, angle);
                }
                
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
            
            // 边缘检测算法完成，不在此处绘制
            // 绘制操作将由 GraffitiApp 统一协调处理
            
            // === 性能计时结束 ===
            const totalTime = performance.now() - totalStartTime;
            const performanceStats = {
                totalTime,
                edgePointsCount: edgePoints.length,
                processingEfficiency: (edgePoints.length / totalTime * 1000).toFixed(0),
                pixelProcessingSpeed: ((width * height) / totalTime * 1000).toFixed(0),
                angleTimings,
                scanTime: totalScanTime
            };
            
            this.logPerformanceStats(performanceStats);
            
            // 完成回调
            if (onComplete) {
                onComplete(edgePoints, performanceStats);
            }
            
        } catch (error) {
            console.error('边缘检测错误:', error);
            if (onError) {
                onError(error);
            }
        }
    }
    
    /**
     * 检查圆形区域内是否有像素点
     */
    hasPixelInCircle(centerX, centerY, radius, isPixelNotEmpty, width, height) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (Math.abs(dx) + Math.abs(dy) <= radius) { // 使用曼哈顿距离近似欧几里得距离
                    const x = centerX + dx;
                    const y = centerY + dy;
                    if (x >= 0 && x < width && y >= 0 && y < height) {
                        if (isPixelNotEmpty(x, y)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
    
    /**
     * 在指定角度方向进行全覆盖扫描
     */
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
                
                // 使用函数检测圆形区域
                const detectionRadius = 2;
                if (this.hasPixelInCircle(centerX, centerY, detectionRadius, isPixelNotEmpty, width, height)) {
                    linePixelsChecked++;

                    // 记录边缘点
                    const edgePoint = {x: centerX, y: centerY};
                    if (!firstEdge) {
                        firstEdge = edgePoint;
                    }
                    lastEdge = edgePoint;
                }
            }
            
            totalPixelsChecked += linePixelsChecked;
            
            // 添加找到的边缘点（避免重复）
            if (firstEdge) {
                this.addUniquePoint(edgePoints, firstEdge);
                totalEdgePointsFound++;
            }
            if (lastEdge && !this.pointsEqual(lastEdge, firstEdge)) {
                this.addUniquePoint(edgePoints, lastEdge);
                totalEdgePointsFound++;
            }
        }
        
        // 输出详细的角度统计（仅对关键角度）
        if (angleDegrees % 30 === 0 || angleDegrees < 10) {
            console.log(`    🔎 角度 ${angleDegrees}°: 扫描线 ${totalScanLines} 条, 检测像素 ${totalPixelsChecked} 个, 发现边缘点 ${totalEdgePointsFound} 个`);
        }
    }
    
    /**
     * 判断两个点是否相等
     */
    pointsEqual(point1, point2) {
        return point1.x === point2.x && point1.y === point2.y;
    }
    
    /**
     * 添加唯一点到数组（避免重复）
     */
    addUniquePoint(points, newPoint) {
        // 检查是否已存在相同的点
        const exists = points.some(point => this.pointsEqual(point, newPoint));
        if (!exists) {
            points.push(newPoint);
        }
    }
    
    /**
     * 将边缘点转换为不同格式
     * @param {Array<{x: number, y: number}>} edgePoints - 边缘点数组
     * @param {'object'|'string'|'array'} format - 输出格式
     * @returns {Array} 转换后的数据
     */
    convertEdgePointsFormat(edgePoints, format = 'object') {
        switch (format) {
            case 'string':
                return edgePoints.map(point => `${point.x},${point.y}`);
            case 'array':
                return edgePoints.map(point => [point.x, point.y]);
            case 'object':
            default:
                return edgePoints; // 已经是对象格式
        }
    }
    
    /**
     * 输出性能统计信息
     */
    logPerformanceStats(stats) {
        console.log('='.repeat(50));
        console.log(`✅ 边缘检测算法完成！`);
        console.log(`📊 总耗时: ${stats.totalTime.toFixed(2)}ms`);
        console.log(`📊 检测到边缘点: ${stats.edgePointsCount} 个`);
        console.log(`📊 处理效率: ${stats.processingEfficiency} 点/秒`);
        console.log(`📊 像素处理速度: ${stats.pixelProcessingSpeed} 像素/秒`);
        console.log('='.repeat(50));
    }
} 