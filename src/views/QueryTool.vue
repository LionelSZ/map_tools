<template>
    <div class="query-tool">
        <div id="map"></div>

        <!-- 图层管理组件 -->
        <LayerControl :current-style="currentMapStyle" @change-basemap="changeBaseMap" />

        <div class="controls-overlay">
            <h2>{{ t('queryTool') }}</h2>

            <!-- 工具选择 -->
            <div class="tool-tabs">
                <button :class="{ active: currentMode === 'attribute' }" @click="currentMode = 'attribute'">
                    {{ t('attributeQuery') }}
                </button>
                <button :class="{ active: currentMode === 'click' }" @click="setClickMode">
                    {{ t('clickQuery') }}
                </button>
                <button :class="{ active: currentMode === 'buffer' }" @click="setBufferMode">
                    {{ t('bufferQuery') }}
                </button>
            </div>

            <!-- 数据加载 -->
            <div class="input-group">
                <label>{{ t('loadData') }}</label>
                <select v-model="selectedDataset" @change="loadDataset">
                    <option value="">{{ t('selectLayer') }}</option>
                    <option value="poi">上海 POI</option>
                    <option value="districts">上海行政区划</option>
                </select>
            </div>

            <!-- 属性查询 -->
            <div v-if="currentMode === 'attribute'" class="query-section">
                <div class="input-group">
                    <label>{{ t('fieldName') }}</label>
                    <select v-model="query.field">
                        <option value="">选择字段</option>
                        <option v-for="field in availableFields" :key="field" :value="field">
                            {{ field }}
                        </option>
                    </select>
                </div>
                <div class="input-group">
                    <label>{{ t('operator') }}</label>
                    <select v-model="query.operator">
                        <option value="=">=</option>
                        <option value="!=">!=</option>
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                        <option value="contains">包含</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>{{ t('fieldValue') }}</label>
                    <input v-model="query.value" type="text" :placeholder="t('fieldValue')" />
                </div>
                <button @click="executeAttributeQuery">{{ t('executeQuery') }}</button>
            </div>


            <!-- 点选查询 -->
            <div v-if="currentMode === 'click'" class="query-section">
                <div class="info-msg">{{ t('clickFeatureToQuery') }}</div>
            </div>

            <!-- 缓冲区查询 -->
            <div v-if="currentMode === 'buffer'" class="query-section">
                <div class="info-msg">{{ t('selectPoint') }}</div>
                <div v-if="bufferCenter" class="input-group">
                    <label>{{ t('bufferRadius') }}</label>
                    <input v-model.number="bufferRadius" type="number" min="100" step="100" />
                    <button @click="executeBufferQuery">{{ t('executeQuery') }}</button>
                </div>
            </div>

            <!-- 查询结果 -->
            <div v-if="queryResults.length > 0" class="results">
                <div class="results-header">
                    <h3>{{ t('queryResults') }} ({{ queryResults.length }})</h3>
                    <button class="export-btn" @click="exportResults">{{ t('exportResults') }}</button>
                </div>
                <div class="results-list">
                    <div v-for="(result, index) in queryResults" :key="index" class="result-item"
                        @click="highlightFeature(result)">
                        <div v-for="(value, key) in result.properties" :key="key" class="prop">
                            <strong>{{ key }}:</strong> {{ value }}
                        </div>
                    </div>
                </div>
            </div>
            <div v-else-if="hasSearched" class="no-results">
                {{ t('noResults') }}
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
const currentMode = ref('attribute')
const selectedDataset = ref('')
const currentData = ref(null)
const queryResults = ref([])
const hasSearched = ref(false)
const bufferCenter = ref(null)
const bufferRadius = ref(1000)

const query = ref({
    field: '',
    operator: '=',
    value: ''
})

let map = null
let dataLayer = null
let highlightedFeature = null
let bufferMarker = null

const availableFields = computed(() => {
    if (!currentData.value || !currentData.value.features.length) return []
    const firstFeature = currentData.value.features[0]
    return Object.keys(firstFeature.properties || {})
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
    } catch (e) {
        console.error(e)
    }
}

const loadDataset = async () => {
    if (!selectedDataset.value) return

    try {
        const datasetPath = selectedDataset.value === 'poi'
            ? '/assets/shanghai_poi.geojson'
            : '/assets/shanghai_districts.geojson'

        const response = await fetch(datasetPath)
        currentData.value = await response.json()

        // 在地图上显示数据
        displayDataOnMap()
    } catch (error) {
        console.error('Failed to load dataset:', error)
    }
}

const displayDataOnMap = () => {
    if (!map || !currentData.value) return

    // 移除旧图层
    if (dataLayer) {
        if (map.getLayer('data-layer-fill')) map.removeLayer('data-layer-fill')
        if (map.getLayer('data-layer-line')) map.removeLayer('data-layer-line')
        if (map.getLayer('data-layer-circle')) map.removeLayer('data-layer-circle')
        if (map.getSource('data-source')) map.removeSource('data-source')
    }

    // 添加新图层
    map.addSource('data-source', {
        type: 'geojson',
        data: currentData.value
    })

    // 根据几何类型添加不同图层
    const firstGeometry = currentData.value.features[0]?.geometry?.type

    if (firstGeometry === 'Point' || firstGeometry === 'MultiPoint') {
        map.addLayer({
            id: 'data-layer-circle',
            type: 'circle',
            source: 'data-source',
            paint: {
                'circle-radius': 8,
                'circle-color': '#007cbf',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff'
            }
        })
    } else if (firstGeometry === 'LineString' || firstGeometry === 'MultiLineString') {
        map.addLayer({
            id: 'data-layer-line',
            type: 'line',
            source: 'data-source',
            paint: {
                'line-color': '#007cbf',
                'line-width': 3
            }
        })
    } else if (firstGeometry === 'Polygon' || firstGeometry === 'MultiPolygon') {
        map.addLayer({
            id: 'data-layer-fill',
            type: 'fill',
            source: 'data-source',
            paint: {
                'fill-color': '#007cbf',
                'fill-opacity': 0.3
            }
        })
        map.addLayer({
            id: 'data-layer-line',
            type: 'line',
            source: 'data-source',
            paint: {
                'line-color': '#007cbf',
                'line-width': 2
            }
        })
    }

    // 缩放到数据范围
    const bbox = turf.bbox(currentData.value)
    map.fitBounds(bbox, { padding: 50 })

    dataLayer = true
}

const setClickMode = () => {
    currentMode.value = 'click'
    clearResults()
}

const setBufferMode = () => {
    currentMode.value = 'buffer'
    bufferCenter.value = null
    if (bufferMarker) {
        bufferMarker.remove()
        bufferMarker = null
    }
    clearResults()
}

const handleMapClick = (e) => {
    if (currentMode.value === 'click') {
        // 点选查询
        executeClickQuery(e.point)
    } else if (currentMode.value === 'buffer' && !bufferCenter.value) {
        // 选择缓冲区中心
        bufferCenter.value = [e.lngLat.lng, e.lngLat.lat]

        if (bufferMarker) bufferMarker.remove()
        bufferMarker = new mapboxgl.Marker({ color: '#ff0000' })
            .setLngLat(bufferCenter.value)
            .addTo(map)
    }
}

const executeAttributeQuery = () => {
    if (!currentData.value || !query.value.field || !query.value.value) return

    hasSearched.value = true
    queryResults.value = []

    const results = currentData.value.features.filter(feature => {
        const propValue = feature.properties[query.value.field]
        const queryValue = query.value.value

        switch (query.value.operator) {
            case '=':
                return String(propValue) === String(queryValue)
            case '!=':
                return String(propValue) !== String(queryValue)
            case '>':
                return Number(propValue) > Number(queryValue)
            case '<':
                return Number(propValue) < Number(queryValue)
            case 'contains':
                return String(propValue).toLowerCase().includes(String(queryValue).toLowerCase())
            default:
                return false
        }
    })

    queryResults.value = results
    highlightResults(results)
}

const executeClickQuery = (point) => {
    if (!map || !dataLayer) return

    const features = map.queryRenderedFeatures(point, {
        layers: ['data-layer-circle', 'data-layer-line', 'data-layer-fill']
    })

    if (features.length > 0) {
        hasSearched.value = true
        queryResults.value = features.map(f => ({
            properties: f.properties,
            geometry: f.geometry
        }))
    }
}

const executeBufferQuery = () => {
    if (!currentData.value || !bufferCenter.value) return

    hasSearched.value = true
    queryResults.value = []

    const center = turf.point(bufferCenter.value)
    const buffered = turf.buffer(center, bufferRadius.value / 1000, { units: 'kilometers' })

    // 在地图上绘制缓冲区
    if (map.getSource('buffer-source')) {
        map.removeLayer('buffer-fill')
        map.removeLayer('buffer-line')
        map.removeSource('buffer-source')
    }

    map.addSource('buffer-source', {
        type: 'geojson',
        data: buffered
    })

    map.addLayer({
        id: 'buffer-fill',
        type: 'fill',
        source: 'buffer-source',
        paint: {
            'fill-color': '#ff0000',
            'fill-opacity': 0.2
        }
    })

    map.addLayer({
        id: 'buffer-line',
        type: 'line',
        source: 'buffer-source',
        paint: {
            'line-color': '#ff0000',
            'line-width': 2
        }
    })

    // 查找缓冲区内的要素
    const results = currentData.value.features.filter(feature => {
        const featurePoint = turf.centroid(feature)
        return turf.booleanPointInPolygon(featurePoint, buffered)
    })

    queryResults.value = results
    highlightResults(results)
}

const highlightResults = (results) => {
    if (!map) return

    // 创建高亮图层
    if (map.getSource('highlight-source')) {
        map.removeLayer('highlight-circle')
        map.removeLayer('highlight-line')
        map.removeLayer('highlight-fill')
        map.removeSource('highlight-source')
    }

    const highlightData = {
        type: 'FeatureCollection',
        features: results
    }

    map.addSource('highlight-source', {
        type: 'geojson',
        data: highlightData
    })

    map.addLayer({
        id: 'highlight-fill',
        type: 'fill',
        source: 'highlight-source',
        paint: {
            'fill-color': '#ffff00',
            'fill-opacity': 0.5
        },
        filter: ['==', ['geometry-type'], 'Polygon']
    })

    map.addLayer({
        id: 'highlight-line',
        type: 'line',
        source: 'highlight-source',
        paint: {
            'line-color': '#ffff00',
            'line-width': 4
        },
        filter: ['any',
            ['==', ['geometry-type'], 'LineString'],
            ['==', ['geometry-type'], 'Polygon']
        ]
    })

    map.addLayer({
        id: 'highlight-circle',
        type: 'circle',
        source: 'highlight-source',
        paint: {
            'circle-radius': 10,
            'circle-color': '#ffff00',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ff0000'
        },
        filter: ['==', ['geometry-type'], 'Point']
    })
}

const highlightFeature = (feature) => {
    // 缩放到要素
    const bbox = turf.bbox(feature)
    map.fitBounds(bbox, { padding: 100 })
}

const clearResults = () => {
    queryResults.value = []
    hasSearched.value = false
}

const exportResults = () => {
    const csv = convertToCSV(queryResults.value)
    downloadFile(csv, 'query_results.csv', 'text/csv')
}

const convertToCSV = (data) => {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0].properties)
    const rows = data.map(item => {
        return headers.map(header => {
            const value = item.properties[header]
            return `"${value}"`
        }).join(',')
    })

    return [headers.join(','), ...rows].join('\n')
}

const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}

const changeBaseMap = (styleId) => {
    if (!map) return
    currentMapStyle.value = styleId
    const styleUrl = `mapbox://styles/mapbox/${styleId}`
    map.setStyle(styleUrl)

    map.once('style.load', () => {
        if (currentData.value) {
            displayDataOnMap()
        }
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
.query-tool {
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
    margin: 0;
    font-size: 14px;
    color: #333;
}

.tool-tabs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin-bottom: 15px;

    button {
        padding: 8px 4px;
        background: #e0e0e0;
        color: #333;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 600;
        transition: all 0.2s;

        &:hover {
            background: #d0d0d0;
        }

        &.active {
            background: #007cbf;
            color: white;
        }
    }
}

.input-group {
    margin-bottom: 12px;

    label {
        display: block;
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
    }

    select,
    input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-sizing: border-box;
        font-size: 14px;
    }
}

.query-section {
    margin-top: 15px;

    button {
        width: 100%;
        padding: 10px;
        background: #007cbf;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;

        &:hover {
            background: #006096;
        }
    }
}

.info-msg {
    font-size: 12px;
    color: #666;
    padding: 8px;
    background: #f5f5f5;
    border-radius: 6px;
    margin-bottom: 10px;
}

.results {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #ddd;
}

.results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.export-btn {
    padding: 6px 12px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;

    &:hover {
        background: #45a049;
    }
}

.results-list {
    max-height: 300px;
    overflow-y: auto;
}

.result-item {
    background: #f9f9f9;
    padding: 10px;
    margin-bottom: 8px;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: #f0f0f0;
    }

    .prop {
        font-size: 12px;
        margin-bottom: 4px;
        color: #333;

        strong {
            color: #007cbf;
        }
    }
}

.no-results {
    text-align: center;
    color: #999;
    font-size: 13px;
    padding: 20px;
    font-style: italic;
}

@media (max-width: 768px) {
    .controls-overlay {
        left: 10px;
        right: 10px;
        top: 80px;
        width: auto;
    }

    .tool-tabs {
        grid-template-columns: 1fr;
    }
}
</style>
