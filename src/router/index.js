import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import adminRoutes from './admin.routes';
import superAdminRoutes from './superadmin.routes';
import { ElMessage } from 'element-plus';

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false, title: '失物招领后台管理系统' }
  },
  ...adminRoutes,
  ...superAdminRoutes,
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 导航守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();

  // 检查认证；token 存在但角色缺失属于无效登录态，
  // 必须回到登录页，否则角色守卫会在两个 dashboard 之间无限重定向
  if (to.meta.requiresAuth && (!userStore.isLoggedIn || !userStore.role)) {
    console.warn('访问需要认证的页面，但未登录，重定向到登录页');
    next('/login');
    return;
  }
  
  // 检查角色权限
  if (to.meta.role && to.meta.role !== userStore.role) {
    ElMessage.error('您没有权限访问该页面');
    next(userStore.role === 'admin' ? '/admin-dashboard' : '/superadmin-dashboard');
    return;
  }
  
  document.title = to.meta.title || '管理系统';
  next();
});

export default router; 