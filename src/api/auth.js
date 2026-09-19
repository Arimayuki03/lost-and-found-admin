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

/**
 * 服务端登出：撤销 access token（jti 拉黑），并随请求体携带 refresh token 一并撤销。
 * 与 refreshToken 同理走原始 axios，绕过 api/index.js 的 401 拦截器，
 * 避免登出接口自身返回 401 时再次触发 logout 形成死循环
 */
export function serverLogout(accessToken, refreshToken) {
  return axios({
    url: `${baseURL}/common/logout`,
    method: 'post',
    timeout: 10000,
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    data: refreshToken ? { refresh_token: refreshToken } : {}
  }).then(response => response.data);
}
