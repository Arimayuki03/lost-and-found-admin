import axios from 'axios';
import { useUserStore } from '@/store/modules/user';

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
});

// 是否正在刷新token
let isRefreshing = false;
// 请求队列：保存刷新期间收到 401 的请求的 resolve/reject
let requestsQueue = [];

// 登录/刷新接口返回 401 属于业务错误（如凭证无效），
// 不能再触发刷新流程，否则「登录失败 -> 刷新失败 -> 跳登录页」会覆盖掉真实的错误提示
const isAuthUrl = (url = '') => /\/(login|refresh)$/.test(url);

// 请求拦截器
service.interceptors.request.use(
  config => {
    const userStore = useUserStore();
    if (userStore.token) {
      config.headers['Authorization'] = `Bearer ${userStore.token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  response => {
    return response.data;
  },
  async error => {
    const originalRequest = error.config;

    // 检查是否为401错误且不是认证接口本身
    if (error.response && error.response.status === 401 &&
        originalRequest && !originalRequest._retry && !isAuthUrl(originalRequest.url)) {

      if (!isRefreshing) {
        isRefreshing = true;
        const userStore = useUserStore();

        try {
          // 尝试刷新token
          await userStore.refreshAccessToken();

          // 刷新成功，重试原请求
          originalRequest._retry = true;
          originalRequest.headers['Authorization'] = `Bearer ${userStore.token}`;

          // 放行刷新期间排队的请求
          requestsQueue.forEach(({ resolve }) => resolve(userStore.token));
          requestsQueue = [];

          return service(originalRequest);
        } catch (refreshError) {
          // 刷新失败，拒绝排队的请求（避免其永久悬挂），清空登录态并跳转登录页
          requestsQueue.forEach(({ reject }) => reject(refreshError));
          requestsQueue = [];

          userStore.logout();
          window.location.href = '/login';
          return Promise.reject(new Error('会话已过期，请重新登录'));
        } finally {
          isRefreshing = false;
        }
      } else {
        // 已经在刷新了，添加到队列
        return new Promise((resolve, reject) => {
          requestsQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return service(originalRequest);
        });
      }
    }

    // 其他错误统一拒绝，由调用方（组件/store）结合业务场景给出提示
    return Promise.reject(error);
  }
);

export default service;
