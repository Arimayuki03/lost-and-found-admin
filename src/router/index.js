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

/**
 * 手写 base64url 解码（补齐 URL 安全字符的 padding），返回 UTF-8 字符串。
 * 项目内此前无 base64 解码实现，atob 在浏览器环境下原生可用。
 */
const base64UrlDecode = (str) => {
  // JWT 使用 base64url：'+' -> '-'、'/' -> '_' 需还原
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // 补齐 base64 padding
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  // atob 输出为 Latin-1 字节串，经 URI 转码还原 UTF-8（JWT payload 为 UTF-8 编码）
  return decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
};

/**
 * 从 access token 的 JWT payload 中解析 role claim。
 * 区分两类失败：token 结构非法/解析失败返回 { ok: false }（一律视为非法）；
 * payload 合法但没有 role claim 返回 { ok: true, role: null }
 * （后端普通管理员登录不写入 role claim，见 app/admin/admins.py）。
 */
const parseTokenRole = (token) => {
  if (typeof token !== 'string') {
    return { ok: false, role: null };
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { ok: false, role: null };
  }
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    const role = typeof payload.role === 'string' ? payload.role : null;
    return { ok: true, role };
  } catch {
    return { ok: false, role: null };
  }
};

// token role claim 白名单：与后端登录时写入的 claim 值保持一致
// （超管登录写 {"role": "super_admin"}，普通管理员当前不写该 claim，
//  兼容 "admin"，防止后端后续为普通管理员补充该 claim 时误杀）
const ALLOWED_TOKEN_ROLES = ['admin', 'super_admin'];

// 非法/缺失/不一致登录态的统一清理：调用现有 logout（清 Vuex + localStorage）
// 并回登录页，绝不重定向到受保护页（否则角色守卫会产生 redirect 自环）
const forceLogoutToLogin = (userStore) => {
  userStore.logout();
  return '/login';
};

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

  // 已登录时，用 access token 的 JWT payload 交叉校验角色：
  // role 判定不再信任裸 localStorage 字符串（可能被污染成任意值）。
  // 任何非法 / 缺失 / 与 store 不一致的值一律 logout 回登录页，
  // 避免旧逻辑把未知角色重定向回受保护页形成重定向自环
  if (to.meta.requiresAuth && userStore.isLoggedIn) {
    const { ok: tokenParsed, role: tokenRole } = parseTokenRole(userStore.token);
    // token 结构非法/解析失败直接判死；claim 存在时必须在白名单内
    const tokenRoleValid = tokenParsed && (tokenRole === null || ALLOWED_TOKEN_ROLES.includes(tokenRole));
    // store 值仅允许登录流程写入的两个取值
    const storeRoleValid = userStore.role === 'admin' || userStore.role === 'superadmin';
    // claim 与 store 的一致性：superadmin(store) 必须有 super_admin claim；
    // admin(store) 允许 claim 缺失（后端普通管理员登录不写 claim）
    const roleConsistent =
      (userStore.role === 'admin' && (tokenRole === 'admin' || tokenRole === null)) ||
      (userStore.role === 'superadmin' && tokenRole === 'super_admin');

    if (!tokenRoleValid || !storeRoleValid || !roleConsistent) {
      console.warn('登录态角色校验失败，已清理并回登录页。store:', userStore.role, 'token claim:', tokenRole);
      next(forceLogoutToLogin(userStore));
      return;
    }
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
