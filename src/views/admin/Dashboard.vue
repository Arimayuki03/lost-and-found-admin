<template>
  <div class="dashboard-container">
    <el-container>  
      <el-aside :width="isCollapse ? '64px' : '200px'">
        <div class="logo">
          <h2 v-if="!isCollapse">管理员后台</h2>
        </div>
        <el-menu
          router
          :default-active="$route.path"
          class="sidebar-menu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
          :collapse="isCollapse"
        >
          <el-menu-item index="/admin-dashboard">
            <el-icon><HomeFilled /></el-icon>
            <template #title>首页</template>
          </el-menu-item>
          <el-menu-item index="/admin-dashboard/user-management">
            <el-icon><User /></el-icon>
            <template #title>用户管理</template>
          </el-menu-item>
          <el-menu-item index="/admin-dashboard/announcements">
            <el-icon><Bell /></el-icon>
            <template #title>公告管理</template>
          </el-menu-item>
          <el-menu-item index="/admin-dashboard/carousel-images">
            <el-icon><Picture /></el-icon>
            <template #title>轮播图管理</template>
          </el-menu-item>
          <el-menu-item index="/admin-dashboard/feedback">
            <el-icon><ChatLineRound /></el-icon>
            <template #title>反馈管理</template>
          </el-menu-item>
          <el-sub-menu index="lost-found">
            <template #title>
              <el-icon><Search /></el-icon>
              <span>失物招领管理</span>
            </template>
            <el-menu-item index="/admin-dashboard/lost-items">失物管理</el-menu-item>
            <el-menu-item index="/admin-dashboard/found-items">拾物管理</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header>
          <div class="header-left">
            <el-icon class="toggle-sidebar" @click="toggleSidebar">
              <Fold v-if="!isCollapse" />
              <Expand v-else />
            </el-icon>
            <el-icon class="fullscreen-icon" @click="toggleFullScreen">
              <FullScreen v-if="!isFullscreen" />
              <Aim v-else />
            </el-icon>
          </div>
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="el-dropdown-link">
                管理员
                <el-icon><ArrowDown /></el-icon>
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
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { ElMessage } from 'element-plus';
import { HomeFilled, Bell, Picture, Search, ChatLineRound, ArrowDown, User, Fold, Expand, FullScreen, Aim } from '@element-plus/icons-vue';

const router = useRouter();
const userStore = useUserStore();
const isCollapse = ref(false);
const isFullscreen = ref(false);

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value;
};

const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      isFullscreen.value = true;
    }).catch(err => {
      console.error(`全屏请求错误: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        isFullscreen.value = false;
      }).catch(err => {
        console.error(`退出全屏错误: ${err.message}`);
      });
    }
  }
};

// 监听侧边栏折叠状态变化，更新CSS变量
watch(isCollapse, (newValue) => {
  document.documentElement.style.setProperty('--sidebar-width', newValue ? '64px' : '200px');
}, { immediate: true });

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout();
    ElMessage.success('已退出登录');
    router.push('/login');
  }
};
</script>

<style scoped>
.dashboard-container {
  height: 100vh;
  width: 100%;
}

.el-header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.el-aside {
  color: #333;
  background-color: #304156;
  height: 100vh;
  overflow-x: hidden;
  transition: width 0.3s;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
  height: calc(100vh - 60px);
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.sidebar-menu {
  height: calc(100% - 60px);
  border-right: none;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.toggle-sidebar, .fullscreen-icon {
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  color: #606266;
  border-radius: 4px;
  transition: background-color 0.3s;
  margin-right: 8px;
}

.toggle-sidebar:hover, .fullscreen-icon:hover {
  background-color: #f0f2f5;
}

.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
}
</style> 