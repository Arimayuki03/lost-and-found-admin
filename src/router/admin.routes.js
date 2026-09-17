export default [
  {
    path: '/admin-dashboard',
    name: 'AdminDashboard',
    component: () => import('@/views/admin/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'admin', title: '管理员控制面板' },
    children: [
      {
        path: '',
        name: 'AdminHome',
        component: () => import('@/views/admin/Home.vue'),
        meta: { title: '管理员首页' }
      },
      {
        path: 'user-management',
        name: 'UserManagement',
        component: () => import('@/views/admin/UserManagement.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'announcements',
        name: 'Announcements',
        component: () => import('@/views/admin/Announcements.vue'),
        meta: { title: '公告管理' }
      },
      {
        path: 'carousel-images',
        name: 'CarouselImages',
        component: () => import('@/views/admin/CarouselImages.vue'),
        meta: { title: '轮播图管理' }
      },
      {
        path: 'lost-items',
        name: 'LostItems',
        // 失物/拾物共用配置驱动页面，meta.type 决定文案/时间字段/接口
        component: () => import('@/views/admin/ItemsManagement.vue'),
        meta: { title: '失物管理', type: 'lost' }
      },
      {
        path: 'found-items',
        name: 'FoundItems',
        component: () => import('@/views/admin/ItemsManagement.vue'),
        meta: { title: '拾物管理', type: 'found' }
      },
      {
        path: 'feedback',
        name: 'Feedback',
        component: () => import('@/views/admin/Feedback.vue'),
        meta: { title: '反馈管理' }
      }
    ]
  }
]; 