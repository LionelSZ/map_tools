<template>
    <div class="edit-tool">
        <div id="map"></div>

        <!-- 图层管理 -->
        <LayerControl :current-style="currentMapStyle" @change-basemap="changeBaseMap" />

        <div class="controls-overlay">
            <h2>{{ t('editTool') }}</h2>

            <!-- 绘制工具 -->
            <div class="tool-buttons">
                <button @click="draw.changeMode('draw_point')">
                    {{ t('drawPoint') }}
                </button>
                <button @click="draw.changeMode('draw_line_string')">
                    {{ t('drawLine') }}
                </button>
                <button @click="draw.changeMode('draw_polygon')">
                    {{ t('drawPolygon') }}
                </button>
            </div>

            <!-- 要素列表 -->
            <div class="features-section">
                <h3>{{ t('features') }} ({{ features.length }})</h3>
                <div v-if="features.length > 0" class="features-list">
                    <div v-for="(feature, index) in features" :key="feature.id"
                        :class="['feature-item', { selected: selectedFeature?.id === feature.id }]"
                        @click="selectFeature(feature)">
                        <div class="feature-info">
                            <span class="feature-type">{{ getGeometryTypeName(feature.geometry.type) }}</span>
                            <span class="feature-id">#{{ index + 1 }}</span>
                        </div>
                        <button class="delete-btn" @click.stop="deleteFeature(feature.id)">×</button>
                    </div>
                </div>
                <div v-else class="no-features">
                    {{ t('noFeatures') }}
                </div>
            </div>

            <!-- 属性编辑器 -->
            <div v-if="selectedFeature" class="properties-section">
                <h3>{{ t('featureProperties') }}</h3>
                <div class="property-list">
                    <div v-for="(value, key) in selectedFeature.properties" :key="key" class="property-item">
                        <label>{{ key }}</label>
                        <input v-model="selectedFeature.properties[key]" type="text"
                            @change="updateFeatureProperties" />
                    </div>
                </div>
                <div class="add-property">
                    <input v-model="newPropertyKey" type="text" placeholder="属性名" />
                    <input v-model="newPropertyValue" type="text" placeholder="属性值" />
                    <button @click="addProperty">{{ t('addProperty') }}</button>
                </div>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
                <button class="export-btn" @click="exportGeoJSON">
                    {{ t('exportGeoJSON') }}
                </button>
                <label class="import-btn">
                    {{ t('importGeoJSON') }}
                    <input type="file" accept=".geojson,.json" @change="importGeoJSON" hidden />
                </label>
                <button class="clear-btn" @click="confirmClearAll">
                    {{ t('clearAll') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { saveAs } from 'file-saver'
import { MapboxConfig } from '@/config/mapbox'
import { useI18n } from '@/composables/useI18n'
import LayerControl from '@/components/LayerControl.vue'

const { t } = useI18n()

const currentMapStyle = ref('streets-v12')
const features = ref([])
const selectedFeature = ref(null)
const newPropertyKey = ref('')
const newPropertyValue = ref('')

let map = null
let draw = null

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

        draw = new MapboxDraw({
            displayControlsDefault: false,
            controls: {},
            defaultMode: 'simple_select'
        })

        map.addControl(draw, 'top-right')

        map.on('load', () => {
            console.log('Map loaded')
        })

        // 监听绘制事件
        map.on('draw.create', updateFeatures)
        map.on('draw.update', updateFeatures)
        map.on('draw.delete', updateFeatures)
        map.on('draw.selectionchange', handleSelectionChange)

    } catch (e) {
        console.error(e)
    }
}

const updateFeatures = () => {
    const all = draw.getAll()
    features.value = all.features
}

const handleSelectionChange = (e) => {
    if (e.features.length > 0) {
        selectedFeature.value = e.features[0]
    } else {
        selectedFeature.value = null
    }
}

const selectFeature = (feature) => {
    draw.changeMode('simple_select', { featureIds: [feature.id] })
    selectedFeature.value = feature
}

const deleteFeature = (featureId) => {
    draw.delete(featureId)
    updateFeatures()
    if (selectedFeature.value?.id === featureId) {
        selectedFeature.value = null
    }
}

const getGeometryTypeName = (type) => {
    const names = {
        Point: '点',
        LineString: '线',
        Polygon: '面',
        MultiPoint: '多点',
        MultiLineString: '多线',
        MultiPolygon: '多面'
    }
    return names[type] || type
}

const updateFeatureProperties = () => {
    if (!selectedFeature.value) return

    draw.setFeatureProperty(
        selectedFeature.value.id,
        'properties',
        selectedFeature.value.properties
    )
}

const addProperty = () => {
    if (!selectedFeature.value || !newPropertyKey.value) return

    if (!selectedFeature.value.properties) {
        selectedFeature.value.properties = {}
    }

    selectedFeature.value.properties[newPropertyKey.value] = newPropertyValue.value
    updateFeatureProperties()

    newPropertyKey.value = ''
    newPropertyValue.value = ''
}

const exportGeoJSON = () => {
    const data = draw.getAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
    })
    saveAs(blob, `map_features_${Date.now()}.geojson`)
}

const importGeoJSON = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
        const text = await file.text()
        const data = JSON.parse(text)

        if (data.type === 'FeatureCollection') {
            draw.set(data)
            updateFeatures()
        } else if (data.type === 'Feature') {
            draw.add(data)
            updateFeatures()
        }
    } catch (error) {
        console.error('Import error:', error)
        alert('导入失败：' + error.message)
    }

    // 重置文件输入
    event.target.value = ''
}

const confirmClearAll = () => {
    if (confirm(t('confirmClear'))) {
        draw.deleteAll()
        updateFeatures()
        selectedFeature.value = null
    }
}

const changeBaseMap = (styleId) => {
    if (!map) return
    currentMapStyle.value = styleId
    const styleUrl = `mapbox://styles/mapbox/${styleId}`
    map.setStyle(styleUrl)

    map.once('style.load', () => {
        // 重新添加绘制控件
        map.removeControl(draw)
        map.addControl(draw, 'top-right')
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
.edit-tool {
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
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 15px;

    button {
        padding: 10px 8px;
        background: #007cbf;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 12px;
        transition: background 0.2s;

        &:hover {
            background: #006096;
        }
    }
}

.features-section {
    padding-top: 15px;
    border-top: 1px solid #ddd;
}

.features-list {
    max-height: 200px;
    overflow-y: auto;
}

.feature-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    margin-bottom: 6px;
    background: #f9f9f9;
    border-radius: 6px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #f0f0f0;
    }

    &.selected {
        border-color: #007cbf;
        background: #e3f2fd;
    }

    .feature-info {
        display: flex;
        gap: 8px;
        align-items: center;
        font-size: 12px;

        .feature-type {
            font-weight: 600;
            color: #007cbf;
        }

        .feature-id {
            color: #999;
        }
    }

    .delete-btn {
        background: #ff5252;
        color: white;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        padding: 0;

        &:hover {
            background: #d32f2f;
        }
    }
}

.no-features {
    text-align: center;
    color: #999;
    font-size: 13px;
    padding: 20px;
    font-style: italic;
}

.properties-section {
    padding-top: 15px;
    border-top: 1px solid #ddd;
}

.property-list {
    margin-bottom: 10px;
}

.property-item {
    margin-bottom: 8px;

    label {
        display: block;
        font-size: 11px;
        color: #666;
        margin-bottom: 3px;
        font-weight: 600;
    }

    input {
        width: 100%;
        padding: 6px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 13px;
    }
}

.add-property {
    display: flex;
    gap: 4px;
    margin-top: 10px;

    input {
        flex: 1;
        padding: 6px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 12px;
    }

    button {
        padding: 6px 10px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        white-space: nowrap;

        &:hover {
            background: #45a049;
        }
    }
}

.action-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #ddd;

    button,
    label {
        padding: 10px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 12px;
        text-align: center;
        transition: all 0.2s;
    }

    .export-btn {
        background: #4CAF50;
        color: white;

        &:hover {
            background: #45a049;
        }
    }

    .import-btn {
        background: #2196F3;
        color: white;

        &:hover {
            background: #1976D2;
        }
    }

    .clear-btn {
        grid-column: 1 / -1;
        background: #f44336;
        color: white;

        &:hover {
            background: #d32f2f;
        }
    }
}

@media (max-width: 768px) {
    .controls-overlay {
        left: 10px;
        right: 10px;
        top: 80px;
        width: auto;
    }

    .tool-buttons {
        grid-template-columns: 1fr;
    }
}
</style>
