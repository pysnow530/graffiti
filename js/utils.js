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

/**
 * 3D模型处理器
 * 负责基于网格数据和厚度计算生成3D模型
 */
class Model3DProcessor {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.container = null;
        this.mesh = null;
        this.animationId = null;
        
        // 3D模型配置
        this.config = {
            scaleX: 1,
            scaleY: 1,
            scaleZ: 10,           // Z轴缩放，用于厚度效果
            baseHeight: 5,        // 基础高度
            maxHeight: 50,        // 最大高度
            segments: 10,         // 几何体分段数
            wireframe: false,     // 是否显示线框
            color: '#4CAF50',     // 模型颜色
            lightIntensity: 0.8,  // 光照强度
            cameraDistance: 200,  // 相机距离
            rotationSpeed: 0.005  // 旋转速度
        };
        
        // 控制状态
        this.isRotating = true;
        this.mouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        
        console.log('🎭 3D模型处理器已初始化');
    }
    
    /**
     * 初始化3D场景
     * @param {string} containerId - 容器ID
     */
    initScene(containerId) {
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            console.error('未找到3D容器元素');
            return false;
        }
        
        // 清空容器
        this.container.innerHTML = '';
        
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);
        
        // 创建相机
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, this.config.cameraDistance);
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        // 添加光照
        this.setupLights();
        
        // 添加坐标轴辅助线
        const axesHelper = new THREE.AxesHelper(50);
        this.scene.add(axesHelper);
        
        // 添加网格地面
        const gridHelper = new THREE.GridHelper(200, 20, 0x888888, 0xcccccc);
        this.scene.add(gridHelper);
        
        // 添加鼠标控制
        this.setupMouseControls();
        
        // 开始渲染循环
        this.animate();
        
        console.log('✅ 3D场景初始化完成');
        return true;
    }
    
    /**
     * 设置光照
     */
    setupLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        // 方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, this.config.lightIntensity);
        directionalLight.position.set(100, 100, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // 点光源
        const pointLight = new THREE.PointLight(0xffffff, 0.3, 300);
        pointLight.position.set(-50, 50, 50);
        this.scene.add(pointLight);
    }
    
    /**
     * 设置鼠标控制
     */
    setupMouseControls() {
        const canvas = this.renderer.domElement;
        
        canvas.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.isRotating = false;
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!this.mouseDown) return;
            
            const deltaX = e.clientX - this.mouseX;
            const deltaY = e.clientY - this.mouseY;
            
            // 旋转相机
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(this.camera.position);
            spherical.theta -= deltaX * 0.01;
            spherical.phi += deltaY * 0.01;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
            
            this.camera.position.setFromSpherical(spherical);
            this.camera.lookAt(0, 0, 0);
            
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        
        canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
            setTimeout(() => {
                this.isRotating = true;
            }, 1000);
        });
        
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const scale = e.deltaY > 0 ? 1.1 : 0.9;
            this.camera.position.multiplyScalar(scale);
            this.camera.position.clampLength(50, 500);
        });
    }
    
    /**
     * 基于网格数据和厚度数据生成3D模型
     * @param {Array} gridData - 网格数据
     * @param {Object} thicknessData - 厚度数据
     * @param {Object} options - 生成选项
     */
    generateModel(gridData, thicknessData, options = {}) {
        if (!gridData || gridData.length === 0) {
            console.warn('没有网格数据可以生成3D模型');
            return false;
        }
        
        console.log('🔄 开始生成3D模型...');
        console.log('网格数据:', gridData);
        console.log('厚度数据:', thicknessData);
        
        // 清除旧模型
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        
        // 生成几何体
        const geometry = this.createGeometryFromGridData(gridData, thicknessData);
        
        // 创建材质
        const material = new THREE.MeshPhongMaterial({
            color: this.config.color,
            wireframe: this.config.wireframe,
            side: THREE.DoubleSide,
            shininess: 100
        });
        
        // 创建网格
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // 添加到场景
        this.scene.add(this.mesh);
        
        // 调整相机位置以适应模型
        this.fitCameraToModel();
        
        console.log('✅ 3D模型生成完成');
        return true;
    }
    
    /**
     * 基于网格数据创建几何体
     */
    createGeometryFromGridData(gridData, thicknessData) {
        const geometry = new THREE.BufferGeometry();
        
        // 创建顶点、法线和索引数组
        const vertices = [];
        const normals = [];
        const indices = [];
        
        // 计算边界框
        const bounds = this.calculateGridBounds(gridData);
        
        // 为每个网格连接生成四边形
        for (let i = 0; i < gridData.length; i++) {
            const connection = gridData[i];
            if (!connection || connection.length !== 2) continue;
            
            const [point1, point2] = connection;
            
            // 计算厚度
            const thickness1 = this.calculateThicknessAtPoint(point1, thicknessData, bounds);
            const thickness2 = this.calculateThicknessAtPoint(point2, thicknessData, bounds);
            
            // 生成四边形的顶点
            const quad = this.createQuadFromConnection(point1, point2, thickness1, thickness2);
            
            // 添加顶点
            const startIndex = vertices.length / 3;
            for (const vertex of quad.vertices) {
                vertices.push(vertex.x, vertex.y, vertex.z);
            }
            
            // 添加法线
            for (const normal of quad.normals) {
                normals.push(normal.x, normal.y, normal.z);
            }
            
            // 添加索引（两个三角形组成四边形）
            indices.push(
                startIndex, startIndex + 1, startIndex + 2,
                startIndex, startIndex + 2, startIndex + 3
            );
        }
        
        // 设置几何体属性
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setIndex(indices);
        
        // 计算边界球
        geometry.computeBoundingSphere();
        
        return geometry;
    }
    
    /**
     * 计算网格边界框
     */
    calculateGridBounds(gridData) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        for (const connection of gridData) {
            if (!connection || connection.length !== 2) continue;
            
            for (const point of connection) {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            }
        }
        
        return {
            minX, maxX, minY, maxY,
            width: maxX - minX,
            height: maxY - minY,
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2
        };
    }
    
    /**
     * 计算指定点的厚度
     */
    calculateThicknessAtPoint(point, thicknessData, bounds) {
        if (!thicknessData || !thicknessData.thicknessFunction) {
            return this.config.baseHeight;
        }
        
        // 计算点在边界框中的相对位置 (0-1)
        const t = (point.x - bounds.minX) / bounds.width;
        const normalizedT = Math.max(0, Math.min(1, t));
        
        // 应用厚度函数
        const thickness = thicknessData.thicknessFunction(normalizedT, thicknessData.maxThickness);
        
        return this.config.baseHeight + (thickness / thicknessData.maxThickness) * this.config.maxHeight;
    }
    
    /**
     * 从连接创建四边形
     */
    createQuadFromConnection(point1, point2, thickness1, thickness2) {
        // 转换2D坐标到3D（Y轴向上）
        const x1 = point1.x - 400; // 居中
        const y1 = 300 - point1.y; // Y轴翻转
        // 以z=0为中心对称
        const z1_bottom = -thickness1 / 2;
        const z1_top = thickness1 / 2;

        const x2 = point2.x - 400; // 居中
        const y2 = 300 - point2.y; // Y轴翻转
        const z2_bottom = -thickness2 / 2;
        const z2_top = thickness2 / 2;

        // 四边形的四个顶点
        const vertices = [
            { x: x1, y: y1, z: z1_bottom },  // 左下
            { x: x2, y: y2, z: z2_bottom },  // 右下
            { x: x2, y: y2, z: z2_top },     // 右上
            { x: x1, y: y1, z: z1_top }      // 左上
        ];

        // 计算法线
        const v1 = new THREE.Vector3(x2 - x1, y2 - y1, z2_bottom - z1_bottom);
        const v2 = new THREE.Vector3(0, 0, z1_top - z1_bottom);
        const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();

        const normals = [
            normal, normal, normal, normal
        ];

        return { vertices, normals };
    }
    
    /**
     * 调整相机位置以适应模型
     */
    fitCameraToModel() {
        if (!this.mesh) return;
        
        // 计算模型边界框
        const box = new THREE.Box3().setFromObject(this.mesh);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // 计算合适的相机距离
        const maxSize = Math.max(size.x, size.y, size.z);
        const distance = maxSize * 2;
        
        // 更新相机位置
        this.camera.position.set(distance, distance, distance);
        this.camera.lookAt(center);
        
        console.log('📸 相机位置已调整以适应模型');
    }
    
    /**
     * 动画循环
     */
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // 自动旋转
        if (this.isRotating && this.mesh) {
            this.mesh.rotation.y += this.config.rotationSpeed;
        }
        
        // 渲染场景
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * 销毁3D场景
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        console.log('🗑️ 3D场景已销毁');
    }
    
    /**
     * 导出3D模型
     */
    exportModel() {
        if (!this.mesh) {
            console.warn('没有3D模型可以导出');
            return;
        }
        
        // 这里可以添加导出功能，比如导出为STL或OBJ格式
        console.log('📤 3D模型导出功能待实现');
        
        // 简单的截图功能
        const canvas = this.renderer.domElement;
        const link = document.createElement('a');
        link.download = '3d-model-screenshot.png';
        link.href = canvas.toDataURL();
        link.click();
    }
} 