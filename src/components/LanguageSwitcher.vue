<template>
  <div class="lang-switcher" @click="toggleLanguage">
    <span>🌐</span>
    <span>{{ locale === 'zh' ? '中文' : 'EN' }}</span>
  </div>
</template>

<script setup>
import { useI18n } from '@/composables/useI18n'

const { locale, toggleLanguage } = useI18n()
</script>

<style scoped lang="scss">
.lang-switcher {
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  z-index: 100;
}

.lang-switcher:hover {
  background: #f5f7fa;
  border-color: var(--accent-color);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .lang-switcher {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 150;
  }
}
</style>

