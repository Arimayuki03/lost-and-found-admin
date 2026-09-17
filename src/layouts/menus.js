/**
 * 后台侧边栏菜单配置（角色驱动）
 *
 * 超管与管理员共用 AdminLayout，菜单按 roles 过滤；
 * 新增页面 = 加一条配置，不再改两套 Dashboard 壳。
 * icon 为 @element-plus/icons-vue 组件名（main.js 已全局注册）。
 */
export const MENUS = [
  // ===== 管理员 =====
  { path: '/admin-dashboard', title: '首页', icon: 'HomeFilled', roles: ['admin'] },
  { path: '/admin-dashboard/user-management', title: '用户管理', icon: 'User', roles: ['admin'] },
  { path: '/admin-dashboard/announcements', title: '公告管理', icon: 'Bell', roles: ['admin'] },
  { path: '/admin-dashboard/carousel-images', title: '轮播图管理', icon: 'Picture', roles: ['admin'] },
  { path: '/admin-dashboard/feedback', title: '反馈管理', icon: 'ChatLineRound', roles: ['admin'] },
  {
    title: '失物招领管理',
    icon: 'Search',
    roles: ['admin'],
    children: [
      { path: '/admin-dashboard/lost-items', title: '失物管理', roles: ['admin'] },
      { path: '/admin-dashboard/found-items', title: '拾物管理', roles: ['admin'] },
    ],
  },
  // ===== 超级管理员 =====
  { path: '/superadmin-dashboard', title: '首页', icon: 'HomeFilled', roles: ['superadmin'] },
  { path: '/superadmin-dashboard/admin-management', title: '管理员管理', icon: 'UserFilled', roles: ['superadmin'] },
  { path: '/superadmin-dashboard/user-management', title: '用户管理', icon: 'User', roles: ['superadmin'] },
];

/** 按角色过滤菜单（保留有可见子项的父项） */
export function menusForRole(role) {
  return MENUS
    .map((m) => (m.children ? { ...m, children: m.children.filter((c) => c.roles.includes(role)) } : m))
    .filter((m) => (m.children ? m.children.length > 0 : m.roles.includes(role)));
}
