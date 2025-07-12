/**
 * 涂鸦应用主控制器
 * 负责整体协调、UI交互和通知系统
 */
class GraffitiApp {
    constructor() {
        // 获取画布元素
        this.canvas = document.getElementById('drawingCanvas');
        
        // 初始化各个模块
        this.drawingEngine = new DrawingEngine(this.canvas);
        this.imageProcessor = new ImageProcessor(this.drawingEngine);
        this.edgeDetection = new EdgeDetectionAlgorithm(this.imageProcessor);
        this.model3D = new Model3DProcessor();
        
        // 存储最新的网格数据和厚度数据
        this.latestGridData = null;
        this.latestThicknessData = null;
        
        // 边缘绘制配置
        this.edgeDrawConfig = {
            color: '#007bff',  // 蓝色
            radius: 2,         // 点半径
            enabled: true,     // 是否自动绘制
            drawLines: true,   // 是否绘制连线
            lineWidth: 1,      // 连线宽度
            lineColor: '#007bff', // 连线颜色（默认与点颜色相同）
            drawPoints: true,  // 是否绘制点
            tolerance: 10,     // 网格生成的容差（像素）
            gridColor: '#00ff00', // 网格线颜色（绿色）
            gridLineWidth: 1,  // 网格线宽度
            drawGridPoints: false, // 是否绘制网格点
            gridPointRadius: 2, // 网格点半径
            drawSubdivisions: true, // 是否绘制6等分网格
            subdivisionColor: '#00ff00', // 等分线颜色（与主网格相同）
            subdivisionLineWidth: 1 // 等分线宽度
        };
        
        // 厚度轮廓配置
        this.thicknessConfig = {
            enabled: false,           // 是否启用厚度功能
            thicknessFunction: 'fish', // 厚度函数 ('fish', 'ellipse', 'spindle', 'leaf')
            maxThickness: 30,         // 最大厚度
            minThickness: 2,          // 最小厚度
            fillColor: '#ff6b35',     // 填充颜色（橙色）
            strokeColor: '#dc3545',   // 描边颜色（红色）
            strokeWidth: 1,           // 描边宽度
            drawOutline: true,        // 是否绘制轮廓线
            drawFill: true,           // 是否填充
            thicknessVisualization: 'gradient' // 厚度可视化方式 ('solid', 'gradient', 'shadow')
        };
        
        // 边缘点稀疏化配置
        this.edgeProcessConfig = {
            tolerance: 2.0         // 压缩容差
        };
        
        // 初始化应用
        this.initializeApp();
    }
    
    /**
     * 初始化应用
     */
    initializeApp() {
        this.bindUIEvents();

    }
    
    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        // 获取控制元素
        const colorPicker = document.getElementById('colorPicker');
        const brushSize = document.getElementById('brushSize');
        const sizeDisplay = document.getElementById('sizeDisplay');
        const gridSize = document.getElementById('gridSize');
        const gridSizeDisplay = document.getElementById('gridSizeDisplay');
        const imageUpload = document.getElementById('imageUpload');
        const edgeButton = document.getElementById('edgeDetection');
        const testThicknessButton = document.getElementById('testThickness');
        const generate3DButton = document.getElementById('generate3D');
        const close3DButton = document.getElementById('close3D');
        const test3DButton = document.getElementById('test3D');
        const export3DButton = document.getElementById('export3D');
        const clearButton = document.getElementById('clearCanvas');
        const saveButton = document.getElementById('saveCanvas');
        
        // 厚度控制元素
        const thicknessEnabled = document.getElementById('thicknessEnabled');
        const thicknessControls = document.getElementById('thicknessControls');
        const thicknessFunction = document.getElementById('thicknessFunction');
        const maxThickness = document.getElementById('maxThickness');
        const maxThicknessDisplay = document.getElementById('maxThicknessDisplay');
        const minThickness = document.getElementById('minThickness');
        const minThicknessDisplay = document.getElementById('minThicknessDisplay');
        const thicknessVisualization = document.getElementById('thicknessVisualization');
        const fillColor = document.getElementById('fillColor');
        const strokeColor = document.getElementById('strokeColor');
        
        // 颜色选择器事件
        colorPicker.addEventListener('change', (e) => {
            this.drawingEngine.setColor(e.target.value);
        });
        
        // 画笔大小调节事件
        brushSize.addEventListener('input', (e) => {
            const size = e.target.value;
            this.drawingEngine.setSize(size);
            sizeDisplay.textContent = size;
        });
        
        // 栅格大小调节事件
        gridSize.addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            this.edgeDetection.setGridSize(size);
            gridSizeDisplay.textContent = size;
        });
        
        // 厚度功能启用/禁用事件
        thicknessEnabled.addEventListener('change', (e) => {
            this.thicknessConfig.enabled = e.target.checked;
            thicknessControls.style.display = e.target.checked ? 'block' : 'none';
            
            if (e.target.checked) {
                this.showNotification('封闭图形厚度功能已启用', 'success');
            } else {
                this.showNotification('封闭图形厚度功能已禁用', 'info');
            }
        });
        
        // 厚度函数选择事件
        thicknessFunction.addEventListener('change', (e) => {
            this.thicknessConfig.thicknessFunction = e.target.value;
            
            const functionNames = {
                'fish': '鱼形',
                'ellipse': '椭圆形',
                'spindle': '纺锤形',
                'leaf': '叶子形'
            };
            
            this.showNotification(`厚度函数已设置为: ${functionNames[e.target.value]}`, 'info');
        });
        
        // 最大厚度调节事件
        maxThickness.addEventListener('input', (e) => {
            const thickness = parseInt(e.target.value);
            this.thicknessConfig.maxThickness = thickness;
            maxThicknessDisplay.textContent = thickness;
            
            // 确保最大厚度不小于最小厚度
            if (thickness <= this.thicknessConfig.minThickness) {
                this.thicknessConfig.minThickness = Math.max(1, thickness - 1);
                minThickness.value = this.thicknessConfig.minThickness;
                minThicknessDisplay.textContent = this.thicknessConfig.minThickness;
            }
        });
        
        // 最小厚度调节事件
        minThickness.addEventListener('input', (e) => {
            const thickness = parseInt(e.target.value);
            this.thicknessConfig.minThickness = thickness;
            minThicknessDisplay.textContent = thickness;
            
            // 确保最小厚度不大于最大厚度
            if (thickness >= this.thicknessConfig.maxThickness) {
                this.thicknessConfig.maxThickness = Math.min(100, thickness + 1);
                maxThickness.value = this.thicknessConfig.maxThickness;
                maxThicknessDisplay.textContent = this.thicknessConfig.maxThickness;
            }
        });
        
        // 可视化方式选择事件
        thicknessVisualization.addEventListener('change', (e) => {
            this.thicknessConfig.thicknessVisualization = e.target.value;
            
            const visualizationNames = {
                'gradient': '渐变填充',
                'solid': '纯色填充',
                'shadow': '阴影效果'
            };
            
            this.showNotification(`可视化方式已设置为: ${visualizationNames[e.target.value]}`, 'info');
        });
        
        // 填充颜色选择事件
        fillColor.addEventListener('change', (e) => {
            this.thicknessConfig.fillColor = e.target.value;
            this.showNotification('填充颜色已更新', 'info');
        });
        
        // 描边颜色选择事件
        strokeColor.addEventListener('change', (e) => {
            this.thicknessConfig.strokeColor = e.target.value;
            this.showNotification('描边颜色已更新', 'info');
        });
        
        // 图片导入事件
        imageUpload.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });
        
        // 图像描边事件
        edgeButton.addEventListener('click', () => {
            this.handleEdgeDetection();
        });
        
        // 测试厚度事件
        testThicknessButton.addEventListener('click', () => {
            this.testThicknessContour();
        });
        
        // 生成3D模型事件
        generate3DButton.addEventListener('click', () => {
            this.handle3DGeneration();
        });
        
        // 关闭3D视图事件
        close3DButton.addEventListener('click', () => {
            this.close3DView();
        });
        
        // 测试3D模型事件
        test3DButton.addEventListener('click', () => {
            this.test3DGeneration();
        });
        
        // 导出3D模型事件
        export3DButton.addEventListener('click', () => {
            this.model3D.exportModel();
            this.showNotification('3D模型截图已保存', 'success');
        });
        
        // 清空画布事件
        clearButton.addEventListener('click', () => {
            this.drawingEngine.clearCanvas();
            this.showNotification('画布已清空', 'success');
        });
        
        // 保存图片事件
        saveButton.addEventListener('click', () => {
            this.drawingEngine.saveCanvas();
            this.showNotification('图片保存成功！', 'success');
        });
    }
    
    /**
     * 处理图片上传
     */
    handleImageUpload(e) {
        const file = e.target.files[0];
        
        this.imageProcessor.handleImageUpload(
            file,
            (message) => this.showNotification(message, 'success'),
            (error) => this.showNotification(error, 'error')
        );
        
        // 清空input的值，允许重复选择同一文件
        e.target.value = '';
    }
    
    /**
     * 处理边缘检测
     * 负责协调边缘检测算法执行和结果绘制
     */
    handleEdgeDetection() {
        try {
            // 显示开始通知
            this.showNotification('开始边缘检测...', 'info');
            
            // 执行边缘检测（直接返回结果）
            const edgePoints = this.edgeDetection.detectEdges();
            
            // 处理边缘检测结果
            let processedPoints;
            let firstArray = [];
            let secondArray = [];
            let gridData = null;
            let thickContour = null;
            
            // 稀疏化边缘点：排序 + 压缩（默认都执行）
            processedPoints = this.imageProcessor.sparsifyEdgePoints(
                edgePoints, 
                this.edgeProcessConfig
            );
            
            // 切分成两条线
            if (edgePoints.length === 0) {
                throw new Error('边缘点数组为空，无法进行后续处理');
            }

            const splitResult = this.imageProcessor.splitPointsAtRightmost(processedPoints);
            firstArray = splitResult.firstArray;
            secondArray = splitResult.secondArray;
            gridData = this.imageProcessor.generateGridData(firstArray, secondArray, this.edgeDrawConfig.tolerance);

            // 保存网格数据供3D生成使用
            this.latestGridData = gridData;

            // 生成厚度轮廓数据
            if (this.thicknessConfig.enabled) {
                thickContour = this.imageProcessor.calculateContourThickness(processedPoints, {
                    thicknessFunction: this.thicknessConfig.thicknessFunction,
                    maxThickness: this.thicknessConfig.maxThickness,
                    minThickness: this.thicknessConfig.minThickness
                });

                // 保存厚度数据供3D生成使用
                this.latestThicknessData = thickContour;
            }
            
            // 根据配置决定是否绘制边缘点
            if (this.edgeDrawConfig.enabled) {
                if ((firstArray.length > 0 || secondArray.length > 0)) {
                    // 绘制第一条线
                    if (firstArray.length > 0) {
                        this.imageProcessor.drawSplitLines(firstArray, {
                            color: this.edgeDrawConfig.color,
                            lineWidth: this.edgeDrawConfig.lineWidth,
                            pointRadius: this.edgeDrawConfig.radius,
                            drawPoints: this.edgeDrawConfig.drawPoints,
                            drawLines: this.edgeDrawConfig.drawLines
                        });
                    }
                    
                    // 绘制第二条线
                    if (secondArray.length > 0) {
                        this.imageProcessor.drawSplitLines(secondArray, {
                            color: '#ff0000',  // 红色
                            lineWidth: this.edgeDrawConfig.lineWidth,
                            pointRadius: this.edgeDrawConfig.radius,
                            drawPoints: this.edgeDrawConfig.drawPoints,
                            drawLines: this.edgeDrawConfig.drawLines
                        });
                    }

                    if (gridData) {
                        this.imageProcessor.drawGrid(gridData, {
                            gridColor: this.edgeDrawConfig.gridColor,
                            gridLineWidth: this.edgeDrawConfig.gridLineWidth,
                            drawGridPoints: this.edgeDrawConfig.drawGridPoints,
                            gridPointRadius: this.edgeDrawConfig.gridPointRadius,
                            drawSubdivisions: this.edgeDrawConfig.drawSubdivisions,
                            subdivisionColor: this.edgeDrawConfig.subdivisionColor,
                            subdivisionLineWidth: this.edgeDrawConfig.subdivisionLineWidth
                        });
                    }
                     
                    // 绘制厚度轮廓
                    if (thickContour) {
                        this.imageProcessor.drawThickContour(thickContour, {
                            fillColor: this.thicknessConfig.fillColor,
                            strokeColor: this.thicknessConfig.strokeColor,
                            strokeWidth: this.thicknessConfig.strokeWidth,
                            drawOutline: this.thicknessConfig.drawOutline,
                            drawFill: this.thicknessConfig.drawFill,
                            thicknessVisualization: this.thicknessConfig.thicknessVisualization
                        });
                    }
                } else {
                    // 如果没有切分结果，使用原始方式绘制
                    this.imageProcessor.drawContour(processedPoints, this.edgeDrawConfig);
                }
            }
            
            // 构建总结性通知消息
            const processInfo = `，稀疏化后 ${processedPoints.length} 个点`;
            const splitInfo = (firstArray.length > 0 || secondArray.length > 0) ? 
                `，切分为两条线` : '';
            const gridInfo = gridData ? 
                `，生成 ${gridData.length} 组网格连接` : '';
            const thicknessInfo = thickContour ? 
                `，生成封闭图形厚度` : '';
            const drawInfo = this.edgeDrawConfig.enabled ? 
                `，已绘制` : '';
            const message = `边缘检测完成！检测到 ${edgePoints.length} 个边缘点${processInfo}${splitInfo}${gridInfo}${thicknessInfo}${drawInfo}`;
            this.showNotification(message, 'success');
            
        } catch (error) {
            console.error('边缘检测错误:', error);
            this.showNotification('边缘检测失败，请重试', 'error');
        }
    }
    
    /**
     * 设置边缘绘制配置
     * @param {Object} config - 绘制配置
     * @param {string} config.color - 边缘点颜色
     * @param {number} config.radius - 边缘点半径
     * @param {boolean} config.enabled - 是否启用自动绘制
     * @param {boolean} config.drawLines - 是否绘制连线
     * @param {number} config.lineWidth - 连线宽度
     * @param {string} config.lineColor - 连线颜色
     * @param {boolean} config.drawPoints - 是否绘制点
     */
    setEdgeDrawConfig(config) {
        this.edgeDrawConfig = { ...this.edgeDrawConfig, ...config };
    }
    
    /**
     * 设置边缘点稀疏化配置
     * @param {Object} config - 稀疏化配置
     * @param {number} config.tolerance - 压缩容差（越小保留的点越多）
     */
    setEdgeProcessConfig(config) {
        this.edgeProcessConfig = { ...this.edgeProcessConfig, ...config };
    }
    
    /**
     * 设置封闭图形厚度配置
     * @param {Object} config - 厚度配置
     * @param {boolean} config.enabled - 是否启用厚度功能
     * @param {string} config.thicknessFunction - 厚度函数 ('fish', 'ellipse', 'spindle', 'leaf')
     * @param {number} config.maxThickness - 最大厚度
     * @param {number} config.minThickness - 最小厚度
     * @param {string} config.fillColor - 填充颜色
     * @param {string} config.strokeColor - 描边颜色
     * @param {number} config.strokeWidth - 描边宽度
     * @param {boolean} config.drawOutline - 是否绘制轮廓线
     * @param {boolean} config.drawFill - 是否填充
     * @param {string} config.thicknessVisualization - 可视化方式 ('solid', 'gradient', 'shadow')
     */
    setThicknessConfig(config) {
        this.thicknessConfig = { ...this.thicknessConfig, ...config };
    }
    
    /**
     * 测试6等分网格功能
     * 创建一些测试数据并绘制6等分网格
     */
    testSubdivisionGrid() {
        // 创建测试数据：4个垂直连接
        const testGridData = [
            [{x: 100, y: 100}, {x: 100, y: 200}],  // 第一条垂直线
            [{x: 150, y: 120}, {x: 150, y: 180}],  // 第二条垂直线
            [{x: 200, y: 90}, {x: 200, y: 210}],   // 第三条垂直线
            [{x: 250, y: 110}, {x: 250, y: 190}]   // 第四条垂直线
        ];
        
        // 清空画布
        this.drawingEngine.clearCanvas();
        
        // 绘制6等分网格
        this.imageProcessor.drawGrid(testGridData, {
            gridColor: '#00ff00',          // 绿色主网格
            gridLineWidth: 2,
            drawSubdivisions: true,        // 启用6等分
            subdivisionColor: '#00ff00',   // 等分线颜色（与主网格相同）
            subdivisionLineWidth: 1,
            drawGridPoints: true,          // 显示网格点
            gridPointRadius: 3,
            gridPointColor: '#ff0000'      // 红色网格点
        });
        
        // 显示测试结果通知
        this.showNotification('6等分网格测试完成！', 'success');
    }
    
    /**
     * 测试封闭图形厚度功能
     * 创建测试数据并展示不同的厚度函数效果
     */
    testThicknessContour() {
        // 创建测试轮廓数据：一条曲线
        const testContour = [];
        for (let i = 0; i <= 20; i++) {
            const x = 100 + i * 15;
            const y = 200 + Math.sin(i * 0.3) * 30;
            testContour.push({x, y});
        }
        
        // 清空画布
        this.drawingEngine.clearCanvas();
        
        // 测试不同的厚度函数
        const thicknessFunctions = ['fish', 'ellipse', 'spindle', 'leaf'];
        const colors = ['#ff6b35', '#28a745', '#6f42c1', '#fd7e14'];
        const visualizations = ['gradient', 'solid', 'shadow', 'gradient'];
        
        for (let i = 0; i < thicknessFunctions.length; i++) {
            const offsetContour = testContour.map(point => ({
                x: point.x,
                y: point.y + i * 80 // 垂直偏移，避免重叠
            }));
            
            this.imageProcessor.processAndDrawThickContour(
                offsetContour,
                {
                    thicknessFunction: thicknessFunctions[i],
                    maxThickness: 25,
                    minThickness: 3
                },
                {
                    fillColor: colors[i],
                    strokeColor: colors[i],
                    strokeWidth: 1,
                    drawOutline: true,
                    drawFill: true,
                    thicknessVisualization: visualizations[i]
                }
            );
        }
        
        // 显示测试结果通知
        this.showNotification('封闭图形厚度测试完成！', 'success');
    }
    
    /**
     * 处理3D模型生成
     */
    handle3DGeneration() {
        if (!this.latestGridData || this.latestGridData.length === 0) {
            this.showNotification('没有网格数据可以生成3D模型，请先进行图像描边', 'warning');
            return;
        }
        
        this.showNotification('正在生成3D模型...', 'info');
        
        // 显示3D模型容器
        const modelContainer = document.getElementById('modelContainer');
        modelContainer.style.display = 'block';
        
        // 初始化3D场景
        const success = this.model3D.initScene('threejs-container');
        
        if (success) {
            // 生成3D模型
            const modelGenerated = this.model3D.generateModel(this.latestGridData, this.latestThicknessData);
            
            if (modelGenerated) {
                this.showNotification('3D模型生成成功！使用鼠标拖拽查看，滚轮缩放', 'success');
                
                // 滚动到3D模型视图
                modelContainer.scrollIntoView({ behavior: 'smooth' });
            } else {
                this.showNotification('3D模型生成失败', 'error');
                this.close3DView();
            }
        } else {
            this.showNotification('3D场景初始化失败', 'error');
            this.close3DView();
        }
    }
    
    /**
     * 关闭3D视图
     */
    close3DView() {
        const modelContainer = document.getElementById('modelContainer');
        modelContainer.style.display = 'none';
        
        // 销毁3D场景
        this.model3D.destroy();
        
        this.showNotification('3D视图已关闭', 'info');
    }
    
    /**
     * 测试3D模型生成
     */
    test3DGeneration() {
        // 创建测试网格数据
        const testGridData = [
            [{x: 100, y: 100}, {x: 100, y: 200}],
            [{x: 150, y: 120}, {x: 150, y: 180}],
            [{x: 200, y: 140}, {x: 200, y: 160}],
            [{x: 250, y: 160}, {x: 250, y: 140}],
            [{x: 300, y: 180}, {x: 300, y: 120}],
            [{x: 350, y: 200}, {x: 350, y: 100}]
        ];
        
        // 创建测试厚度数据
        const testThicknessData = {
            thicknessFunction: (t, maxThickness) => {
                // 使用鱼形厚度函数
                return maxThickness * Math.sin(Math.PI * t);
            },
            maxThickness: 30,
            minThickness: 2,
            functionName: 'fish'
        };
        
        // 保存测试数据
        this.latestGridData = testGridData;
        this.latestThicknessData = testThicknessData;
        
        // 生成3D模型
        this.handle3DGeneration();
    }

    /**
     * 显示通知消息
     */
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 添加显示动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // 3秒后自动移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.graffitiApp = new GraffitiApp();
    
    // 网格和切分功能使用示例（在浏览器控制台中运行）
    // 
    // 1. 基本切分操作（通过 imageProcessor）：
    // const points = [{x: 100, y: 100}, {x: 200, y: 150}, {x: 300, y: 100}, {x: 250, y: 200}];
    // const splitResult = graffitiApp.imageProcessor.splitPointsAtRightmost(points);
    // console.log('切分结果:', splitResult);
    //
    // 2. 生成和绘制网格：
    // const splitResult = graffitiApp.imageProcessor.splitPointsAtRightmost(points);
    // const gridData = graffitiApp.imageProcessor.generateGridData(splitResult.firstArray, splitResult.secondArray, 10);
    // graffitiApp.imageProcessor.drawGrid(gridData);
    //
         // 3. 自定义网格样式：
     // graffitiApp.imageProcessor.drawGrid(gridData, {
     //     gridColor: '#ff6b35',          // 橙色网格线
     //     gridLineWidth: 2,              // 更粗的线条
     //     drawGridPoints: true,          // 显示网格点
     //     gridPointRadius: 3,            // 更大的网格点
     //     gridPointColor: '#dc3545',     // 红色网格点
     //     drawSubdivisions: true,        // 绘制6等分网格
     //     subdivisionColor: '#ff6b35',   // 等分线颜色（与主网格相同）
     //     subdivisionLineWidth: 1        // 等分线宽度
     // });
    //
    // 4. 切分线自定义样式：
    // const splitResult = graffitiApp.imageProcessor.splitPointsAtRightmost(points);
    // // 绘制第一条线
    // graffitiApp.imageProcessor.drawSplitLines(splitResult.firstArray, {
    //     color: '#ff6b35',     // 橙色第一条线
    //     lineWidth: 3,
    //     pointRadius: 4,
    //     drawPoints: true,
    //     drawLines: true
    // });
    // // 绘制第二条线
    // graffitiApp.imageProcessor.drawSplitLines(splitResult.secondArray, {
    //     color: '#6f42c1',     // 紫色第二条线
    //     lineWidth: 3,
    //     pointRadius: 4,
    //     drawPoints: true,
    //     drawLines: true
    // });
    //
    // 5. 完整流程（稀疏化 -> 切分 -> 网格 -> 绘制）：
    // const rawPoints = [{x: 50, y: 100}, {x: 150, y: 50}, {x: 250, y: 100}, {x: 200, y: 150}];
    // const splitResult = graffitiApp.imageProcessor.processAndSplitPoints(rawPoints);
    // const gridData = graffitiApp.imageProcessor.generateGridData(splitResult.firstArray, splitResult.secondArray);
    // graffitiApp.imageProcessor.drawGrid(gridData);
    //
    // 6. 边缘检测自动处理：
    // // 边缘检测现在会自动执行：切分 -> 生成网格 -> 绘制所有内容
    // graffitiApp.handleEdgeDetection(); 
    //
         // 7. 配置6等分网格参数：
     // graffitiApp.setEdgeDrawConfig({
     //     tolerance: 15,                 // 网格生成容差
     //     gridColor: '#00ffff',          // 青色网格
     //     gridLineWidth: 2,              // 网格线宽度
     //     drawGridPoints: true,          // 显示网格点
     //     gridPointRadius: 4,            // 网格点大小
     //     drawSubdivisions: true,        // 启用6等分网格
     //     subdivisionColor: '#00ffff',   // 等分线颜色（与主网格相同）
     //     subdivisionLineWidth: 2        // 等分线宽度
     // });
    //
         // 8. 单独控制6等分网格：
     // // 只绘制主网格，不绘制6等分
     // graffitiApp.imageProcessor.drawGrid(gridData, {
     //     drawSubdivisions: false        // 关闭6等分网格
     // });
     //
     // // 只绘制6等分网格，不绘制主网格
     // graffitiApp.imageProcessor.drawGrid(gridData, {
     //     gridColor: 'transparent',      // 隐藏主网格
     //     drawSubdivisions: true,        // 启用6等分网格
     //     subdivisionColor: 'transparent', // 等分线颜色（自定义，可不同于主网格）
     //     subdivisionLineWidth: 1
     // });
     //
     // 9. 测试6等分网格功能：
     // graffitiApp.testSubdivisionGrid();
     //
     // 10. 厚度轮廓功能：
     // // 启用厚度功能
     // graffitiApp.setThicknessConfig({
     //     enabled: true,                    // 启用厚度功能
     //     thicknessFunction: 'fish',        // 使用鱼形厚度函数
     //     maxThickness: 40,                 // 最大厚度
     //     minThickness: 3,                  // 最小厚度
     //     fillColor: '#ff6b35',             // 橙色填充
     //     strokeColor: '#dc3545',           // 红色描边
     //     thicknessVisualization: 'gradient' // 渐变填充方式
     // });
     // graffitiApp.handleEdgeDetection();    // 边缘检测会自动应用厚度
     //
     // // 测试厚度轮廓功能
     // graffitiApp.testThicknessContour();
     //
     // // 手动处理厚度轮廓
     // const points = [{x: 100, y: 100}, {x: 200, y: 120}, {x: 300, y: 100}];
     // const thickContour = graffitiApp.imageProcessor.processAndDrawThickContour(
     //     points,
     //     { thicknessFunction: 'ellipse', maxThickness: 30 },
     //     { fillColor: '#28a745', thicknessVisualization: 'circle' }
     // );
     //
     // 11. 分析结果：
     // const splitResult = graffitiApp.imageProcessor.splitPointsAtRightmost(points);
     // const gridData = graffitiApp.imageProcessor.generateGridData(splitResult.firstArray, splitResult.secondArray);
     // console.log('第一条线点数:', splitResult.firstArray.length);
     // console.log('第二条线点数:', splitResult.secondArray.length);
     // console.log('网格连接数:', gridData.length);
     // console.log('6等分网格:', '每个垂直连接被分为6段，产生7个等分点，横向线与纵向线颜色一致');
}); 