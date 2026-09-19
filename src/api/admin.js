import request from './index';

// ========== 平台用户管理（/admin/users） ==========

// 获取用户列表（仅普通用户，后端按 is_admin=False 过滤）
export function getAdminUsers(params) {
  return request({
    url: '/admin/users',
    method: 'get',
    params
  });
}

// 更新用户信息
export function updateAdminUser(id, data) {
  return request({
    url: `/admin/users/${id}`,
    method: 'put',
    data
  });
}

// 删除用户
export function deleteAdminUser(id) {
  return request({
    url: `/admin/users/${id}`,
    method: 'delete'
  });
}

// 重置用户密码
export function resetAdminUserPassword(id) {
  return request({
    url: `/admin/users/${id}/reset-password`,
    method: 'post'
  });
}

// ========== 管理员登录与统计 ==========

// 管理员登录
export function adminLogin(data) {
  return request({
    url: '/admin/login',
    method: 'post',
    data
  });
}

// 获取管理员统计信息
export function getStats() {
  return request({
    url: '/admin/stats',
    method: 'get'
  });
}

// 获取失物统计数据（time_range: all/7days/30days/12months）
export function getLostItemsStats(params = {}) {
  return request({
    url: '/admin/lost-items/stats',
    method: 'get',
    params
  });
}

// 获取拾物统计数据（time_range: all/7days/30days/12months）
export function getFoundItemsStats(params = {}) {
  return request({
    url: '/admin/found-items/stats',
    method: 'get',
    params
  });
}

// 运行匹配功能
export function runMatching() {
  return request({
    url: '/admin/run',
    method: 'post'
  });
}

// 获取匹配统计（真实物品口径：matched/unmatched/matchRate，区别于 /admin/stats 的匹配对口径）
export function getMatchingStats() {
  return request({
    url: '/admin/matching/stats',
    method: 'get'
  });
}

/**
 * 获取公告列表
 * @param {Number} page 页码
 * @param {Number} size 每页条数
 * @param {String} query 搜索关键词
 * @param {String} sort_by 排序字段
 * @param {String} sort_order 排序方式
 * @returns {Promise}
 */
export function getAnnouncements(page = 1, size = 10, query = '', sort_by = 'created_at', sort_order = 'desc') {
  return request({
    url: '/admin/announcements',
    method: 'get',
    params: {
      page,
      size,
      query,
      sort_by,
      sort_order
    }
  })
}

// 添加公告
export function addAnnouncement(data) {
  return request({
    url: '/admin/announcements',
    method: 'post',
    data
  });
}

// 更新公告
export function updateAnnouncement(id, data) {
  return request({
    url: `/admin/announcements/${id}`,
    method: 'put',
    data
  });
}

// 删除公告
export function deleteAnnouncement(id) {
  return request({
    url: `/admin/announcements/${id}`,
    method: 'delete'
  });
}

// 获取轮播图列表
export function getCarouselImages(page = 1, size = 10, query = '', sort_by = 'created_at', sort_order = 'desc') {
  return request({
    url: '/admin/carousel-images',
    method: 'get',
    params: {
      page,
      size,
      query,
      sort_by,
      sort_order
    }
  });
}

// 添加轮播图
export function addCarouselImage(data) {
  return request({
    url: '/admin/carousel-images',
    method: 'post',
    data
  });
}

// 更新轮播图
export function updateCarouselImage(id, data) {
  return request({
    url: `/admin/carousel-images/${id}`,
    method: 'put',
    data
  });
}

// 删除轮播图
export function deleteCarouselImage(id) {
  return request({
    url: `/admin/carousel-images/${id}`,
    method: 'delete'
  });
}

// 获取所有失物
export function getLostItems(page = 1, size = 10, query = '', sortBy = 'id', sortOrder = 'desc') {
  return request({
    url: '/admin/lost-items',
    method: 'get',
    params: { 
      page, 
      size, 
      query, 
      sort_by: sortBy, 
      sort_order: sortOrder 
    }
  });
}

// 获取未审核失物列表（keyword: 搜索关键词，由后端跨字段模糊匹配）
export function getUnreviewedLostItems(page = 1, size = 10, keyword = '', sort_by = 'id', sort_order = 'desc') {
  return request({
    url: '/admin/lost-items/unreviewed',
    method: 'get',
    params: {
      page,
      size,
      keyword,
      sort_by,
      sort_order
    }
  });
}

// 修正searchLostItems函数中的URL路径
export const searchLostItems = (params, page = 1, size = 10) => {
  // 创建一个新的URL查询参数对象
  const queryParams = new URLSearchParams();
  
  // 添加分页参数
  queryParams.append('page', page);
  queryParams.append('size', size);
  
  // 处理所有过滤参数
  for (const [key, value] of Object.entries(params)) {
    // 布尔值参数仅在显式提供时参与过滤，空值（''/null/undefined）直接跳过，
    // 避免 String('') 之类把无效值拼进 URL
    if (key === 'is_under_review' || key === 'is_completed') {
      if (value === '' || value === null || value === undefined) continue;
      queryParams.append(key, String(value));
    } else if (value !== '' && value !== null && value !== undefined) {
      queryParams.append(key, value);
    }
  }

  // 修正URL路径
  return request.get(`/admin/lost-items/sift?${queryParams.toString()}`);
};

// 审核失物
export function reviewLostItem(id) {
  return request({
    url: `/admin/lost-items/${id}/review`,
    method: 'put'
  });
}

// 删除失物
export function deleteLostItem(id) {
  return request({
    url: `/admin/lost-items/${id}`,
    method: 'delete'
  });
}

// 获取所有拾物
export function getFoundItems(page, size, params) {
  return request({
    url: '/admin/found-items',
    method: 'get',
    params: {
      page,
      size,
      ...params
    }
  });
}

// 获取未审核拾物（keyword: 搜索关键词，由后端跨字段模糊匹配）
export function getUnreviewedFoundItems(page = 1, size = 10, params = {}) {
  return request({
    url: '/admin/found-items/unreviewed',
    method: 'get',
    params: {
      page,
      size,
      ...params
    }
  });
}

// 修正searchFoundItems函数
export const searchFoundItems = (params, page = 1, size = 10) => {
  // 创建一个新的URL查询参数对象
  const queryParams = new URLSearchParams();
  
  // 添加分页参数
  queryParams.append('page', page);
  queryParams.append('size', size);
  
  // 处理所有过滤参数
  for (const [key, value] of Object.entries(params)) {
    // 布尔值参数仅在显式提供时参与过滤，空值（''/null/undefined）直接跳过，
    // 避免 String('') 之类把无效值拼进 URL
    if (key === 'is_under_review' || key === 'is_completed') {
      if (value === '' || value === null || value === undefined) continue;
      queryParams.append(key, String(value));
    } else if (value !== '' && value !== null && value !== undefined) {
      queryParams.append(key, value);
    }
  }

  // 修正URL路径
  return request.get(`/admin/found-items/sift?${queryParams.toString()}`);
};

// 审核拾物
export function reviewFoundItem(id) {
  return request({
    url: `/admin/found-items/${id}/review`,
    method: 'put'
  });
}

// 删除拾物
export function deleteFoundItem(id) {
  return request({
    url: `/admin/found-items/${id}`,
    method: 'delete'
  });
}

// 获取所有反馈
export function getFeedbacks(page = 1, size = 10, query = '', sortBy = 'id', sortOrder = 'desc') {
  return request({
    url: '/admin/feedbacks',
    method: 'get',
    params: {
      page,
      size,
      query,
      sort_by: sortBy,
      sort_order: sortOrder
    }
  });
}

// 删除反馈
export function deleteFeedback(id) {
  return request({
    url: `/admin/feedbacks/${id}`,
    method: 'delete'
  });
}

// 取消审核失物
export function cancelLostItemReview(id) {
  return request({
    url: `/admin/lost-items/${id}/cancel-review`,
    method: 'put'
  });
}

// 取消审核拾物
export function cancelFoundItemReview(id) {
  return request({
    url: `/admin/found-items/${id}/cancel-review`,
    method: 'put'
  });
} 