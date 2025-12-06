<template>
  <div class="sidebar" :class="{ 'sidebar-open': isOpen }">
    <div class="sidebar-content">
      <div class="logo">
        <span>◆</span> <span>{{ t('toolbox') }}</span>
      </div>

      <router-link to="/locator" class="nav-item" active-class="active" @click="handleNavClick">
        <span>📍</span> <span>{{ t('mapboxLocator') }}</span>
      </router-link>

      <router-link to="/geojson" class="nav-item" active-class="active" @click="handleNavClick">
        <span>🗺️</span> <span>{{ t('geojsonViewer') }}</span>
      </router-link>

      <div class="nav-item" @click="showMoreTools">
        <span>🔧</span> <span>{{ t('moreTools') }}</span>
      </div>
    </div>

    <!-- 语言切换器 -->
    <div class="language-switcher" @click="toggleLanguage">
      <span class="lang-icon">🌐</span>
      <span class="lang-text">{{ locale === 'zh' ? '中文' : 'English' }}</span>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '@/composables/useI18n'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const { t, locale, toggleLanguage } = useI18n()

const showMoreTools = () => {
  alert(t('moreToolsMsg'))
}

const handleNavClick = () => {
  // 在移动端点击导航后关闭侧边栏
  if (window.innerWidth <= 768) {
    emit('close')
  }
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  background: var(--sidebar-bg);
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.02);
  z-index: 100;
  transition: transform 0.3s ease;
  height: 100vh;
  background-color: #fff;
}

.sidebar-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo span:first-child {
  color: var(--accent-color);
}

.nav-item {
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  color: #555;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.nav-item:hover {
  background-color: #f5f7fa;
  color: var(--accent-color);
}

.nav-item.active {
  background-color: #e6f4fa;
  color: var(--accent-color);
}

/* 语言切换器 */
.language-switcher {
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: background 0.2s;
  background: var(--sidebar-bg);
}

.language-switcher:hover {
  background: #f5f7fa;
}

.lang-icon {
  font-size: 18px;
}

.lang-text {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    transform: translateX(-100%);
    box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1);
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }
}
</style>
