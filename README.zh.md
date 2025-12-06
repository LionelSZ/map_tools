# Map Toolbox - Mapbox 工具箱

中文 | [English](./README.md)

一个基于 Vite + Vue3 的现代化地图工具集，提供 Mapbox 定位器和 GeoJSON 查看器等实用工具。

## ✨ 功能特性

- 🗺️ **Mapbox 定位器** - 快速查找和标记地理坐标
  - 支持批量坐标输入
  - 点击地图添加标记点
  - 自动适配视图范围
  - 坐标格式验证

- 📍 **GeoJSON 查看器** - 可视化 GeoJSON 数据
  - 拖拽上传 GeoJSON 文件
  - 支持多种几何类型（点、线、面）
  - 交互式要素属性查看
  - 自动适配数据范围

- 🌐 **国际化支持** - 中英文双语切换
- 📱 **响应式设计** - 完美支持桌面端和移动端
- 🎨 **现代化界面** - 简洁美观的 UI 设计
- ⚡ **快速响应** - Vite 提供极速的开发体验

## 🚀 快速开始

### 环境要求

- Node.js 16.x 或更高版本
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

启动后访问 http://localhost:5173 即可使用。

### 生产构建

```bash
npm run build
```

构建后的文件位于 `dist` 目录。

### 预览构建

```bash
npm run preview
```

## 📁 项目结构

```
map_tools/
├── backup/                 # 原有 HTML 文件备份
├── public/                 # 静态资源
├── src/
│   ├── assets/            # 资源文件
│   ├── components/        # Vue 组件
│   │   ├── Layout.vue     # 主布局
│   │   ├── Sidebar.vue    # 侧边栏
│   │   └── LanguageSwitcher.vue  # 语言切换器
│   ├── views/             # 页面组件
│   │   ├── MapboxLocator.vue     # Mapbox 定位器
│   │   └── GeoJsonViewer.vue     # GeoJSON 查看器
│   ├── composables/       # 组合式函数
│   │   └── useI18n.js     # 国际化
│   ├── config/            # 配置文件
│   │   └── mapbox.js      # Mapbox 配置
│   ├── router/            # 路由配置
│   │   └── index.js
│   ├── styles/            # 全局样式
│   │   └── main.css
│   ├── App.vue            # 根组件
│   └── main.js            # 入口文件
├── index.html             # HTML 模板
├── vite.config.js         # Vite 配置
├── package.json
└── README.md
```

## 🛠️ 技术栈

- **构建工具**: Vite 5.x
- **前端框架**: Vue 3.x (Composition API)
- **路由管理**: Vue Router 4.x
- **地图服务**: Mapbox GL JS 3.1.2
- **样式方案**: Vanilla CSS

## 📖 使用指南

### Mapbox 定位器

1. 在输入框中输入坐标，格式为 `经度, 纬度`，每行一个
2. 点击"跳转"按钮在地图上显示标记
3. 或直接点击地图添加标记点
4. 点击"清除"按钮清空所有标记

**坐标格式示例：**
```
121.4737, 31.2304
-74.0060, 40.7128
-0.1278, 51.5074
```

### GeoJSON 查看器

1. 点击或拖拽 GeoJSON 文件到上传区域
2. 文件加载后会自动在地图上显示
3. 点击地图上的要素查看属性信息
4. 点击"清除"按钮移除当前数据

**支持的文件格式：** `.geojson`, `.json`

## ⚙️ 配置说明

### Mapbox Token

Mapbox Access Token 配置在 `src/config/mapbox.js` 文件中：

```javascript
export const MapboxConfig = {
  MAPBOX_TOKEN: 'your-mapbox-token-here',
  DEFAULT_CENTER: [121.4737, 31.2304],  // 默认中心点（上海）
  DEFAULT_ZOOM: 8,                       // 默认缩放级别
  MAP_STYLE: 'mapbox://styles/mapbox/streets-v12'
}
```

### 默认地图设置

- **默认中心点**: 上海（121.4737, 31.2304）
- **默认缩放级别**: 8
- **地图样式**: Mapbox Streets

## 🌐 国际化

项目支持中英文双语切换，语言配置在 `src/composables/useI18n.js` 中管理。

- 点击右上角的语言切换按钮可切换界面语言
- 语言偏好会自动保存到本地存储
- 首次访问时根据浏览器语言自动选择

## 📱 移动端支持

应用完全响应式，在以下设备上完美运行：
- 💻 桌面端 (>768px) - 侧边栏始终可见
- 📱 平板/移动端 (≤768px) - 汉堡菜单控制侧边栏滑动
- 📱 小屏手机 (≤480px) - 优化的紧凑布局

## 📝 开发指南

### 添加新工具

1. 在 `src/views/` 目录下创建新的 Vue 组件
2. 在 `src/router/index.js` 中添加路由配置
3. 在 `src/components/Sidebar.vue` 中添加导航链接
4. 在 `src/composables/useI18n.js` 中添加相应的翻译文本

### 修改地图样式

修改 `src/config/mapbox.js` 中的 `MAP_STYLE` 配置：

```javascript
MAP_STYLE: 'mapbox://styles/mapbox/satellite-v9'  // 卫星影像
MAP_STYLE: 'mapbox://styles/mapbox/dark-v11'      // 深色主题
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**注意**: 使用前请确保已配置有效的 Mapbox Access Token。
