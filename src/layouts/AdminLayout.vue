<template>
  <el-container class="admin-layout">
    <!-- 窄屏遮罩：抽屉模式下点击关闭侧边栏 -->
    <div v-if="isMobile && drawerOpen" class="layout-overlay" @click="drawerOpen = false" />

    <el-aside
      :width="asideWidth"
      class="layout-aside"
      :class="{ 'is-drawer-open': isMobile && drawerOpen }"
    >
      <div class="logo">
        <h2 v-if="!asideCollapsed">{{ title }}</h2>
        <h2 v-else class="logo-mini">{{ miniTitle }}</h2>
      </div>
      <el-menu
        :default-active="$route.path"
        class="sidebar-menu"
        router
        :collapse="asideCollapsed"
        :collapse-transition="false"
        background-color="var(--lf-sidebar-bg)"
        text-color="var(--lf-sidebar-text)"
        active-text-color="var(--el-color-primary-light-5)"
      >
        <template v-for="item in menus" :key="item.title">
          <el-sub-menu v-if="item.children" :index="item.title">
            <template #title>
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.title }}</span>
            </template>
            <el-menu-item v-for="child in item.children" :key="child.path" :index="child.path">
              {{ child.title }}
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="item.path">
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container class="layout-main">
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="header-icon" @click="toggleSidebar">
            <Fold v-if="!asideCollapsed" />
            <Expand v-else />
          </el-icon>
          <el-icon class="header-icon" @click="toggleFullScreen">
            <FullScreen v-if="!isFullscreen" />
            <Aim v-else />
          </el-icon>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-dropdown">
              {{ userStore.isSuperAdmin ? '超级管理员' : '管理员' }}
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
      <el-main class="layout-content">
        <!-- key 随路径变化：失物/拾物管理共用 ItemsManagement 组件，
             不加 key 时路由切换复用实例，onMounted 不再触发导致列表仍是上一个类型的数据 -->
        <router-view :key="$route.path" />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
/**
 * 统一后台布局壳（管理员/超级管理员共用）
 * 收编原 admin/Dashboard.vue 与 superadmin/Dashboard.vue 的全部逐字复制逻辑：
 * 侧边栏折叠、全屏、退出登录、--sidebar-width 维护；新增窄屏(<992px)自动折叠 + 抽屉模式。
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { ElMessage } from 'element-plus';
import { Fold, Expand, FullScreen, Aim, ArrowDown } from '@element-plus/icons-vue';
import { menusForRole } from './menus';

const props = defineProps({
  title: { type: String, default: '失物招领后台' },
  miniTitle: { type: String, default: '后台' },
});

const router = useRouter();
const userStore = useUserStore();

const isCollapse = ref(false);
const isFullscreen = ref(false);
const isMobile = ref(false);
const drawerOpen = ref(false);

const menus = computed(() => menusForRole(userStore.role));
const asideCollapsed = computed(() => (isMobile.value ? !drawerOpen.value : isCollapse.value));
const asideWidth = computed(() => (asideCollapsed.value ? '64px' : '200px'));

const toggleSidebar = () => {
  if (isMobile.value) {
    drawerOpen.value = !drawerOpen.value;
  } else {
    isCollapse.value = !isCollapse.value;
  }
};

const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      isFullscreen.value = true;
    }).catch((err) => {
      console.error(`全屏请求错误: ${err.message}`);
    });
  } else if (document.exitFullscreen) {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false;
    }).catch((err) => {
      console.error(`退出全屏错误: ${err.message}`);
    });
  }
};

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout();
    ElMessage.success('已退出登录');
    router.push('/login');
  }
};

// 视口变化：跨 992px 断点时切换桌面/窄屏模式（窄屏默认折叠为抽屉）
const onResize = () => {
  const mobile = window.innerWidth < 992;
  if (mobile !== isMobile.value) {
    isMobile.value = mobile;
    drawerOpen.value = false;
    isCollapse.value = mobile;
  }
};

// --sidebar-width 由 Layout 统一维护（供页面内需要避让侧边栏的元素引用）
watch(
  asideWidth,
  (w) => document.documentElement.style.setProperty('--sidebar-width', w),
  { immediate: true }
);

onMounted(() => {
  onResize();
  window.addEventListener('resize', onResize);
});
onBeforeUnmount(() => window.removeEventListener('resize', onResize));
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  width: 100%;
  position: relative;
}

.layout-aside {
  background-color: var(--lf-sidebar-bg);
  overflow-x: hidden;
  transition: width 0.3s;
  z-index: 1001;
}

/* 窄屏：侧边栏变抽屉，浮在内容之上 */
@media screen and (max-width: 991px) {
  .layout-aside {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }

  .layout-aside.is-drawer-open {
    transform: translateX(0);
  }
}

.layout-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  white-space: nowrap;
}

.logo h2 {
  font-size: 16px;
  margin: 0;
}

.logo-mini {
  font-size: 14px;
}

.sidebar-menu {
  height: calc(100% - 60px);
  border-right: none;
}

.layout-header {
  background: var(--lf-bg-card);
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  flex-shrink: 0;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
}

.header-icon {
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  color: var(--lf-text-regular);
  border-radius: 4px;
  transition: background-color 0.3s;
  margin-right: 8px;
}

.header-icon:hover {
  background-color: #f0f2f5;
}

.user-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--lf-text-regular);
}

.layout-content {
  background-color: var(--lf-bg-page);
  padding: 20px;
  overflow-y: auto;
  min-height: 0;
}
</style>
