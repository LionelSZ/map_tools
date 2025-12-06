<template>
  <div class="layout">
    <!-- 移动端菜单按�?-->
    <button class="mobile-menu-btn" @click="toggleSidebar" aria-label="Toggle menu">
      <span class="hamburger-icon" :class="{ active: isSidebarOpen }">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>
    
    <!-- 侧边栏遮罩层 (移动�? -->
    <div 
      v-if="isSidebarOpen" 
      class="sidebar-overlay" 
      @click="closeSidebar"
    ></div>
    
    <Sidebar :isOpen="isSidebarOpen" @close="closeSidebar" />
    
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'

const isSidebarOpen = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

// 在桌面端默认打开侧边�?
const handleResize = () => {
  if (window.innerWidth > 768) {
    isSidebarOpen.value = true
  } else {
    isSidebarOpen.value = false
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.main-content {
  flex: 1;
  position: relative;
  background: white;
  overflow: hidden;
}

/* 移动端菜单按�?*/
.mobile-menu-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 150;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  display: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.mobile-menu-btn:hover {
  background: #f5f7fa;
  border-color: var(--accent-color);
}

/* 汉堡菜单图标 */
.hamburger-icon {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 24px;
  height: 18px;
}

.hamburger-icon span {
  display: block;
  height: 2px;
  background: #333;
  border-radius: 2px;
  transition: all 0.3s;
}

.hamburger-icon.active span:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.hamburger-icon.active span:nth-child(2) {
  opacity: 0;
}

.hamburger-icon.active span:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

/* 侧边栏遮罩层 */
.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 90;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .mobile-menu-btn {
    display: block;
  }
  
  .sidebar-overlay {
    display: block;
  }
}
</style>

