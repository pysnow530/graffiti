# Canvas 涂鸦板

一个基于HTML5 Canvas的简单涂鸦应用，支持自由绘画和基本的画笔控制功能。

## 功能特性

- 🎨 **自由绘画** - 使用鼠标或触摸屏进行绘画
- 🌈 **颜色选择** - 支持任意颜色选择
- 📏 **画笔大小** - 可调节画笔粗细（1-50px）
- 📷 **图片导入** - 支持导入本地图片进行编辑和涂鸦
- 🔍 **图像描边** - 多角度全覆盖边缘检测，用蓝点标记图像轮廓
- ⚙️ **扫描精度** - 可调节角度扫描间隔（1-20度）
- 🕸️ **智能网格** - 自动生成6等分网格，垂直连接+水平等分线
- 🔧 **网格定制** - 自定义网格颜色、线宽、容差等参数
- 🧹 **清空画布** - 一键清空所有内容
- 💾 **保存图片** - 将作品保存为PNG格式
- 📱 **移动端支持** - 支持触摸设备使用
- 🎯 **响应式设计** - 适配不同屏幕尺寸

## 如何使用

1. **开始绘画**
   - 在画布上按住鼠标左键并拖动即可开始绘画
   - 移动设备上可以用手指触摸绘画

2. **调整画笔**
   - 点击颜色选择器更换画笔颜色
   - 拖动滑块调整画笔大小

3. **导入图片**
   - 点击"导入图片"按钮选择本地图片文件
   - 支持常见图片格式（JPG、PNG、GIF等）
   - 图片会自动适应画布尺寸，保持原始比例
   - 导入后可以在图片上进行涂鸦和描边

4. **图像描边**
   - 调整"扫描精度"滑块设置角度间隔（数值越小，扫描越密集）
   - 点击"图像描边"按钮对当前画布内容进行多角度全覆盖边缘检测
   - 系统使用宽度为5个点的扫描带代替单线扫描，提供高效的边缘检测鲁棒性
   - 用蓝色圆点标记出图像的外轮廓边缘
   - **智能网格生成**：自动将轮廓切分成两条线，生成垂直连接并进行6等分
   - **网格效果**：统一绿色的垂直线和水平等分线，形成精细的网格结构

5. **管理作品**
   - 点击"清空画布"按钮清除所有内容
   - 点击"保存图片"按钮下载PNG格式的作品

## 项目结构

```
graffiti/
├── index.html              # 主页面
├── style.css               # 样式文件
├── js/                     # JavaScript模块目录
│   ├── utils.js            # 通用工具函数
│   ├── drawing-engine.js   # 画布绘图引擎
│   ├── image-processor.js  # 图像处理器
│   ├── edge-detection.js   # 边缘检测算法
│   └── graffiti-app.js     # 主应用控制器
├── script.js.backup        # 原始单文件备份
└── README.md               # 说明文档
```

## 模块化架构

### 🎨 DrawingEngine (绘图引擎)
- **职责**: 画笔绘制、画布初始化和基本操作
- **功能**: 
  - 画笔绘制 (startDrawing, draw, stopDrawing)
  - 画布操作 (initCanvas, clearCanvas, saveCanvas)
  - 鼠标/触摸事件处理
  - 画笔设置 (颜色、大小)

### 📷 ImageProcessor (图像处理器)
- **职责**: 图片导入、处理和在画布上绘制
- **功能**:
  - 图片上传和验证
  - 图片缩放和绘制到画布
  - 像素数据获取和分析
  - **智能轮廓绘制**（点+连线）
  - **路径排序算法**（最近邻）
  - **道格拉斯-普克压缩算法**
  - **轮廓切分算法**（最右侧点切分）
  - **6等分网格生成**（垂直连接+水平等分线）

### 🔍 EdgeDetectionAlgorithm (边缘检测算法)
- **职责**: 图像边缘检测和相关算法实现
- **功能**:
  - 多角度全覆盖扫描算法
  - 圆形区域像素检测
  - 性能统计和监控
  - 边缘点提取和优化
- **数据格式**: 返回结构化点对象数组 `[{x: number, y: number}, ...]`

### 🎛️ GraffitiApp (主应用控制器)
- **职责**: 整体协调、UI交互和通知系统
- **功能**:
  - 模块间协调和通信
  - UI事件绑定和处理
  - 通知系统管理
  - 应用生命周期管理
  - **边缘检测结果绘制协调**

### 🛠️ Utils (工具函数)
- **职责**: 通用辅助功能
- **功能**:
  - 数学计算函数
  - 格式化工具
  - 防抖节流函数
  - 深拷贝等通用方法

## 技术实现

- **HTML5 Canvas** - 绘图功能的核心
- **JavaScript ES6+** - 模块化类组织，职责分离
- **File API & FileReader** - 本地图片文件读取和处理
- **Image对象处理** - 图片缩放、适配和绘制
- **多角度边缘检测算法** - 基于5点宽扫描带的轻量级鲁棒性描边功能
- **Canvas ImageData API** - 像素级图像数据处理
- **CSS3** - 现代化的界面设计和通知系统
- **响应式布局** - 适配多种设备
- **结构化数据** - 边缘检测返回标准化的点对象数组
- **最近邻路径排序算法** - 将散乱的边缘点组织成连续路径
- **道格拉斯-普克压缩算法** - 智能简化路径，保持形状特征
- **轮廓切分算法** - 基于最右侧点的智能切分，将轮廓分成两条线
- **6等分网格算法** - 垂直连接点匹配+线性插值+水平等分线绘制

## 运行方法

1. 直接在浏览器中打开 `index.html` 文件即可使用
2. 或者使用本地服务器：
   ```bash
   # 使用Python简单服务器
   python -m http.server 8000
   
   # 使用Node.js服务器
   npx serve .
   ```

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 开发说明

项目采用模块化架构，代码结构清晰，职责分离，易于维护和扩展。每个模块都有明确的职责和接口，可以独立开发和测试。

### 🏗️ 架构设计原则

**职责分离 (Separation of Concerns)**：
- ✅ **算法模块**：只负责计算，不操作UI
- ✅ **绘制模块**：专注于图形渲染，不包含业务逻辑
- ✅ **控制模块**：协调各模块交互，管理应用状态
- ✅ **数据格式**：统一的结构化数据传递

**例子：边缘检测流程**
```
EdgeDetectionAlgorithm (计算) 
    ↓ 返回边缘点数组
GraffitiApp (协调)
    ↓ 调用绘制方法
ImageProcessor (渲染)
```

### 🔧 模块扩展指南

- **DrawingEngine**: 添加新的画笔样式、几何图形绘制工具
- **ImageProcessor**: 实现图像滤镜、特效处理功能、自定义网格算法
- **EdgeDetectionAlgorithm**: 集成高级边缘检测算法（Canny、Sobel等）
- **GraffitiApp**: 添加新的UI功能、键盘快捷键、撤销/重做
- **Utils**: 扩展数学工具、性能监控、调试辅助功能

### 💡 建议的功能扩展

- 不同的画笔样式和纹理
- 几何图形绘制工具
- 高级边缘检测算法（Canny、Sobel等）
- 图像滤镜和特效
- 图层功能和混合模式
- 撤销/重做功能
- 矢量图形支持
- 实时协作功能
- 可配置的网格等分数量（支持4等分、8等分、12等分等）
- 网格动画效果和过渡动画
- 网格数据导出功能（JSON、SVG格式）

### 📊 API数据格式

**边缘检测结果格式**：
```javascript
// 新格式：结构化点对象数组（推荐）
const edgePoints = [
    {x: 100, y: 50},
    {x: 105, y: 52},
    {x: 110, y: 48}
];

// 转换为其他格式
const stringFormat = edgeDetector.convertEdgePointsFormat(edgePoints, 'string');
// 结果: ["100,50", "105,52", "110,48"]

const arrayFormat = edgeDetector.convertEdgePointsFormat(edgePoints, 'array');
// 结果: [[100,50], [105,52], [110,48]]
```

**绘制控制API**：
```javascript
// 配置边缘绘制参数（支持连线和6等分网格）
app.setEdgeDrawConfig({
    color: '#ff0000',      // 红色边缘点
    radius: 2,             // 点半径
    enabled: true,         // 自动绘制
    drawLines: true,       // 绘制连线
    lineWidth: 1,          // 连线宽度
    lineColor: '#ff0000',  // 连线颜色
    drawPoints: true,      // 绘制点
    // 6等分网格相关参数
    tolerance: 10,         // 网格生成容差
    gridColor: '#00ff00',  // 网格线颜色（绿色）
    drawSubdivisions: true, // 启用6等分网格
    subdivisionColor: '#00ff00', // 等分线颜色（与主网格相同）
    subdivisionLineWidth: 1      // 等分线宽度
});

// 配置边缘点预处理参数
app.setEdgeProcessConfig({
    enableSort: true,      // 启用路径排序
    enableCompress: true,  // 启用道格拉斯-普克压缩
    tolerance: 2.0         // 压缩容差（越小保留的点越多）
});

// 手动绘制边缘点（通过 imageProcessor 直接绘制）
app.imageProcessor.drawContour(edgePoints, { 
    color: '#00ff00', 
    radius: 3,
    drawLines: true,
    drawPoints: true
});

// 只执行算法，不自动绘制
app.setEdgeDrawConfig({ enabled: false });
app.handleEdgeDetection(); // 只计算，返回数据
```

**道格拉斯-普克算法配置**：
```javascript
// 高精度模式（保留更多点）
app.setEdgeProcessConfig({ tolerance: 0.5 });

// 标准模式（平衡精度和性能）
app.setEdgeProcessConfig({ tolerance: 2.0 });

// 高压缩模式（大幅减少点数）
app.setEdgeProcessConfig({ tolerance: 5.0 });

// 只排序，不压缩
app.setEdgeProcessConfig({ 
    enableSort: true, 
    enableCompress: false 
});
```

**轮廓绘制模式**：
```javascript
// 模式1：完整轮廓（点+连线）- 默认模式
app.setEdgeDrawConfig({
    drawLines: true,
    drawPoints: true,
    lineWidth: 1
});

// 模式2：纯线条轮廓（只有连线）
app.setEdgeDrawConfig({
    drawLines: true,
    drawPoints: false,
    lineWidth: 2
});

// 模式3：点状轮廓（只有点）
app.setEdgeDrawConfig({
    drawLines: false,
    drawPoints: true,
    radius: 3
});

// 模式4：粗线轮廓（适合复杂图形）
app.setEdgeDrawConfig({
    drawLines: true,
    drawPoints: false,
    lineWidth: 3,
    lineColor: '#ff6b35'  // 橙色线条
});
```

**优势**：
- ✅ 类型安全，便于IDE提示和错误检查
- ✅ 更直观的数据结构，易于理解和使用
- ✅ 支持扩展（可添加更多属性如颜色、权重等）
- ✅ 向后兼容，`drawPoints`方法仍支持字符串格式
- ✅ **职责分离，算法与绘制解耦**
- ✅ **智能路径排序**，将散乱点组织成连续路径
- ✅ **道格拉斯-普克压缩**，大幅减少冗余点
- ✅ **可配置的预处理流程**，灵活控制处理策略
- ✅ **连线绘制功能**，形成清晰的轮廓线条
- ✅ **多种绘制模式**，适应不同的视觉需求
- ✅ **6等分网格生成**，自动创建精细网格结构
- ✅ **智能点匹配**，基于容差的连接点匹配算法
- ✅ **线性插值算法**，自动补充缺失的连接点

## 边缘检测算法优势

**5点扫描带 vs 单线扫描**：
- ✅ **良好容错性**：±2像素的容错范围，能够处理大部分位置偏差
- ✅ **稳定覆盖率**：有效检测常规线条和一般间隙情况  
- ✅ **基础稳定性**：抵抗基本的噪点和图片质量问题
- ✅ **广泛适应性**：对常见的手绘线条和图片边缘检测效果良好
- ✅ **轻量高效**：算法简洁，运行速度快，资源占用少
- ✅ **实用性强**：满足大部分日常涂鸦和图像处理需求
- ✅ **智能网格**：自动生成6等分网格，形成精细的网格结构
- ✅ **可定制性**：支持自定义网格颜色、线宽、容差等参数

### 🚀 算法进化历程

| 版本 | 检测方式 | 容错范围 | 适用场景 | 可靠性 |
|------|----------|----------|----------|--------|
| 1.0 | 单线扫描 | 0像素 | 理想线条 | ⭐⭐ |
| **2.0** | **5点扫描带** | **±2像素** | **日常使用** | **⭐⭐⭐** |
| **3.0** | **6等分网格** | **智能匹配** | **统一颜色网格** | **⭐⭐⭐⭐** |

### 🎯 5点扫描带结构示意
```
扫描方向 →
    ●    ← 点-2
    ●    ← 点-1
    ●    ← 中心（记录位置）
    ●    ← 点+1
    ●    ← 点+2
         ← 容错范围：±2像素
```

### 🕸️ 6等分网格结构示意
```
垂直连接1  垂直连接2  垂直连接3
    ●----------●----------●     ← 0/6 (起始点)
    ●----------●----------●     ← 1/6
    ●----------●----------●     ← 2/6
    ●----------●----------●     ← 3/6 (中点)
    ●----------●----------●     ← 4/6
    ●----------●----------●     ← 5/6
    ●----------●----------●     ← 6/6 (结束点)
    ↑          ↑          ↑
  绿色主网格  绿色等分线  红色网格点
```

### 🕸️ 6等分网格API

**核心功能**：
```javascript
// 手动生成和绘制6等分网格
const points = [{x: 100, y: 100}, {x: 200, y: 150}, {x: 300, y: 100}];
const splitResult = graffitiApp.imageProcessor.splitPointsAtRightmost(points);
const gridData = graffitiApp.imageProcessor.generateGridData(
    splitResult.firstArray, 
    splitResult.secondArray, 
    10  // 容差
);

// 绘制完整网格（垂直线+6等分）
graffitiApp.imageProcessor.drawGrid(gridData, {
    gridColor: '#00ff00',          // 绿色垂直线
    gridLineWidth: 2,
    drawSubdivisions: true,        // 启用6等分
    subdivisionColor: '#00ff00',   // 等分线颜色（与主网格相同）
    subdivisionLineWidth: 1,
    drawGridPoints: true,          // 显示网格点
    gridPointRadius: 3,
    gridPointColor: '#ff0000'      // 红色网格点
});

// 只绘制6等分网格，隐藏主网格
graffitiApp.imageProcessor.drawGrid(gridData, {
    gridColor: 'transparent',      // 隐藏主网格
    drawSubdivisions: true,        // 启用6等分
    subdivisionColor: '#ff6b35',   // 橙色等分线（自定义颜色）
    subdivisionLineWidth: 2
});

// 测试6等分网格功能
graffitiApp.testSubdivisionGrid();
```

**算法原理**：
1. **轮廓切分** - 找到最右侧点，将轮廓分成两条线
2. **垂直连接** - 根据X坐标和容差匹配点，形成垂直连接
3. **线性插值** - 距离较远的点进行插值，补充连接点
4. **6等分计算** - 每条垂直连接分成6等分，产生7个等分点
5. **水平连线** - 相邻垂直线的对应等分点之间绘制水平连线（与垂直线颜色一致）

**技术特点**：
- 🎯 **智能匹配** - 基于容差的点匹配算法
- 🔧 **线性插值** - 自动补充缺失的连接点
- 📐 **精确等分** - 数学计算确保等分点精度
- 🎨 **分层绘制** - 主网格、等分线、网格点分层渲染
- ⚡ **性能优化** - 批量绘制，减少Canvas操作次数
- 🌈 **颜色统一** - 横向和纵向线条使用相同颜色，保持视觉一致性

---

**Made with ❤️ 享受创作的乐趣！** 