import axios from 'axios';
import { useUserStore } from '@/store/modules/user';
import router from '@/router';

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
});

// 是否正在刷新token
let isRefreshing = false;
// 请求队列：保存刷新期间收到 401 的请求的 resolve/reject
let requestsQueue = [];

// 登录/刷新/登出接口返回 401 属于业务错误（如凭证无效/令牌已撤销），
// 不能再触发刷新流程：登录/刷新会覆盖真实错误提示，
// 登出则会形成「401 -> logout -> 登出请求自身 401 -> 再 logout」的死循环
const isAuthUrl = (url = '') => /\/(login|refresh|logout)$/.test(url);

// JWT 失效的状态码：401 为过期/缺失，422 为 token 格式损坏
// （flask-jwt-extended 对无法解析的 token 返回 422）
const isJwtError = (status) => status === 401 || status === 422;

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

    // 检查是否为 JWT 失效错误且不是认证接口本身
    if (error.response && isJwtError(error.response.status) &&
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

          // 等待登出（含服务端撤销调用）完成后再跳转，
          // 避免页面跳转中断本地清理逻辑
          await userStore.logout();
          // 用 vue-router 编程式导航替代硬编码 window.location.href='/login'：
          // 部署在子路径时裸根路径会 404，且整页刷新会丢失 SPA 状态；
          // 与 AdminLayout.vue 等处 router.push('/login') 的写法保持一致
          router.push('/login');
          return Promise.reject(new Error('会话已过期，请重新登录'));
        } finally {
          isRefreshing = false;
        }
      } else {
        // 已经在刷新了，添加到队列
        return new Promise((resolve, reject) => {
          requestsQueue.push({ resolve, reject });
        }).then(token => {
          // 与上方原请求重发路径（originalRequest._retry = true）对称：
          // 排队请求重发前同样置位，避免新 token 下仍 401 时再次排队触发刷新
          originalRequest._retry = true;
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
