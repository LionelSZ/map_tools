// Internationalization Module
const i18n = {
    // Current language
    currentLang: 'zh',

    // Translations
    translations: {
        zh: {
            // Index page
            toolbox: '工具箱',
            mapboxLocator: 'Mapbox 定位器',
            geojsonViewer: 'GeoJSON 查看器',
            moreTools: '更多工具...',
            moreToolsMsg: '更多工具即将推出！',

            // Mapbox Locator
            locationFinder: '位置查找器',
            mapboxToken: 'Mapbox Access Token',
            coordinates: '坐标 (经度, 纬度 - 每行一个)',
            coordsPlaceholder: '-74.0060, 40.7128\n-118.2437, 34.0522\n-0.1278, 51.5074',
            clickMapTip: '💡 点击地图添加点位',
            goButton: '跳转',
            clearButton: '清除',
            errorEnterCoords: '请至少输入一个坐标。',
            errorInvalidFormat: '格式无效',
            errorInvalidCoords: '坐标无效',
            errorNoValidCoords: '未找到有效坐标。',
            errorBrowserNotSupported: '您的浏览器不支持 Mapbox GL',
            errorDisplayingMarkers: '显示标记时出错。请查看控制台。',
            formatHint: '使用格式: 经度, 纬度',

            // GeoJSON Viewer
            geojsonViewerTitle: 'GeoJSON 查看器',
            uploadAreaTitle: '点击或拖拽 GeoJSON 文件至此',
            uploadAreaSubtitle: '支持 .geojson 和 .json 文件',
            totalFeatures: '总要素数:',
            featureProperties: '要素属性',
            noProperties: '无属性信息',
            errorInvalidFile: '请上传 .geojson 或 .json 文件',
            errorInvalidGeoJSON: 'GeoJSON 格式无效',
            errorMapLoading: '地图仍在加载中，请稍候...',

            // Geometry types
            geometryPoint: '点',
            geometryLineString: '线',
            geometryPolygon: '面',
            geometryMultiPoint: '多点',
            geometryMultiLineString: '多线',
            geometryMultiPolygon: '多面'
        },
        en: {
            // Index page
            toolbox: 'Toolbox',
            mapboxLocator: 'Mapbox Locator',
            geojsonViewer: 'GeoJSON Viewer',
            moreTools: 'More Tools...',
            moreToolsMsg: 'More tools coming soon!',

            // Mapbox Locator
            locationFinder: 'Location Finder',
            mapboxToken: 'Mapbox Access Token',
            coordinates: 'Coordinates (Lng, Lat - one per line)',
            coordsPlaceholder: '-74.0060, 40.7128\n-118.2437, 34.0522\n-0.1278, 51.5074',
            clickMapTip: '💡 Click on the map to add points',
            goButton: 'Go',
            clearButton: 'Clear',
            errorEnterCoords: 'Please enter at least one coordinate.',
            errorInvalidFormat: 'Invalid format',
            errorInvalidCoords: 'Invalid coordinates',
            errorNoValidCoords: 'No valid coordinates found.',
            errorBrowserNotSupported: 'Your browser does not support Mapbox GL',
            errorDisplayingMarkers: 'Error displaying markers. Check console.',
            formatHint: 'Use format: Lng, Lat',

            // GeoJSON Viewer
            geojsonViewerTitle: 'GeoJSON Viewer',
            uploadAreaTitle: 'Click or drag GeoJSON file here',
            uploadAreaSubtitle: 'Supports .geojson and .json files',
            totalFeatures: 'Total Features:',
            featureProperties: 'Feature Properties',
            noProperties: 'No properties available',
            errorInvalidFile: 'Please upload a .geojson or .json file',
            errorInvalidGeoJSON: 'Invalid GeoJSON format',
            errorMapLoading: 'Map is still loading, please wait...',

            // Geometry types
            geometryPoint: 'Point',
            geometryLineString: 'LineString',
            geometryPolygon: 'Polygon',
            geometryMultiPoint: 'MultiPoint',
            geometryMultiLineString: 'MultiLineString',
            geometryMultiPolygon: 'MultiPolygon'
        }
    },

    // Initialize
    init() {
        // Load saved language preference
        const saved = localStorage.getItem('language');
        if (saved && this.translations[saved]) {
            this.currentLang = saved;
        } else {
            // Auto-detect browser language
            const browserLang = navigator.language || navigator.userLanguage;
            if (browserLang.startsWith('zh')) {
                this.currentLang = 'zh';
            } else {
                this.currentLang = 'en';
            }
        }
    },

    // Get translation
    t(key) {
        return this.translations[this.currentLang][key] || key;
    },

    // Switch language
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('language', lang);
            return true;
        }
        return false;
    },

    // Get current language
    getLanguage() {
        return this.currentLang;
    }
};

// Initialize on load
i18n.init();
