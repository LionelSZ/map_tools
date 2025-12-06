<template>
    <div class="measurement-tool">
        <div id="map"></div>

        <!-- 图层管理组件 -->
        <LayerControl :current-style="currentMapStyle" @change-basemap="changeBaseMap" />

        <div class="controls-overlay">
            <h2>{{ t('measurementTool') }}</h2>

            <div class="tool-buttons">
                <button :class="{ active: currentTool === 'area' }" @click="setTool('area')">
                    {{ t('measureArea') }}
                </button>
                <button :class="{ active: currentTool === 'distance' }" @click="setTool('distance')">
                    {{ t('measureDistance') }}
                </button>
                <button :class="{ active: currentTool === 'picker' }" @click="setTool('picker')">
                    {{ t('coordinatePicker') }}
                </button>
            </div>

            <div class="info-msg">
                <template v-if="currentTool === 'area'">
                    {{ clickToStartOrFinish }}
                </template>
                <template v-else-if="currentTool === 'distance'">
                    {{ clickToStartOrFinish }}
                </template>
                <template v-else-if="currentTool === 'picker'">
                    {{ t('clickToPickCoord') }}
                </template>
                <template v-else>
                    请选择一个测量工具
                </template>
            </div>

            <button class="secondary" @click="clearMeasurements">{{ t('clearMeasurements') }}</button>

            <!-- 测量结果 -->
            <div v-if="measurements.length > 0" class="results">
                <h3>{{ t('measurementResults') }}</h3>
                <div v-for="(m, index) in measurements" :key="index" class="result-item">
                    <div class="result-header">
                        <span class="result-type">{{ getTypeLabel(m.type) }}</span>
                        <button class="delete-btn" @click="deleteMeasurement(index)">×</button>
                    </div>
                    <div class="result-value">
                        <template v-if="m.type === 'area'">
                            {{ formatArea(m.value) }}
                        </template>
                        <template v-else-if="m.type === 'distance'">
                            {{ formatDistance(m.value) }}
                        </template>
                        <template v-else-if="m.type === 'coordinate'">
                            <div class="coord-display">
                                {{ m.value[0].toFixed(6) }}, {{ m.value[1].toFixed(6) }}
                                <button class="copy-btn" @click="copyCoordinate(m.value)">📋</button>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
            <div v-else class="no-results">
                {{ t('noMeasurements') }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import mapboxgl from 'mapbox-gl'
import * as turf from '@turf/turf'
import { MapboxConfig } from '@/config/mapbox'
import { useI18n } from '@/composables/useI18n'
import LayerControl from '@/components/LayerControl.vue'

const { t } = useI18n()

const currentMapStyle = ref('streets-v12')
const currentTool = ref(null)
const measurements = ref([])
const drawingPoints = ref([])

let map = null
let tempMarkers = []
let tempLines = []
let tempPolygons = []

const clickToStartOrFinish = computed(() => {
    if (drawingPoints.value.length === 0) {
        return t('clickToStart')
    }
    return t('clickToContinue')
})

const initMap = () => {
    if (map) return

    try {
        mapboxgl.accessToken = MapboxConfig.MAPBOX_TOKEN
        map = new mapboxgl.Map({
            container: 'map',
            style: MapboxConfig.MAP_STYLE,
            center: MapboxConfig.DEFAULT_CENTER,
            zoom: MapboxConfig.DEFAULT_ZOOM
        })

        map.on('load', () => {
            console.log('Map loaded')
        })

        map.on('click', handleMapClick)
        map.on('dblclick', handleMapDblClick)
    } catch (e) {
        console.error(e)
    }
}

const setTool = (tool) => {
    // 清除正在绘制的内容
    clearDrawing()
    currentTool.value = tool
}

const handleMapClick = (e) => {
    if (!currentTool.value) return

    const { lng, lat } = e.lngLat

    if (currentTool.value === 'picker') {
        // 坐标拾取
        const marker = new mapboxgl.Marker({ color: '#007cbf' })
            .setLngLat([lng, lat])
            .addTo(map)

        tempMarkers.push(marker)

        measurements.value.push({
            type: 'coordinate',
            value: [lng, lat]
        })
    } else if (currentTool.value === 'area' || currentTool.value === 'distance') {
        // 添加点
        drawingPoints.value.push([lng, lat])

        // 添加标记
        const marker = new mapboxgl.Marker({ color: '#ff0000', scale: 0.7 })
            .setLngLat([lng, lat])
            .addTo(map)

        tempMarkers.push(marker)

        // 绘制线或面预览
        updateDrawingPreview()
    }
}

const handleMapDblClick = (e) => {
    e.preventDefault()

    if (!currentTool.value || drawingPoints.value.length < 2) return

    if (currentTool.value === 'area') {
        // 完成面积测量
        if (drawingPoints.value.length >= 3) {
            const polygon = turf.polygon([[...drawingPoints.value, drawingPoints.value[0]]])
            const area = turf.area(polygon)

            measurements.value.push({
                type: 'area',
                value: area,
                geometry: polygon
            })

            // 在地图上绘制多边形
            drawPolygonOnMap(drawingPoints.value)
        }
    } else if (currentTool.value === 'distance') {
        // 完成长度测量
        const line = turf.lineString(drawingPoints.value)
        const length = turf.length(line, { units: 'meters' })

        measurements.value.push({
            type: 'distance',
            value: length,
            geometry: line
        })

        // 在地图上绘制线
        drawLineOnMap(drawingPoints.value)
    }

    clearDrawing()
}

const updateDrawingPreview = () => {
    if (drawingPoints.value.length < 2) return

    // 清除旧的预览
    tempLines.forEach(line => line.remove())
    tempLines = []

    // 绘制预览线
    const coordinates = drawingPoints.value.map(coord => ({
        lng: coord[0],
        lat: coord[1]
    }))

    // 创建SVG线条效果（简化版）
    for (let i = 0; i < coordinates.length - 1; i++) {
        const start = coordinates[i]
        const end = coordinates[i + 1]

        // 使用Mapbox GL的Popup来模拟线条（这是一个简化方案）
        // 实际应用中应该使用自定义图层
    }
}

const drawLineOnMap = (coordinates) => {
    const lineId = `line-${Date.now()}`

    map.addSource(lineId, {
        type: 'geojson',
        data: {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates
            }
        }
    })

    map.addLayer({
        id: lineId,
        type: 'line',
        source: lineId,
        paint: {
            'line-color': '#007cbf',
            'line-width': 3
        }
    })

    tempLines.push({
        id: lineId, remove: () => {
            if (map.getLayer(lineId)) map.removeLayer(lineId)
            if (map.getSource(lineId)) map.removeSource(lineId)
        }
    })
}

const drawPolygonOnMap = (coordinates) => {
    const polygonId = `polygon-${Date.now()}`

    map.addSource(polygonId, {
        type: 'geojson',
        data: {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [[...coordinates, coordinates[0]]]
            }
        }
    })

    map.addLayer({
        id: `${polygonId}-fill`,
        type: 'fill',
        source: polygonId,
        paint: {
            'fill-color': '#007cbf',
            'fill-opacity': 0.3
        }
    })

    map.addLayer({
        id: `${polygonId}-outline`,
        type: 'line',
        source: polygonId,
        paint: {
            'line-color': '#007cbf',
            'line-width': 3
        }
    })

    tempPolygons.push({
        id: polygonId,
        remove: () => {
            if (map.getLayer(`${polygonId}-fill`)) map.removeLayer(`${polygonId}-fill`)
            if (map.getLayer(`${polygonId}-outline`)) map.removeLayer(`${polygonId}-outline`)
            if (map.getSource(polygonId)) map.removeSource(polygonId)
        }
    })
}

const clearDrawing = () => {
    drawingPoints.value = []
    tempMarkers.forEach(marker => marker.remove())
    tempMarkers = []
}

const clearMeasurements = () => {
    measurements.value = []
    clearDrawing()

    tempLines.forEach(line => line.remove())
    tempLines = []

    tempPolygons.forEach(polygon => polygon.remove())
    tempPolygons = []
}

const deleteMeasurement = (index) => {
    measurements.value.splice(index, 1)
}

const formatArea = (area) => {
    if (area < 10000) {
        return `${area.toFixed(2)} m²`
    } else {
        return `${(area / 1000000).toFixed(4)} km²`
    }
}

const formatDistance = (distance) => {
    if (distance < 1000) {
        return `${distance.toFixed(2)} m`
    } else {
        return `${(distance / 1000).toFixed(3)} km`
    }
}

const getTypeLabel = (type) => {
    const labels = {
        area: t('area'),
        distance: t('distance'),
        coordinate: t('coordinatePicker')
    }
    return labels[type] || type
}

const copyCoordinate = async (coords) => {
    const text = `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`
    try {
        await navigator.clipboard.writeText(text)
        alert(t('coordinateCopied'))
    } catch (err) {
        console.error('Failed to copy:', err)
    }
}

const changeBaseMap = (styleId) => {
    if (!map) return

    currentMapStyle.value = styleId
    const styleUrl = `mapbox://styles/mapbox/${styleId}`
    map.setStyle(styleUrl)

    // 样式加载后重新添加图层
    map.once('style.load', () => {
        tempLines.forEach(line => {
            // 重新添加线图层
        })
        tempPolygons.forEach(polygon => {
            // 重新添加面图层
        })
    })
}

onMounted(() => {
    initMap()
})

onUnmounted(() => {
    if (map) {
        map.remove()
        map = null
    }
})
</script>

<style scoped lang="scss">
.measurement-tool {
    position: relative;
    width: 100%;
    height: 100%;
}

#map {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 100%;
}

.controls-overlay {
    position: absolute;
    top: 20px;
    left: 20px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    width: 320px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    z-index: 1;
}

h2 {
    margin: 0 0 15px 0;
    font-size: 18px;
    color: #333;
}

h3 {
    margin: 15px 0 10px 0;
    font-size: 14px;
    color: #333;
}

.tool-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 12px;
}

button {
    padding: 10px;
    background: #e0e0e0;
    color: #333;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    font-size: 13px;

    &:hover {
        background: #d0d0d0;
    }

    &.active {
        background: #007cbf;
        color: white;
    }

    &.secondary {
        background: #f44336;
        color: white;
        grid-column: 1 / -1;

        &:hover {
            background: #d32f2f;
        }
    }
}

.info-msg {
    font-size: 12px;
    color: #666;
    margin-bottom: 12px;
    padding: 8px;
    background: #f5f5f5;
    border-radius: 6px;
    font-style: italic;
}

.results {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #ddd;
}

.result-item {
    background: #f9f9f9;
    padding: 10px;
    margin-bottom: 8px;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
}

.result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
}

.result-type {
    font-size: 12px;
    font-weight: 600;
    color: #007cbf;
}

.delete-btn {
    background: #ff5252;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    padding: 0;
    transition: background 0.2s;

    &:hover {
        background: #d32f2f;
    }
}

.result-value {
    font-size: 14px;
    color: #333;
    font-weight: 500;
}

.coord-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: monospace;
}

.copy-btn {
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.2s;

    &:hover {
        background: #45a049;
    }
}

.no-results {
    text-align: center;
    color: #999;
    font-size: 13px;
    padding: 20px;
    font-style: italic;
}

/* 移动端适配 */
@media (max-width: 768px) {
    .controls-overlay {
        left: 10px;
        right: 10px;
        top: 80px;
        width: auto;
        max-width: calc(100vw - 20px);
    }

    .tool-buttons {
        grid-template-columns: 1fr;
    }
}
</style>
