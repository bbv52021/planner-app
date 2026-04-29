<template>
  <el-container class="layout-container">
    <!-- 移动端顶栏 -->
    <el-header class="mobile-header" v-if="isMobile">
      <div class="header-left">
        <el-icon class="menu-btn" @click="drawerVisible = true"><Menu /></el-icon>
        <span class="app-title">📋 备忘录</span>
      </div>
      <div class="header-right">
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            {{ userStore.user?.nickname || userStore.user?.username }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="settings">⚙️ 设置</el-dropdown-item>
              <el-dropdown-item command="logout" divided>🚪 退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <!-- 侧边栏 -->
    <el-aside :width="isMobile ? '0px' : (collapsed ? '64px' : '220px')" class="sidebar" v-show="!isMobile">
      <div class="sidebar-header">
        <span v-show="!collapsed" class="logo-text">📋 备忘录</span>
        <el-icon class="collapse-btn" @click="collapsed = !collapsed">
          <Fold v-if="!collapsed" />
          <Expand v-else />
        </el-icon>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/gantt">
          <el-icon><Calendar /></el-icon>
          <template #title>甘特图</template>
        </el-menu-item>
        <el-menu-item index="/projects">
          <el-icon><Folder /></el-icon>
          <template #title>项目管理</template>
        </el-menu-item>
        <el-menu-item index="/daily">
          <el-icon><EditPen /></el-icon>
          <template #title>每日计划</template>
        </el-menu-item>
        <el-menu-item index="/calendar">
          <el-icon><Date /></el-icon>
          <template #title>日历视图</template>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>设置</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 移动端抽屉菜单 -->
    <el-drawer v-model="drawerVisible" direction="ltr" size="220px" :show-close="false" v-if="isMobile">
      <template #header>
        <span class="logo-text">📋 工作生活备忘录</span>
      </template>
      <el-menu :default-active="activeMenu" router @select="drawerVisible = false">
        <el-menu-item index="/">
          <el-icon><DataAnalysis /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/gantt">
          <el-icon><Calendar /></el-icon>
          <span>甘特图</span>
        </el-menu-item>
        <el-menu-item index="/projects">
          <el-icon><Folder /></el-icon>
          <span>项目管理</span>
        </el-menu-item>
        <el-menu-item index="/daily">
          <el-icon><EditPen /></el-icon>
          <span>每日计划</span>
        </el-menu-item>
        <el-menu-item index="/calendar">
          <el-icon><Date /></el-icon>
          <span>日历视图</span>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <span>设置</span>
        </el-menu-item>
      </el-menu>
    </el-drawer>

    <!-- 主内容区 -->
    <el-main class="main-content" :class="{ 'mobile-main': isMobile }">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const userStore = useAuthStore()
const collapsed = ref(false)
const drawerVisible = ref(false)
const isMobile = ref(false)

const activeMenu = computed(() => route.path)

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

function handleCommand(cmd) {
  if (cmd === 'logout') {
    userStore.logout()
    router.push('/login')
  } else if (cmd === 'settings') {
    router.push('/settings')
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
}

.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--primary-color);
  color: white;
  padding: 0 16px;
  z-index: 100;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .menu-btn {
      font-size: 22px;
      cursor: pointer;
    }

    .app-title {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .header-right {
    .user-info {
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
    }
  }
}

.sidebar {
  background: #001529;
  overflow-y: auto;
  transition: width 0.3s;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);

  .sidebar-header {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .logo-text {
      color: white;
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
    }

    .collapse-btn {
      color: rgba(255, 255, 255, 0.65);
      cursor: pointer;
      font-size: 18px;

      &:hover {
        color: white;
      }
    }
  }

  .sidebar-menu {
    border-right: none;
    background: transparent;

    :deep(.el-menu-item) {
      color: rgba(255, 255, 255, 0.65);

      &:hover, &.is-active {
        background: var(--primary-color);
        color: white;
      }
    }
  }
}

.main-content {
  background: var(--bg-color);
  overflow-y: auto;
  padding: 20px;
}

.mobile-main {
  padding: 12px;
  padding-top: 0;
}
</style>
