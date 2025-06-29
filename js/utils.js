/**
 * 通用工具函数
 * 包含数学计算、格式化和其他辅助功能
 */
class Utils {
    /**
     * 计算两点之间的距离
     */
    static distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    
    /**
     * 将角度从度数转换为弧度
     */
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }
    
    /**
     * 将角度从弧度转换为度数
     */
    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }
    
    /**
     * 限制数值在指定范围内
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * 格式化文件大小
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * 格式化时间（毫秒）
     */
    static formatTime(milliseconds) {
        if (milliseconds < 1000) {
            return `${milliseconds.toFixed(2)}ms`;
        } else if (milliseconds < 60000) {
            return `${(milliseconds / 1000).toFixed(2)}s`;
        } else {
            const minutes = Math.floor(milliseconds / 60000);
            const seconds = ((milliseconds % 60000) / 1000).toFixed(2);
            return `${minutes}m ${seconds}s`;
        }
    }
    
    /**
     * 生成唯一ID
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * 深拷贝对象
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => Utils.deepClone(item));
        }
        
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = Utils.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }
    
    /**
     * 防抖函数
     */
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }
    
    /**
     * 节流函数
     */
    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * 点数据格式转换工具
     * @param {Array} points - 点数组
     * @param {string} fromFormat - 源格式 ('object'|'string'|'array')
     * @param {string} toFormat - 目标格式 ('object'|'string'|'array')
     * @returns {Array} 转换后的点数组
     */
    static convertPointsFormat(points, fromFormat, toFormat) {
        if (fromFormat === toFormat) return points;
        
        // 先转换为标准对象格式
        let objectPoints = points;
        if (fromFormat === 'string') {
            objectPoints = points.map(pointStr => {
                const [x, y] = pointStr.split(',').map(Number);
                return {x, y};
            });
        } else if (fromFormat === 'array') {
            objectPoints = points.map(pointArray => ({
                x: pointArray[0],
                y: pointArray[1]
            }));
        }
        
        // 转换为目标格式
        switch (toFormat) {
            case 'string':
                return objectPoints.map(point => `${point.x},${point.y}`);
            case 'array':
                return objectPoints.map(point => [point.x, point.y]);
            case 'object':
            default:
                return objectPoints;
        }
    }
    
    /**
     * 验证点数据格式
     * @param {Array} points - 要验证的点数组
     * @param {string} expectedFormat - 期望的格式
     * @returns {boolean} 是否符合格式
     */
    static validatePointsFormat(points, expectedFormat = 'object') {
        if (!Array.isArray(points) || points.length === 0) return false;
        
        return points.every(point => {
            switch (expectedFormat) {
                case 'object':
                    return point && typeof point.x === 'number' && typeof point.y === 'number';
                case 'string':
                    return typeof point === 'string' && /^\d+,\d+$/.test(point);
                case 'array':
                    return Array.isArray(point) && point.length === 2 && 
                           typeof point[0] === 'number' && typeof point[1] === 'number';
                default:
                    return false;
            }
        });
    }
} 