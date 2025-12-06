import { reactive, computed } from 'vue'

// Translation data
const translations = {
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
        geometryMultiPolygon: '多面',

        // Layer Control
        layerControl: '图层管理',
        baseMapStyle: '底图样式',
        layers: '图层',
        enable3DTerrain: '启用 3D 地形',
        styleStreets: '街道',
        styleSatellite: '卫星',
        styleDark: '深色',
        styleLight: '浅色',
        styleOutdoors: '户外',
        styleSatelliteStreets: '卫星街道'
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
        geometryMultiPolygon: 'MultiPolygon',

        // Layer Control
        layerControl: 'Layer Control',
        baseMapStyle: 'Base Map Style',
        layers: 'Layers',
        enable3DTerrain: 'Enable 3D Terrain',
        styleStreets: 'Streets',
        styleSatellite: 'Satellite',
        styleDark: 'Dark',
        styleLight: 'Light',
        styleOutdoors: 'Outdoors',
        styleSatelliteStreets: 'Satellite Streets'
    }
}

// Initialize language from localStorage or browser
const initLanguage = () => {
    const saved = localStorage.getItem('language')
    if (saved && translations[saved]) {
        return saved
    }
    const browserLang = navigator.language || navigator.userLanguage
    return browserLang.startsWith('zh') ? 'zh' : 'en'
}

// Reactive i18n state
const i18nState = reactive({
    currentLang: initLanguage()
})

export function useI18n() {
    // Get translated text
    const t = (key) => {
        return translations[i18nState.currentLang][key] || key
    }

    // Get current language
    const locale = computed(() => i18nState.currentLang)

    // Switch language
    const setLanguage = (lang) => {
        if (translations[lang]) {
            i18nState.currentLang = lang
            localStorage.setItem('language', lang)
            return true
        }
        return false
    }

    // Toggle language
    const toggleLanguage = () => {
        const newLang = i18nState.currentLang === 'zh' ? 'en' : 'zh'
        setLanguage(newLang)
    }

    return {
        t,
        locale,
        setLanguage,
        toggleLanguage
    }
}
