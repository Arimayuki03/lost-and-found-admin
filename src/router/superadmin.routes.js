export default [
  {
    path: '/superadmin-dashboard',
    name: 'SuperAdminDashboard',
    component: () => import('@/views/superadmin/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'superadmin', title: '超级管理员控制面板' },
    children: [
      {
        path: '',
        name: 'SuperAdminHome',
        component: () => import('@/views/superadmin/Home.vue'),
        meta: { title: '超级管理员首页' }
      },
      {
        path: 'user-management',
        name: 'SuperAdminUserManagement',
        component: () => import('@/views/superadmin/UserManagement.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'admin-management',
        name: 'SuperAdminAdminManagement',
        component: () => import('@/views/superadmin/AdminManagement.vue'),
        meta: { title: '管理员管理' }
      },
    ]
  }
]; 