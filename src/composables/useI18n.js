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
        styleSatelliteStreets: '卫星街道',

        // Measurement Tool
        measurementTool: '测量工具',
        measureArea: '面积测量',
        measureDistance: '长度测量',
        measurePerimeter: '周长测量',
        coordinatePicker: '坐标拾取',
        startMeasuring: '开始测量',
        clearMeasurements: '清除测量',
        measurementResults: '测量结果',
        area: '面积',
        distance: '距离',
        perimeter: '周长',
        clickToStart: '点击地图开始绘制',
        clickToContinue: '继续点击添加点位，双击完成',
        clickToPickCoord: '点击地图拾取坐标',
        copyCoordinate: '复制坐标',
        coordinateCopied: '坐标已复制',
        noMeasurements: '暂无测量记录',

        // Query Tool
        queryTool: '查询工具',
        attributeQuery: '属性查询',
        clickQuery: '点选查询',
        bufferQuery: '缓冲区查询',
        loadData: '加载数据',
        selectLayer: '选择图层',
        queryCondition: '查询条件',
        fieldName: '字段名',
        operator: '操作符',
        fieldValue: '字段值',
        executeQuery: '执行查询',
        bufferRadius: '缓冲半径（米）',
        queryResults: '查询结果',
        foundFeatures: '找到 {count} 个要素',
        noResults: '未找到匹配的要素',
        exportResults: '导出结果',
        clickFeatureToQuery: '点击地图上的要素进行查询',
        selectPoint: '选择中心点',
        pointSelected: '已选择点位',

        // Edit Tool
        editTool: '编辑工具',
        drawPoint: '绘制点',
        drawLine: '绘制线',
        drawPolygon: '绘制面',
        editFeature: '编辑要素',
        deleteFeature: '删除要素',
        featureProperties: '要素属性',
        addProperty: '添加属性',
        propertyName: '属性名',
        propertyValue: '属性值',
        saveProperties: '保存属性',
        exportGeoJSON: '导出 GeoJSON',
        importGeoJSON: '导入 GeoJSON',
        clearAll: '清除全部',
        undoEdit: '撤销',
        redoEdit: '重做',
        selectFeatureToEdit: '选择要素进行编辑',
        featureSelected: '已选择要素',
        noFeatures: '暂无要素',
        confirmClear: '确定要清除所有要素吗？',
        exportSuccess: '导出成功',
        importSuccess: '导入成功',

        // Coordinate Converter
        coordinateConverter: '坐标转换',
        sourceCoordSystem: '源坐标系',
        targetCoordSystem: '目标坐标系',
        inputCoordinates: '输入坐标',
        convertedCoordinates: '转换结果',
        singleConvert: '单点转换',
        batchConvert: '批量转换',
        convertButton: '转换',
        copyResult: '复制结果',
        clearInput: '清除',
        wgs84: 'WGS84 (GPS)',
        gcj02: 'GCJ-02 (国测局)',
        bd09: 'BD-09 (百度)',
        webMercator: 'Web Mercator',
        cgcs2000: 'CGCS2000',
        inputFormat: '输入格式：经度, 纬度',
        batchInputHint: '每行一个坐标对',
        conversionComplete: '转换完成',
        invalidCoordinate: '无效的坐标格式',

        // Geocoder
        geocoder: '地理编码',
        forwardGeocoding: '地址 → 坐标',
        reverseGeocoding: '坐标 → 地址',
        inputAddress: '输入地址',
        inputCoordinate: '输入坐标',
        searchButton: '搜索',
        searchResults: '搜索结果',
        addressResult: '地址',
        coordinateResult: '坐标',
        searchHistory: '搜索历史',
        clearHistory: '清除历史',
        noHistory: '暂无搜索历史',
        selectResult: '选择结果',
        addressNotFound: '未找到地址',
        coordinateNotFound: '未找到坐标',
        clickMapToGeocode: '点击地图获取地址',
        batchGeocode: '批量编码',
        exportAsCSV: '导出为 CSV',
        exportAsGeoJSON: '导出为 GeoJSON'
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
        styleSatelliteStreets: 'Satellite Streets',

        // Measurement Tool
        measurementTool: 'Measurement Tool',
        measureArea: 'Measure Area',
        measureDistance: 'Measure Distance',
        measurePerimeter: 'Measure Perimeter',
        coordinatePicker: 'Coordinate Picker',
        startMeasuring: 'Start Measuring',
        clearMeasurements: 'Clear Measurements',
        measurementResults: 'Measurement Results',
        area: 'Area',
        distance: 'Distance',
        perimeter: 'Perimeter',
        clickToStart: 'Click on map to start drawing',
        clickToContinue: 'Continue clicking to add points, double-click to finish',
        clickToPickCoord: 'Click on map to pick coordinates',
        copyCoordinate: 'Copy Coordinate',
        coordinateCopied: 'Coordinate Copied',
        noMeasurements: 'No measurements yet',

        // Query Tool
        queryTool: 'Query Tool',
        attributeQuery: 'Attribute Query',
        clickQuery: 'Click Query',
        bufferQuery: 'Buffer Query',
        loadData: 'Load Data',
        selectLayer: 'Select Layer',
        queryCondition: 'Query Condition',
        fieldName: 'Field Name',
        operator: 'Operator',
        fieldValue: 'Field Value',
        executeQuery: 'Execute Query',
        bufferRadius: 'Buffer Radius (meters)',
        queryResults: 'Query Results',
        foundFeatures: 'Found {count} features',
        noResults: 'No matching features found',
        exportResults: 'Export Results',
        clickFeatureToQuery: 'Click on a feature to query',
        selectPoint: 'Select Center Point',
        pointSelected: 'Point Selected',

        // Edit Tool
        editTool: 'Edit Tool',
        drawPoint: 'Draw Point',
        drawLine: 'Draw Line',
        drawPolygon: 'Draw Polygon',
        editFeature: 'Edit Feature',
        deleteFeature: 'Delete Feature',
        featureProperties: 'Feature Properties',
        addProperty: 'Add Property',
        propertyName: 'Property Name',
        propertyValue: 'Property Value',
        saveProperties: 'Save Properties',
        exportGeoJSON: 'Export GeoJSON',
        importGeoJSON: 'Import GeoJSON',
        clearAll: 'Clear All',
        undoEdit: 'Undo',
        redoEdit: 'Redo',
        selectFeatureToEdit: 'Select feature to edit',
        featureSelected: 'Feature Selected',
        noFeatures: 'No features yet',
        confirmClear: 'Are you sure you want to clear all features?',
        exportSuccess: 'Export Successful',
        importSuccess: 'Import Successful',

        // Coordinate Converter
        coordinateConverter: 'Coordinate Converter',
        sourceCoordSystem: 'Source Coordinate System',
        targetCoordSystem: 'Target Coordinate System',
        inputCoordinates: 'Input Coordinates',
        convertedCoordinates: 'Converted Coordinates',
        singleConvert: 'Single Convert',
        batchConvert: 'Batch Convert',
        convertButton: 'Convert',
        copyResult: 'Copy Result',
        clearInput: 'Clear',
        wgs84: 'WGS84 (GPS)',
        gcj02: 'GCJ-02 (China)',
        bd09: 'BD-09 (Baidu)',
        webMercator: 'Web Mercator',
        cgcs2000: 'CGCS2000',
        inputFormat: 'Input format: Longitude, Latitude',
        batchInputHint: 'One coordinate pair per line',
        conversionComplete: 'Conversion Complete',
        invalidCoordinate: 'Invalid coordinate format',

        // Geocoder
        geocoder: 'Geocoder',
        forwardGeocoding: 'Address → Coordinate',
        reverseGeocoding: 'Coordinate → Address',
        inputAddress: 'Input Address',
        inputCoordinate: 'Input Coordinate',
        searchButton: 'Search',
        searchResults: 'Search Results',
        addressResult: 'Address',
        coordinateResult: 'Coordinate',
        searchHistory: 'Search History',
        clearHistory: 'Clear History',
        noHistory: 'No search history',
        selectResult: 'Select Result',
        addressNotFound: 'Address not found',
        coordinateNotFound: 'Coordinate not found',
        clickMapToGeocode: 'Click on map to get address',
        batchGeocode: 'Batch Geocode',
        exportAsCSV: 'Export as CSV',
        exportAsGeoJSON: 'Export as GeoJSON'
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
