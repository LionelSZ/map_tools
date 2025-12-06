<template>
  <div class="mapbox-locator">
    <div id="map"></div>

    <!-- 图层管理组件 -->
    <LayerControl 
      :current-style="currentMapStyle"
      @change-basemap="changeBaseMap"
    />

    <div class="controls-overlay">
      <h2>{{ t('locationFinder') }}</h2>

      <div class="input-group">
        <label for="coords">{{ t('coordinates') }}</label>
        <textarea 
          id="coords" 
          v-model="coordsText"
          :placeholder="t('coordsPlaceholder')"
        ></textarea>
        <div class="info-msg">{{ t('clickMapTip') }}</div>
      </div>

      <div class="button-group">
        <button @click="locate">{{ t('goButton') }}</button>
        <button class="secondary" @click="clearMarkers">{{ t('clearButton') }}</button>
      </div>
      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import mapboxgl from 'mapbox-gl'
import { MapboxConfig } from '@/config/mapbox'
import { useI18n } from '@/composables/useI18n'
import LayerControl from '@/components/LayerControl.vue'

const { t } = useI18n()

const coordsText = ref('')
const errorMsg = ref('')
const currentMapStyle = ref('streets-v12')
let map = null
let markers = []

const showError = (msg) => {
  errorMsg.value = msg
}

const hideError = () => {
  errorMsg.value = ''
}

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

    map.on('error', (e) => {
      console.error('Map error:', e)
    })

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat

      const marker = new mapboxgl.Marker()
        .setLngLat([lng, lat])
        .addTo(map)
      markers.push(marker)

      const newCoord = `${lng.toFixed(6)}, ${lat.toFixed(6)}`
      
      if (coordsText.value.trim()) {
        coordsText.value = coordsText.value + '\n' + newCoord
      } else {
        coordsText.value = newCoord
      }
    })
  } catch (e) {
    console.error(e)
  }
}

const locate = () => {
  hideError()
  const text = coordsText.value.trim()

  if (!text) {
    showError(t('errorEnterCoords'))
    return
  }

  const lines = text.split('\n')
  const coordinates = []

  for (let line of lines) {
    line = line.trim()
    if (!line) continue

    const parts = line.split(',').map(p => p.trim())
    if (parts.length !== 2) {
      showError(`${t('errorInvalidFormat')}: "${line}". ${t('formatHint')}`)
      return
    }

    const lng = parseFloat(parts[0])
    const lat = parseFloat(parts[1])

    if (isNaN(lng) || isNaN(lat)) {
      showError(`${t('errorInvalidCoords')}: "${line}"`)
      return
    }

    coordinates.push([lng, lat])
  }

  if (coordinates.length === 0) {
    showError(t('errorNoValidCoords'))
    return
  }

  if (!map) {
    initMap()
  }

  if (!mapboxgl.supported()) {
    showError(t('errorBrowserNotSupported'))
    return
  }

  try {
    clearMarkers()

    coordinates.forEach((coord) => {
      const marker = new mapboxgl.Marker()
        .setLngLat(coord)
        .addTo(map)
      markers.push(marker)
    })

    if (coordinates.length === 1) {
      map.flyTo({
        center: coordinates[0],
        zoom: 12,
        essential: true
      })
    } else {
      const bounds = new mapboxgl.LngLatBounds()
      coordinates.forEach(coord => bounds.extend(coord))
      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
        essential: true
      })
    }
  } catch (e) {
    showError(t('errorDisplayingMarkers'))
    console.error(e)
  }
}

const clearMarkers = () => {
  markers.forEach(marker => marker.remove())
  markers = []
  coordsText.value = ''
  hideError()
}

const changeBaseMap = (styleId) => {
  if (!map) return
  
  currentMapStyle.value = styleId
  const styleUrl = `mapbox://styles/mapbox/${styleId}`
  map.setStyle(styleUrl)
  
  // 重新添加标记点（切换样式后需要重新添加）
  map.once('style.load', () => {
    markers.forEach(marker => marker.addTo(map))
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
.mapbox-locator {
  position: relative;
  width: 100%;
  height: 100%;
}

#map {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  cursor: crosshair;
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
  width: 300px;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.5);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}

h2 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #333;
}

.input-group {
  margin-bottom: 12px;
}

.input-group label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.input-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 14px;
  transition: border-color 0.2s;
  font-family: 'Inter', sans-serif;
  resize: vertical;
  min-height: 80px;
}

.input-group textarea:focus {
  outline: none;
  border-color: #007cbf;
}

.button-group {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

button {
  flex: 1;
  padding: 10px;
  background: #007cbf;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

button:hover {
  background: #006096;
}

button.secondary {
  background: #e0e0e0;
  color: #333;
}

button.secondary:hover {
  background: #d0d0d0;
}

.error-msg {
  color: #d32f2f;
  font-size: 12px;
  margin-top: 10px;
}

.info-msg {
  font-size: 11px;
  color: #666;
  margin-top: 8px;
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
    padding: 15px;
  }
  
  h2 {
    font-size: 16px;
  }
  
  .input-group textarea {
    min-height: 60px;
    font-size: 13px;
  }
  
  button {
    padding: 8px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .controls-overlay {
    max-height: calc(100vh - 100px);
  }
  
  .button-group {
    flex-direction: column;
  }
  
  button {
    width: 100%;
  }
}
</style>

