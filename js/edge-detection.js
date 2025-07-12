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
     * @returns {Array<{x: number, y: number}>} 边缘点数组
     */
    detectEdges() {
        // 获取画布像素数据
        const imageData = this.imageProcessor.getImageData();
        const width = imageData.width;
        const height = imageData.height;
        
        // 存储边缘点
        const edgePoints = [];
        
        // 创建像素检测函数
        const isPixelNotEmpty = (x, y) => this.imageProcessor.isPixelNotEmpty(imageData, x, y);
        
        // 多角度全覆盖扫描
        const angleStep = this.gridSize;
        
        // 按角度扫描（每gridSize度扫描一次，0-180度即可覆盖所有方向）
        for (let angle = 0; angle < 180; angle += angleStep) {
            this.scanInDirection(angle, edgePoints, width, height, isPixelNotEmpty);
        }
        
        // 输出总结性日志
        console.log(`✅ 边缘检测完成！检测到 ${edgePoints.length} 个边缘点`);
        
        // 直接返回边缘点数组
        return edgePoints;
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
        
        // 在垂直方向上每隔gridSize距离放置一条扫描带（5个点宽度）
        for (let perpDist = minProj; perpDist <= maxProj; perpDist += this.gridSize) {
            // 沿扫描方向寻找边缘点
            const scanRange = Math.sqrt(width * width + height * height);
            let firstEdge = null;
            let lastEdge = null;
            
            // 正向扫描
            for (let dist = -scanRange; dist <= scanRange; dist += 1) {
                // 计算中心点
                const centerX = Math.round(perpDist * perpX + dist * dirX);
                const centerY = Math.round(perpDist * perpY + dist * dirY);
                
                // 使用函数检测圆形区域
                const detectionRadius = 2;
                if (this.hasPixelInCircle(centerX, centerY, detectionRadius, isPixelNotEmpty, width, height)) {
                    // 记录边缘点
                    const edgePoint = {x: centerX, y: centerY};
                    if (!firstEdge) {
                        firstEdge = edgePoint;
                    }
                    lastEdge = edgePoint;
                }
            }
            
            // 添加找到的边缘点（避免重复）
            if (firstEdge) {
                this.addUniquePoint(edgePoints, firstEdge);
            }
            if (lastEdge && !this.pointsEqual(lastEdge, firstEdge)) {
                this.addUniquePoint(edgePoints, lastEdge);
            }
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
    

} 