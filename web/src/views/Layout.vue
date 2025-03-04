<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="aside-menu" :class="{ 'is-open': isMobileMenuOpen }">
      <div class="logo-container">
        <span v-if="!isCollapse" class="logo-title">LLM MOE API</span>
        <el-icon class="toggle-icon" @click="toggleMenu">
          <Fold v-if="!isCollapse" />
          <Expand v-else />
        </el-icon>
      </div>
      <el-menu
        :router="true"
        :default-active="route.path"
        :collapse="isCollapse"
        class="el-menu-vertical">
        <el-menu-item index="/">
          <el-icon><Monitor /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/models">
          <el-icon><Connection /></el-icon>
          <template #title>模型配置</template>
        </el-menu-item>
        <el-menu-item index="/agents">
          <el-icon><Avatar /></el-icon>
          <template #title>Agent配置</template>
        </el-menu-item>
        <el-menu-item index="/admins">
          <el-icon><User /></el-icon>
          <template #title>管理员</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header>
        <div class="header-content">
          <div class="header-left">
            <el-icon class="mobile-toggle" @click="toggleMenu">
              <Menu />
            </el-icon>
            <!-- <h2 class="header-title">LLM MOE 管理系统</h2> -->
          </div>
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              {{ username }}
              <el-icon><CaretBottom /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Monitor, Connection, Avatar, User, CaretBottom, Fold, Expand, Menu } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useWindowSize } from '@vueuse/core'

const route = useRoute()
const router = useRouter()
const username = ref('')
const isCollapse = ref(false)
const isMobileMenuOpen = ref(false)

// 使用useWindowSize获取窗口大小
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

// 修复toggleMenu函数
const toggleMenu = () => {
  if (isMobile.value) {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  } else {
    isCollapse.value = !isCollapse.value
  }
}

// 检测窗口大小变化
const checkScreenSize = () => {
  if (window.innerWidth < 768) {
    isCollapse.value = true
  }
}

onMounted(async () => {
  // 获取用户信息
  try {
    const response = await fetch('/admin/status')
    if (response.ok) {
      const data = await response.json()
      username.value = data.username
    } else {
      // 如果获取用户信息失败，可能是未登录状态，重定向到登录页
      router.push('/login')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  }

  // 初始化检查屏幕大小
  checkScreenSize()
  // 添加窗口大小变化监听
  window.addEventListener('resize', checkScreenSize)
})

onBeforeUnmount(() => {
  // 组件销毁前移除事件监听
  window.removeEventListener('resize', checkScreenSize)
})

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      const response = await fetch('/admin/logout', { 
        method: 'POST',
        credentials: 'same-origin' // 确保发送cookies
      })
      
      if (response.ok) {
        ElMessage.success('已退出登录')
        // 使用 replace 而不是 push，防止用户登出后点击返回按钮回到应用
        router.replace('/login')
      } else {
        throw new Error('退出失败')
      }
    } catch (error) {
      console.error('退出失败:', error)
      ElMessage.error('退出失败，请重试')
    }
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100vw;
  overflow-x: hidden;
  background-color: #f5f7fa;
}

.aside-menu {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(180deg, #304156 0%, #1f2d3d 100%);
  overflow: hidden;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  z-index: 10;
  position: relative;
  border-radius: 0; /* 移除圆角 */
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.1) 100%);
  overflow: hidden;
}

.logo-title {
  background: linear-gradient(90deg, #64b5f6, #81c784);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
  letter-spacing: 1px;
  background-size: 200% auto;
  animation: textShine 3s ease-in-out infinite alternate;
  position: relative;
}

.logo-title::after {
  content: "LLM MOE API";
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background: linear-gradient(90deg, #64b5f6, #81c784);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.3;
  filter: blur(8px);
  animation: textGlow 3s ease-in-out infinite alternate;
}

@keyframes textShine {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

@keyframes textGlow {
  0% {
    filter: blur(8px);
    opacity: 0.3;
    transform: scale(1);
  }
  100% {
    filter: blur(4px);
    opacity: 0.6;
    transform: scale(1.03);
  }
}

.toggle-icon {
  cursor: pointer;
  font-size: 20px;
  color: #fff;
  transition: transform 0.3s ease;
}

.toggle-icon:hover {
  transform: scale(1.2);
  color: #a0cfff;
}

.el-menu {
  border-right: none;
  background-color: transparent !important;
}

.el-menu-vertical {
  background-color: transparent;
}

.el-menu-vertical .el-menu-item {
  color: #bfcbd9;
  height: 56px;
  line-height: 56px;
  margin: 4px 0;
  padding: 0 16px 0 20px !important;
  border-radius: 0; /* 移除圆角 */
  /* margin-right: 16px; */
  transition: all 0.3s ease;
}

.el-menu-vertical .el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #fff;
  padding-left: 24px !important;
}

.el-menu-vertical .el-menu-item.is-active {
  background: linear-gradient(90deg, #409EFF 0%, #53a8ff 100%) !important;
  color: #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

:deep(.el-menu-item) i {
  color: inherit;
  transition: all 0.3s ease;
}

:deep(.el-menu-item:hover) i {
  transform: scale(1.1);
}

:deep(.el-menu-item.is-active) i {
  color: #fff;
}

.el-header {
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
  padding: 0 20px;
  margin-left: 1px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  z-index: 9;
  position: relative;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.header-left {
  display: flex;
  align-items: center;
}

.mobile-toggle {
  display: none;
  margin-right: 15px;
  font-size: 20px;
  cursor: pointer;
  color: #606266;
  transition: all 0.3s ease;
}

.mobile-toggle:hover {
  color: #409EFF;
  transform: scale(1.1);
}

.header-title {
  margin: 0;
  font-size: 18px;
  background: linear-gradient(90deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 600;
}

.user-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  transition: all 0.3s ease;
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 500;
}

.user-dropdown:hover {
  background-color: #ecf5ff;
  color: #409EFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-dropdown .el-icon {
  transition: transform 0.3s ease;
}

.user-dropdown:hover .el-icon {
  transform: rotate(180deg);
}

.el-main {
  padding: 20px;
  background-color: #f5f7fa;
  overflow-x: hidden;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .aside-menu {
    position: fixed;
    height: 100vh;
    z-index: 2000;
    border-radius: 0;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .aside-menu.is-open {
    transform: translateX(0);
  }
  
  .mobile-toggle {
    display: block;
  }
  
  .el-main {
    padding: 15px 10px;
  }
  
  .user-dropdown {
    padding: 4px 8px;
    font-size: 14px;
  }
}
</style>