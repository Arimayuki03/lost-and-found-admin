import request from './index';

// 超级管理员登录
export function superAdminLogin(data) {
  return request({
    url: '/sadmin/login',
    method: 'post',
    data
  });
}

// 获取所有用户
export function getAllUsers(params) {
  return request({
    url: '/sadmin/users',
    method: 'get',
    params
  });
}

// 获取所有管理员
export function getAdmins(page = 1, size = 10, sortBy = 'id', sortOrder = 'asc') {
  return request({
    url: '/sadmin/admins',
    method: 'get',
    params: {
      page,
      size,
      sort_by: sortBy,
      sort_order: sortOrder
    }
  });
}

// 获取用户统计数据（{ totalUsers, totalAdmins }）
export function getUserStats() {
  return request({
    url: '/sadmin/users/stats',
    method: 'get'
  });
}

// 添加管理员
export function addAdmin(data) {
  return request({
    url: '/sadmin/admins',
    method: 'post',
    data
  });
}

// 删除用户
export function deleteUser(userId) {
  return request({
    url: `/sadmin/users/${userId}`,
    method: 'delete'
  });
}

// 更新用户信息
export function updateUser(userId, data) {
  return request({
    url: `/sadmin/users/${userId}`,
    method: 'put',
    data
  });
} 