<template>
    <div class="coordinate-converter">
        <div id="map"></div>

        <!-- 图层管理 -->
        <LayerControl :current-style="currentMapStyle" @change-basemap="changeBaseMap" />

        <div class="controls-overlay">
            <h2>{{ t('coordinateConverter') }}</h2>

            <!-- 坐标系选择 -->
            <div class="coord-systems">
                <div class="input-group">
                    <label>{{ t('sourceCoordSystem') }}</label>
                    <select v-model="sourceSystem">
                        <option value="wgs84">{{ t('wgs84') }}</option>
                        <option value="gcj02">{{ t('gcj02') }}</option>
                        <option value="bd09">{{ t('bd09') }}</option>
                        <option value="webMercator">{{ t('webMercator') }}</option>
                        <option value="cgcs2000">{{ t('cgcs2000') }}</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>{{ t('targetCoordSystem') }}</label>
                    <select v-model="targetSystem">
                        <option value="wgs84">{{ t('wgs84') }}</option>
                        <option value="gcj02">{{ t('gcj02') }}</option>
                        <option value="bd09">{{ t('bd09') }}</option>
                        <option value="webMercator">{{ t('webMercator') }}</option>
                        <option value="cgcs2000">{{ t('cgcs2000') }}</option>
                    </select>
                </div>
            </div>

            <!-- 输入区域 -->
            <div class="input-group">
                <label>{{ t('inputCoordinates') }}</label>
                <div class="info-msg">{{ t('inputFormat') }}</div>
                <textarea v-model="inputCoords" :placeholder="t('batchInputHint')" rows="5"></textarea>
            </div>

            <button @click="convertCoordinates">{{ t('convertButton') }}</button>

            <!-- 结果区域 -->
            <div v-if="outputCoords" class="results">
                <h3>{{ t('convertedCoordinates') }}</h3>
                <textarea v-model="outputCoords" readonly rows="5"></textarea>
                <div class="button-group">
                    <button class="copy-btn" @click="copyResult">{{ t('copyResult') }}</button>
                    <button class="secondary" @click="clearAll">{{ t('clearInput') }}</button>
                </div>
            </div>

            <!-- 转换历史 -->
            <div v-if="conversionHistory.length > 0" class="history">
                <h3>转换历史</h3>
                <div class="history-list">
                    <div v-for="(item, index) in conversionHistory.slice(0, 5)" :key="index" class="history-item">
                        <div class="history-title">{{ item.from }} → {{ item.to }}</div>
                        <div class="history-coords">{{ item.coords }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import mapboxgl from 'mapbox-gl'
import { MapboxConfig } from '@/config/mapbox'
import { useI18n } from '@/composables/useI18n'
import { useCoordinateConversion } from '@/composables/useCoordinateConversion'
import LayerControl from '@/components/LayerControl.vue'

const { t } = useI18n()
const { convert, parseCoords, formatCoords } = useCoordinateConversion()

const currentMapStyle = ref('streets-v12')
const sourceSystem = ref('wgs84')
const targetSystem = ref('gcj02')
const inputCoords = ref('')
const outputCoords = ref('')
const conversionHistory = ref([])

let map = null
let sourceMarkers = []
let targetMarkers = []

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
    } catch (e) {
        console.error(e)
    }
}

const convertCoordinates = () => {
    if (!inputCoords.value.trim()) return

    try {
        const lines = inputCoords.value.trim().split('\n')
        const results = []

        // 清除旧标记
        clearMarkers()

        for (const line of lines) {
            const coords = parseCoords(line.trim())
            if (!coords) {
                alert(t('invalidCoordinate') + `: ${line}`)
                return
            }

            const [lng, lat] = coords
            const converted = convert(lng, lat, sourceSystem.value, targetSystem.value)
            results.push(formatCoords(converted))

            // 在地图上显示转换前后的点
            if (results.length === 1) {
                // 源坐标（红色）
                const sourceMarker = new mapboxgl.Marker({ color: '#ff0000' })
                    .setLngLat(coords)
                    .setPopup(new mapboxgl.Popup().setHTML(`<strong>源坐标</strong><br/>${formatCoords(coords)}`))
                    .addTo(map)
                sourceMarkers.push(sourceMarker)

                // 目标坐标（蓝色）
                const targetMarker = new mapboxgl.Marker({ color: '#0000ff' })
                    .setLngLat(converted)
                    .setPopup(new mapboxgl.Popup().setHTML(`<strong>目标坐标</strong><br/>${formatCoords(converted)}`))
                    .addTo(map)
                targetMarkers.push(targetMarker)

                // 缩放到显示两个点
                const bounds = new mapboxgl.LngLatBounds()
                bounds.extend(coords)
                bounds.extend(converted)
                map.fitBounds(bounds, { padding: 100 })
            }
        }

        outputCoords.value = results.join('\n')

        // 添加到历史记录
        conversionHistory.value.unshift({
            from: getSystemName(sourceSystem.value),
            to: getSystemName(targetSystem.value),
            coords: results[0]
        })

        // 限制历史记录数量
        if (conversionHistory.value.length > 10) {
            conversionHistory.value = conversionHistory.value.slice(0, 10)
        }

    } catch (error) {
        console.error('Conversion error:', error)
        alert(t('invalidCoordinate'))
    }
}

const copyResult = async () => {
    try {
        await navigator.clipboard.writeText(outputCoords.value)
        alert(t('conversionComplete'))
    } catch (err) {
        console.error('Failed to copy:', err)
    }
}

const clearAll = () => {
    inputCoords.value = ''
    outputCoords.value = ''
    clearMarkers()
}

const clearMarkers = () => {
    sourceMarkers.forEach(m => m.remove())
    targetMarkers.forEach(m => m.remove())
    sourceMarkers = []
    targetMarkers = []
}

const getSystemName = (system) => {
    const names = {
        wgs84: 'WGS84',
        gcj02: 'GCJ-02',
        bd09: 'BD-09',
        webMercator: 'Web Mercator',
        cgcs2000: 'CGCS2000'
    }
    return names[system] || system
}

const changeBaseMap = (styleId) => {
    if (!map) return
    currentMapStyle.value = styleId
    const styleUrl = `mapbox://styles/mapbox/${styleId}`
    map.setStyle(styleUrl)
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
.coordinate-converter {
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

.coord-systems {
    display: grid;
    gap: 12px;
    margin-bottom: 15px;
}

.input-group {
    margin-bottom: 12px;

    label {
        display: block;
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
        font-weight: 600;
    }

    select,
    textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-sizing: border-box;
        font-size: 14px;
        font-family: monospace;
    }

    textarea {
        resize: vertical;
    }
}

.info-msg {
    font-size: 11px;
    color: #666;
    margin-bottom: 6px;
    font-style: italic;
}

button {
    width: 100%;
    padding: 10px;
    background: #007cbf;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;

    &:hover {
        background: #006096;
    }

    &.secondary {
        background: #e0e0e0;
        color: #333;

        &:hover {
            background: #d0d0d0;
        }
    }
}

.results {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #ddd;

    textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-sizing: border-box;
        font-size: 14px;
        font-family: monospace;
        background: #f9f9f9;
        resize: vertical;
    }
}

.button-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 10px;

    .copy-btn {
        background: #4CAF50;

        &:hover {
            background: #45a049;
        }
    }
}

.history {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #ddd;
}

.history-list {
    max-height: 200px;
    overflow-y: auto;
}

.history-item {
    background: #f9f9f9;
    padding: 8px;
    margin-bottom: 6px;
    border-radius: 6px;
    border: 1px solid #e0e0e0;

    .history-title {
        font-size: 11px;
        font-weight: 600;
        color: #007cbf;
        margin-bottom: 4px;
    }

    .history-coords {
        font-size: 12px;
        font-family: monospace;
        color: #333;
    }
}

@media (max-width: 768px) {
    .controls-overlay {
        left: 10px;
        right: 10px;
        top: 80px;
        width: auto;
    }

    .button-group {
        grid-template-columns: 1fr;
    }
}
</style>
