import axios from 'axios';

// 与 src/api/index.js 保持一致的基础路径，
// 刷新请求必须走原始 axios，避免触发 401 拦截逻辑造成循环
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export function refreshToken(refreshToken) {
  return axios({
    url: `${baseURL}/common/refresh`,
    method: 'post',
    timeout: 10000,
    headers: {
      'Authorization': `Bearer ${refreshToken}`
    }
  }).then(response => response.data);
}
