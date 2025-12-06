<template>
  <div class="layer-control" :class="{ collapsed: isCollapsed }">
    <div class="control-header" @click="toggleCollapse">
      <div class="header-title">
        <span class="icon">🗂</span>
        <span>{{ t('layerControl') }}</span>
      </div>
      <span class="toggle-icon">{{ isCollapsed ? '' : '' }}</span>
    </div>

    <div v-if="!isCollapsed" class="control-body">
      <!-- 底图样式切换 -->
      <div class="section">
        <div class="section-title">{{ t('baseMapStyle') }}</div>
        <div class="style-grid">
          <div v-for="style in baseMapStyles" :key="style.id" class="style-item"
            :class="{ active: currentStyle === style.id }" @click="changeBaseMap(style.id)">
            <div class="style-preview" :style="{ backgroundColor: style.color }">
              <span class="style-icon">{{ style.icon }}</span>
            </div>
            <div class="style-name">{{ t(style.nameKey) }}</div>
          </div>
        </div>
      </div>

      <!-- 图层控制 -->
      <div v-if="layers.length > 0" class="section">
        <div class="section-title">{{ t('layers') }}</div>
        <div class="layer-list">
          <div v-for="layer in layers" :key="layer.id" class="layer-item">
            <label class="layer-label">
              <input type="checkbox" :checked="layer.visible" @change="toggleLayer(layer.id)" />
              <span class="layer-icon">{{ getLayerIcon(layer.type) }}</span>
              <span class="layer-name">{{ layer.name }}</span>
            </label>
            <div v-if="layer.visible && layer.supportsOpacity" class="layer-opacity">
              <input type="range" min="0" max="100" :value="layer.opacity || 100"
                @input="updateLayerOpacity(layer.id, $event.target.value)" class="opacity-slider" />
              <span class="opacity-value">{{ layer.opacity || 100 }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3D 地形开-(如果支持) -->
      <div v-if="support3DTerrain" class="section">
        <label class="terrain-toggle">
          <input type="checkbox" :checked="terrainEnabled" @change="toggleTerrain" />
          <span>{{ t('enable3DTerrain') }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

const props = defineProps({
  layers: {
    type: Array,
    default: () => []
  },
  currentStyle: {
    type: String,
    default: 'streets-v12'
  },
  support3DTerrain: {
    type: Boolean,
    default: false
  },
  terrainEnabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'change-basemap',
  'toggle-layer',
  'update-opacity',
  'toggle-terrain'
])

const isCollapsed = ref(true)

// 底图样式选项
const baseMapStyles = [
  { id: 'streets-v12', nameKey: 'styleStreets', icon: '🗺-', color: '#E8E8E8' },
  { id: 'satellite-v9', nameKey: 'styleSatellite', icon: '🛰-', color: '#4A90E2' },
  { id: 'dark-v11', nameKey: 'styleDark', icon: '🌙', color: '#2C3E50' },
  { id: 'light-v11', nameKey: 'styleLight', icon: '☀-', color: '#F5F5F5' },
  { id: 'outdoors-v12', nameKey: 'styleOutdoors', icon: '🏔-', color: '#8BC34A' },
  { id: 'satellite-streets-v12', nameKey: 'styleSatelliteStreets', icon: '🌍', color: '#5C9BD5' }
]

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const changeBaseMap = (styleId) => {
  emit('change-basemap', styleId)
}

const toggleLayer = (layerId) => {
  emit('toggle-layer', layerId)
}

const updateLayerOpacity = (layerId, opacity) => {
  emit('update-opacity', layerId, parseInt(opacity))
}

const toggleTerrain = (event) => {
  emit('toggle-terrain', event.target.checked)
}

const getLayerIcon = (type) => {
  const icons = {
    'fill': '-',
    'line': '📏',
    'circle': '-',
    'symbol': '📌',
    'raster': '🖼-',
    'heatmap': '🔥',
    'fill-extrusion': '🏢'
  }
  return icons[type] || '📍'
}
</script>

<style scoped lang="scss">
.layer-control {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.5);
  width: 280px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  z-index: 10;
  transition: all 0.3s ease;
}

.layer-control.collapsed {
  width: auto;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #e0e0e0;
  user-select: none;
}

.control-header:hover {
  background: #f5f7fa;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.icon {
  font-size: 18px;
}

.toggle-icon {
  color: #666;
  font-size: 12px;
}

.control-body {
  padding: 12px;
}

.section {
  margin-bottom: 16px;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 底图样式网格 */
.style-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.style-item {
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid transparent;
}

.style-item:hover {
  border-color: #007cbf;
}

.style-item.active {
  border-color: #007cbf;
  box-shadow: 0 0 0 1px #007cbf;
}

.style-preview {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.style-name {
  padding: 4px;
  font-size: 10px;
  text-align: center;
  background: white;
  color: #333;
  font-weight: 500;
}

/* 图层列表 */
.layer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layer-item {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 8px;
  transition: background 0.2s;
}

.layer-item:hover {
  background: #e9ecef;
}

.layer-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
}

.layer-label input[type="checkbox"] {
  cursor: pointer;
}

.layer-icon {
  font-size: 14px;
}

.layer-name {
  flex: 1;
  font-weight: 500;
}

.layer-opacity {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-left: 28px;
}

.opacity-slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  outline: none;
  background: #ddd;
  cursor: pointer;
}

.opacity-slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #007cbf;
  cursor: pointer;
}

.opacity-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #007cbf;
  cursor: pointer;
  border: none;
}

.opacity-value {
  font-size: 11px;
  color: #666;
  min-width: 35px;
  text-align: right;
}

/* 3D地形开-*/
.terrain-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  transition: background 0.2s;
}

.terrain-toggle:hover {
  background: #e9ecef;
}

.terrain-toggle input[type="checkbox"] {
  cursor: pointer;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .layer-control {
    top: 80px;
    right: 10px;
    width: 240px;
    max-height: calc(100vh - 100px);
  }

  .style-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .layer-control {
    left: 10px;
    right: 10px;
    width: auto;
    max-width: calc(100vw - 20px);
  }
}
</style>
