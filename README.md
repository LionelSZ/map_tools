# Map Toolbox

[中文](./README.zh.md) | English

A modern map toolkit based on Vite + Vue3, providing practical tools such as Mapbox Locator and GeoJSON Viewer.

## ✨ Features

- 🗺️ **Mapbox Locator** - Quickly locate and mark geographic coordinates
  - Batch coordinate input support
  - Click on map to add markers
  - Auto-fit view to markers
  - Coordinate format validation

- 📍 **GeoJSON Viewer** - Visualize GeoJSON data
  - Drag and drop GeoJSON files
  - Support multiple geometry types (Point, Line, Polygon)
  - Interactive feature property inspection
  - Auto-fit to data bounds

- 🌐 **Internationalization** - Chinese/English language switching
- 📱 **Responsive Design** - Perfect support for desktop and mobile
- 🎨 **Modern UI** - Clean and beautiful interface
- ⚡ **Fast** - Lightning-fast development experience with Vite

## 🚀 Quick Start

### Requirements

- Node.js 16.x or higher
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

Visit http://localhost:5173 after startup.

### Production Build

```bash
npm run build
```

Built files will be in the `dist` directory.

### Preview Build

```bash
npm run preview
```

## 📁 Project Structure

```
map_tools/
├── backup/                 # Original HTML file backups
├── public/                 # Static assets
├── src/
│   ├── assets/            # Asset files
│   ├── components/        # Vue components
│   │   ├── Layout.vue     # Main layout
│   │   ├── Sidebar.vue    # Sidebar navigation
│   │   └── LanguageSwitcher.vue  # Language switcher
│   ├── views/             # Page components
│   │   ├── MapboxLocator.vue     # Mapbox locator
│   │   └── GeoJsonViewer.vue     # GeoJSON viewer
│   ├── composables/       # Composable functions
│   │   └── useI18n.js     # Internationalization
│   ├── config/            # Configuration files
│   │   └── mapbox.js      # Mapbox config
│   ├── router/            # Router configuration
│   │   └── index.js
│   ├── styles/            # Global styles
│   │   └── main.css
│   ├── App.vue            # Root component
│   └── main.js            # Entry file
├── index.html             # HTML template
├── vite.config.js         # Vite configuration
├── package.json
└── README.md
```

## 🛠️ Tech Stack

- **Build Tool**: Vite 5.x
- **Framework**: Vue 3.x (Composition API)
- **Router**: Vue Router 4.x
- **Map Service**: Mapbox GL JS 3.1.2
- **Styling**: Vanilla CSS

## 📖 User Guide

### Mapbox Locator

1. Enter coordinates in the input box, format: `longitude, latitude`, one per line
2. Click "Go" button to display markers on the map
3. Or click directly on the map to add marker points
4. Click "Clear" button to remove all markers

**Coordinate Format Example:**
```
121.4737, 31.2304
-74.0060, 40.7128
-0.1278, 51.5074
```

### GeoJSON Viewer

1. Click or drag GeoJSON file to the upload area
2. The file will automatically display on the map after loading
3. Click on features on the map to view property information
4. Click "Clear" button to remove current data

**Supported File Formats:** `.geojson`, `.json`

## ⚙️ Configuration

### Mapbox Token

Mapbox Access Token is configured in `src/config/mapbox.js`:

```javascript
export const MapboxConfig = {
  MAPBOX_TOKEN: 'your-mapbox-token-here',
  DEFAULT_CENTER: [121.4737, 31.2304],  // Default center (Shanghai)
  DEFAULT_ZOOM: 8,                       // Default zoom level
  MAP_STYLE: 'mapbox://styles/mapbox/streets-v12'
}
```

### Default Map Settings

- **Default Center**: Shanghai (121.4737, 31.2304)
- **Default Zoom**: 8
- **Map Style**: Mapbox Streets

## 🌐 Internationalization

The project supports Chinese/English bilingual switching, with language configuration managed in `src/composables/useI18n.js`.

- Click the language switcher button in the top right corner to switch interface language
- Language preference is automatically saved to local storage
- Automatically selects language based on browser language on first visit

## 📱 Mobile Support

The application is fully responsive and works perfectly on:
- 💻 Desktop (>768px) - Sidebar always visible
- 📱 Tablet/Mobile (≤768px) - Hamburger menu with sliding sidebar
- 📱 Small phones (≤480px) - Optimized compact layout

## 📝 Development Guide

### Adding New Tools

1. Create a new Vue component in `src/views/` directory
2. Add route configuration in `src/router/index.js`
3. Add navigation link in `src/components/Sidebar.vue`
4. Add corresponding translation text in `src/composables/useI18n.js`

### Changing Map Style

Modify the `MAP_STYLE` configuration in `src/config/mapbox.js`:

```javascript
MAP_STYLE: 'mapbox://styles/mapbox/satellite-v9'  // Satellite imagery
MAP_STYLE: 'mapbox://styles/mapbox/dark-v11'      // Dark theme
```

## 📄 License

MIT License

## 🤝 Contributing

Issues and Pull Requests are welcome!

---

**Note**: Please ensure you have configured a valid Mapbox Access Token before use.
