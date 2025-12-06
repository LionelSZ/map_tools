<template>
  <div class="geojson-viewer">
    <div id="map"></div>

    <!-- 图层管理组件 -->
    <LayerControl 
      :current-style="currentMapStyle"
      :layers="geojsonLayers"
      @change-basemap="changeBaseMap"
      @toggle-layer="toggleLayer"
      @update-opacity="updateLayerOpacity"
    />

    <div class="controls-overlay">
      <h2>{{ t('geojsonViewerTitle') }}</h2>

      <div 
        class="upload-area" 
        :class="{ dragover: isDragover }"
        @click="triggerFileInput"
        @dragover.prevent="isDragover = true"
        @dragleave="isDragover = false"
        @drop.prevent="handleDrop"
      >
        <div class="upload-icon">📁</div>
        <div class="upload-text">
          <strong>{{ t('uploadAreaTitle') }}</strong>
          <small>{{ t('uploadAreaSubtitle') }}</small>
        </div>
        <input 
          type="file" 
          ref="fileInputRef"
          accept=".geojson,.json"
          @change="handleFileChange"
          style="display: none;"
        >
      </div>

      <button @click="clearGeoJSON" :disabled="!currentGeoJSON">
        {{ t('clearButton') }}
      </button>

      <div v-if="currentGeoJSON" class="stats">
        <div class="stats-item">
          <span>{{ t('totalFeatures') }}</span>
          <strong>{{ featureCount }}</strong>
        </div>
      </div>

      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

      <div v-if="selectedFeature" class="properties-panel">
        <h3>{{ t('featureProperties') }}</h3>
        <div>
          <span :class="['feature-type', getTypeClass(selectedFeature.geometry.type)]">
            {{ getTypeName(selectedFeature.geometry.type) }}
          </span>
        </div>
        <div v-if="Object.keys(selectedFeature.properties || {}).length === 0" class="info-msg">
          {{ t('noProperties') }}
        </div>
        <div v-else class="properties-list">
          <div 
            v-for="(value, key) in selectedFeature.properties" 
            :key="key"
            class="property-item"
          >
            <div class="property-key">{{ key }}:</div>
            <div class="property-value">{{ value }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import mapboxgl from 'mapbox-gl'
import { MapboxConfig } from '@/config/mapbox'
import { useI18n } from '@/composables/useI18n'
import LayerControl from '@/components/LayerControl.vue'

const { t } = useI18n()

const isDragover = ref(false)
const errorMsg = ref('')
const currentGeoJSON = ref(null)
const featureCount = ref(0)
const selectedFeature = ref(null)
const fileInputRef = ref(null)
const currentMapStyle = ref('streets-v12')

let map = null

// 图层数据
const geojsonLayers = computed(() => {
  if (!currentGeoJSON.value) return []
  
  return [
    {
      id: 'geojson-fill',
      name: t('geometryPolygon'),
      type: 'fill',
      visible: map?.getLayoutProperty('geojson-fill', 'visibility') !== 'none',
      opacity: (map?.getPaintProperty('geojson-fill', 'fill-opacity') || 0.3) * 100,
      supportsOpacity: true
    },
    {
      id: 'geojson-line',
      name: t('geometryLineString'),
      type: 'line',
      visible: map?.getLayoutProperty('geojson-line', 'visibility') !== 'none',
      opacity: 100,
      supportsOpacity: false
    },
    {
      id: 'geojson-points',
      name: t('geometryPoint'),
      type: 'circle',
      visible: map?.getLayoutProperty('geojson-points', 'visibility') !== 'none',
      opacity: 100,
      supportsOpacity: false
    }
  ]
})

const showError = (msg) => {
  errorMsg.value = msg
}

const hideError = () => {
  errorMsg.value = ''
}

const initMap = () => {
  mapboxgl.accessToken = MapboxConfig.MAPBOX_TOKEN
  map = new mapboxgl.Map({
    container: 'map',
    style: MapboxConfig.MAP_STYLE,
    center: MapboxConfig.DEFAULT_CENTER,
    zoom: MapboxConfig.DEFAULT_ZOOM
  })

  map.on('load', () => {
    map.on('click', 'geojson-fill', showFeatureProperties)
    map.on('click', 'geojson-line', showFeatureProperties)
    map.on('click', 'geojson-points', showFeatureProperties)

    map.on('mouseenter', 'geojson-fill', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'geojson-fill', () => { map.getCanvas().style.cursor = '' })
    map.on('mouseenter', 'geojson-line', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'geojson-line', () => { map.getCanvas().style.cursor = '' })
    map.on('mouseenter', 'geojson-points', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'geojson-points', () => { map.getCanvas().style.cursor = '' })
  })
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (e) => {
  const file = e.target.files?.[0]
  if (file) handleFile(file)
}

const handleDrop = (e) => {
  isDragover.value = false
  const file = e.dataTransfer.files?.[0]
  if (file) handleFile(file)
}

const handleFile = (file) => {
  if (!file.name.endsWith('.geojson') && !file.name.endsWith('.json')) {
    showError(t('errorInvalidFile'))
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const geojson = JSON.parse(e.target?.result)
      loadGeoJSON(geojson)
      hideError()
    } catch (err) {
      showError(t('errorInvalidGeoJSON') + ': ' + err.message)
    }
  }
  reader.readAsText(file)
}

const loadGeoJSON = (geojson) => {
  if (!map.loaded()) {
    showError(t('errorMapLoading'))
    return
  }

  currentGeoJSON.value = geojson

  // Remove existing layers and source
  if (map.getLayer('geojson-fill')) map.removeLayer('geojson-fill')
  if (map.getLayer('geojson-line')) map.removeLayer('geojson-line')
  if (map.getLayer('geojson-points')) map.removeLayer('geojson-points')
  if (map.getSource('geojson')) map.removeSource('geojson')

  map.addSource('geojson', {
    type: 'geojson',
    data: geojson
  })

  map.addLayer({
    id: 'geojson-fill',
    type: 'fill',
    source: 'geojson',
    filter: ['==', '$type', 'Polygon'],
    paint: {
      'fill-color': '#7b1fa2',
      'fill-opacity': 0.3
    }
  })

  map.addLayer({
    id: 'geojson-line',
    type: 'line',
    source: 'geojson',
    filter: ['in', '$type', 'LineString', 'Polygon'],
    paint: {
      'line-color': '#f57c00',
      'line-width': 2
    }
  })

  map.addLayer({
    id: 'geojson-points',
    type: 'circle',
    source: 'geojson',
    filter: ['==', '$type', 'Point'],
    paint: {
      'circle-radius': 6,
      'circle-color': '#1976d2',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  })

  const bounds = new mapboxgl.LngLatBounds()
  const features = geojson.features || [geojson]

  features.forEach(feature => {
    const geom = feature.geometry
    if (geom.type === 'Point') {
      bounds.extend(geom.coordinates)
    } else if (geom.type === 'LineString') {
      geom.coordinates.forEach(coord => bounds.extend(coord))
    } else if (geom.type === 'Polygon') {
      geom.coordinates[0].forEach(coord => bounds.extend(coord))
    } else if (geom.type === 'MultiPoint') {
      geom.coordinates.forEach(coord => bounds.extend(coord))
    } else if (geom.type === 'MultiLineString') {
      geom.coordinates.forEach(line => {
        line.forEach(coord => bounds.extend(coord))
      })
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach(polygon => {
        polygon[0].forEach(coord => bounds.extend(coord))
      })
    }
  })

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, { padding: 50, maxZoom: 15 })
  }

  featureCount.value = features.length
}

const showFeatureProperties = (e) => {
  if (e.features.length === 0) return
  selectedFeature.value = e.features[0]
}

const getTypeClass = (geomType) => {
  if (geomType.includes('Line')) return 'type-line'
  if (geomType.includes('Polygon')) return 'type-polygon'
  return 'type-point'
}

const getTypeName = (geomType) => {
  return t('geometry' + geomType)
}

const clearGeoJSON = () => {
  if (map.getLayer('geojson-fill')) map.removeLayer('geojson-fill')
  if (map.getLayer('geojson-line')) map.removeLayer('geojson-line')
  if (map.getLayer('geojson-points')) map.removeLayer('geojson-points')
  if (map.getSource('geojson')) map.removeSource('geojson')

  currentGeoJSON.value = null
  featureCount.value = 0
  selectedFeature.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''

  map.flyTo({ center: MapboxConfig.DEFAULT_CENTER, zoom: MapboxConfig.DEFAULT_ZOOM })
}

// 切换底图
const changeBaseMap = (styleId) => {
  if (!map) return
  
  currentMapStyle.value = styleId
  const styleUrl = `mapbox://styles/mapbox/${styleId}`
  const currentGeo = currentGeoJSON.value
  
  map.setStyle(styleUrl)
  
  // 样式加载完成后重新添�?GeoJSON 数据
  if (currentGeo) {
    map.once('style.load', () => {
      setTimeout(() => {
        loadGeoJSON(currentGeo)
      }, 100)
    })
  }
}

// 切换图层显示/隐藏
const toggleLayer = (layerId) => {
  if (!map || !map.getLayer(layerId)) return
  
  const visibility = map.getLayoutProperty(layerId, 'visibility')
  map.setLayoutProperty(
    layerId,
    'visibility',
    visibility === 'visible' ? 'none' : 'visible'
  )
}

// 更新图层透明�?
const updateLayerOpacity = (layerId, opacity) => {
  if (!map || !map.getLayer(layerId)) return
  
  if (layerId === 'geojson-fill') {
    map.setPaintProperty(layerId, 'fill-opacity', opacity / 100)
  }
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
.geojson-viewer {
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
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.5);
  max-height: 80vh;
  overflow-y: auto;
}

h2 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #333;
}

.upload-area {
  border: 2px dashed #007cbf;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 15px;
}

.upload-area:hover {
  background: #e6f4fa;
  border-color: #0066a1;
}

.upload-area.dragover {
  background: #d4edfa;
  border-color: #0066a1;
}

.upload-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.upload-text {
  font-size: 14px;
  color: #666;
}

.upload-text strong {
  display: block;
  margin-bottom: 5px;
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
}

button:hover {
  background: #006096;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-msg {
  color: #d32f2f;
  font-size: 12px;
  margin-top: 10px;
}

.properties-panel {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ddd;
}

.properties-panel h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #333;
}

.property-item {
  display: flex;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
}

.property-key {
  font-weight: 600;
  color: #555;
  margin-right: 8px;
  min-width: 100px;
  font-size: 12px;
}

.property-value {
  color: #666;
  flex: 1;
  word-break: break-word;
  font-size: 12px;
}

.feature-type {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 10px;
}

.type-point {
  background: #e3f2fd;
  color: #1976d2;
}

.type-line {
  background: #fff3e0;
  color: #f57c00;
}

.type-polygon {
  background: #f3e5f5;
  color: #7b1fa2;
}

.stats {
  margin-top: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
}

.stats-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
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
    max-height: calc(100vh - 100px);
  }
  
  h2 {
    font-size: 16px;
  }
  
  .upload-area {
    padding: 20px;
  }
  
  .upload-icon {
    font-size: 32px;
  }
  
  .upload-text {
    font-size: 13px;
  }
  
  button {
    padding: 8px;
    font-size: 14px;
  }
  
  .property-key {
    min-width: 80px;
  }
}

@media (max-width: 480px) {
  .controls-overlay {
    max-height: calc(100vh - 120px);
  }
  
  .upload-area {
    padding: 15px;
  }
  
  .property-item {
    flex-direction: column;
    gap: 4px;
  }
  
  .property-key {
    min-width: auto;
  }
}
</style>

