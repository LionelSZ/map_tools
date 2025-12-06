<template>
    <div class="geocoder">
        <div id="map"></div>

        <!-- 图层管理 -->
        <LayerControl :current-style="currentMapStyle" @change-basemap="changeBaseMap" />

        <div class="controls-overlay">
            <h2>{{ t('geocoder') }}</h2>

            <!-- 模式选择 -->
            <div class="mode-tabs">
                <button :class="{ active: mode === 'forward' }" @click="mode = 'forward'">
                    {{ t('forwardGeocoding') }}
                </button>
                <button :class="{ active: mode === 'reverse' }" @click="setReverseMode">
                    {{ t('reverseGeocoding') }}
                </button>
            </div>

            <!-- 正向编码 -->
            <div v-if="mode === 'forward'" class="input-section">
                <div class="input-group">
                    <label>{{ t('inputAddress') }}</label>
                    <textarea v-model="addressInput" :placeholder="t('inputAddress')" rows="3"></textarea>
                </div>
                <button @click="searchAddress">{{ t('searchButton') }}</button>
            </div>

            <!-- 逆向编码 -->
            <div v-if="mode === 'reverse'" class="input-section">
                <div class="info-msg">{{ t('clickMapToGeocode') }}</div>
                <div class="input-group">
                    <label>{{ t('inputCoordinate') }}</label>
                    <input v-model="coordInput" type="text" placeholder="121.4737, 31.2304" />
                </div>
                <button @click="searchCoordinate">{{ t('searchButton') }}</button>
            </div>

            <!-- 搜索结果 -->
            <div v-if="searchResults.length > 0" class="results">
                <h3>{{ t('searchResults') }}</h3>
                <div class="results-list">
                    <div v-for="(result, index) in searchResults" :key="index" class="result-item"
                        @click="selectResult(result)">
                        <div class="result-name">{{ result.place_name }}</div>
                        <div class="result-coords">
                            {{ result.center[0].toFixed(6) }}, {{ result.center[1].toFixed(6) }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 地址结果（逆向编码） -->
            <div v-if="addressResult" class="address-result">
                <h3>{{ t('addressResult') }}</h3>
                <div class="result-box">
                    {{ addressResult.place_name }}
                </div>
                <button class="copy-btn" @click="copyAddress">{{ t('copyResult') }}</button>
            </div>

            <!-- 搜索历史 -->
            <div v-if="history.length > 0" class="history">
                <div class="history-header">
                    <h3>{{ t('searchHistory') }}</h3>
                    <button class="clear-btn" @click="clearHistory">{{ t('clearHistory') }}</button>
                </div>
                <div class="history-list">
                    <div v-for="(item, index) in history.slice(0, 5)" :key="index" class="history-item"
                        @click="loadFromHistory(item)">
                        {{ item.query }}
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
import { useGeocoding } from '@/composables/useGeocoding'
import LayerControl from '@/components/LayerControl.vue'

const { t } = useI18n()
const { forwardGeocode, reverseGeocode } = useGeocoding()

const currentMapStyle = ref('streets-v12')
const mode = ref('forward')
const addressInput = ref('')
const coordInput = ref('')
const searchResults = ref([])
const addressResult = ref(null)
const history = ref([])
const isReverseMode = ref(false)

let map = null
let markers = []

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

        // 加载历史记录
        const saved = localStorage.getItem('geocoding_history')
        if (saved) {
            history.value = JSON.parse(saved)
        }
    } catch (e) {
        console.error(e)
    }
}

const setReverseMode = () => {
    mode.value = 'reverse'
    isReverseMode.value = true
    searchResults.value = []
    addressResult.value = null
}

const handleMapClick = async (e) => {
    if (mode.value !== 'reverse') return

    const { lng, lat } = e.lngLat
    coordInput.value = `${lng.toFixed(6)}, ${lat.toFixed(6)}`

    try {
        const result = await reverseGeocode(lng, lat)
        addressResult.value = result
        searchResults.value = []

        // 添加标记
        clearMarkers()
        const marker = new mapboxgl.Marker()
            .setLngLat([lng, lat])
            .setPopup(new mapboxgl.Popup().setHTML(result.place_name))
            .addTo(map)
        markers.push(marker)

        // 添加到历史
        addToHistory(`${lng.toFixed(6)}, ${lat.toFixed(6)}`)
    } catch (error) {
        console.error('Reverse geocoding error:', error)
        alert(t('coordinateNotFound'))
    }
}

const searchAddress = async () => {
    if (!addressInput.value.trim()) return

    try {
        const results = await forwardGeocode(addressInput.value)

        if (results.length === 0) {
            alert(t('addressNotFound'))
            return
        }

        searchResults.value = results
        addressResult.value = null

        // 清除旧标记
        clearMarkers()

        // 添加标记
        results.forEach((result, index) => {
            const marker = new mapboxgl.Marker({ color: index === 0 ? '#ff0000' : '#007cbf' })
                .setLngLat(result.center)
                .setPopup(new mapboxgl.Popup().setHTML(result.place_name))
                .addTo(map)
            markers.push(marker)
        })

        // 缩放到第一个结果
        if (results[0]) {
            map.flyTo({
                center: results[0].center,
                zoom: 14
            })
        }

        // 添加到历史
        addToHistory(addressInput.value)
    } catch (error) {
        console.error('Forward geocoding error:', error)
        alert(t('addressNotFound'))
    }
}

const searchCoordinate = async () => {
    if (!coordInput.value.trim()) return

    const parts = coordInput.value.split(',').map(p => p.trim())
    if (parts.length !== 2) {
        alert(t('invalidCoordinate'))
        return
    }

    const lng = parseFloat(parts[0])
    const lat = parseFloat(parts[1])

    if (isNaN(lng) || isNaN(lat)) {
        alert(t('invalidCoordinate'))
        return
    }

    try {
        const result = await reverseGeocode(lng, lat)
        addressResult.value = result
        searchResults.value = []

        // 添加标记
        clearMarkers()
        const marker = new mapboxgl.Marker()
            .setLngLat([lng, lat])
            .setPopup(new mapboxgl.Popup().setHTML(result.place_name))
            .addTo(map)
        markers.push(marker)

        // 缩放到位置
        map.flyTo({
            center: [lng, lat],
            zoom: 14
        })

        // 添加到历史
        addToHistory(coordInput.value)
    } catch (error) {
        console.error('Reverse geocoding error:', error)
        alert(t('coordinateNotFound'))
    }
}

const selectResult = (result) => {
    map.flyTo({
        center: result.center,
        zoom: 15
    })

    // 显示 popup
    new mapboxgl.Popup()
        .setLngLat(result.center)
        .setHTML(result.place_name)
        .addTo(map)
}

const copyAddress = async () => {
    if (!addressResult.value) return

    try {
        await navigator.clipboard.writeText(addressResult.value.place_name)
        alert(t('coordinateCopied'))
    } catch (err) {
        console.error('Failed to copy:', err)
    }
}

const clearMarkers = () => {
    markers.forEach(m => m.remove())
    markers = []
}

const addToHistory = (query) => {
    // 避免重复
    const index = history.value.indexOf(query)
    if (index > -1) {
        history.value.splice(index, 1)
    }

    history.value.unshift(query)

    // 限制历史记录数量
    if (history.value.length > 20) {
        history.value = history.value.slice(0, 20)
    }

    // 保存到本地存储
    localStorage.setItem('geocoding_history', JSON.stringify(history.value))
}

const loadFromHistory = (item) => {
    if (mode.value === 'forward') {
        addressInput.value = item.query
        searchAddress()
    } else {
        coordInput.value = item.query
        searchCoordinate()
    }
}

const clearHistory = () => {
    if (confirm(t('clearHistory') + '?')) {
        history.value = []
        localStorage.removeItem('geocoding_history')
    }
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
.geocoder {
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
    margin: 0 0 10px 0;
    font-size: 14px;
    color: #333;
}

.mode-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 15px;

    button {
        padding: 10px;
        background: #e0e0e0;
        color: #333;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 12px;
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

.input-section {
    margin-bottom: 15px;

    .input-group {
        margin-bottom: 12px;

        label {
            display: block;
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
            font-weight: 600;
        }

        input,
        textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 6px;
            box-sizing: border-box;
            font-size: 14px;
        }

        textarea {
            resize: vertical;
            font-family: inherit;
        }
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
    }
}

.info-msg {
    font-size: 12px;
    color: #666;
    padding: 8px;
    background: #f5f5f5;
    border-radius: 6px;
    margin-bottom: 12px;
    font-style: italic;
}

.results {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #ddd;
}

.results-list {
    max-height: 250px;
    overflow-y: auto;
}

.result-item {
    background: #f9f9f9;
    padding: 10px;
    margin-bottom: 8px;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #e3f2fd;
        border-color: #007cbf;
    }

    .result-name {
        font-size: 13px;
        color: #333;
        margin-bottom: 4px;
    }

    .result-coords {
        font-size: 11px;
        color: #666;
        font-family: monospace;
    }
}

.address-result {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #ddd;

    .result-box {
        background: #f9f9f9;
        padding: 12px;
        border-radius: 6px;
        border: 1px solid #e0e0e0;
        font-size: 13px;
        color: #333;
        margin-bottom: 10px;
    }

    .copy-btn {
        width: 100%;
        padding: 8px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;

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

.history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .clear-btn {
        padding: 4px 8px;
        background: #ff5252;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;

        &:hover {
            background: #d32f2f;
        }
    }
}

.history-list {
    max-height: 150px;
    overflow-y: auto;
}

.history-item {
    background: #f9f9f9;
    padding: 8px;
    margin-bottom: 6px;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #e3f2fd;
        border-color: #007cbf;
    }
}

@media (max-width: 768px) {
    .controls-overlay {
        left: 10px;
        right: 10px;
        top: 80px;
        width: auto;
    }

    .mode-tabs {
        grid-template-columns: 1fr;
    }
}
</style>
