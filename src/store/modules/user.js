import { defineStore } from 'pinia';
import { adminLogin } from '@/api/admin';
import { superAdminLogin } from '@/api/superadmin';
import { refreshToken, serverLogout } from '@/api/auth';

export const useUserStore = defineStore('user', {
  state: () => ({
    id: localStorage.getItem('userId') || null,
    token: localStorage.getItem('token') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
    role: localStorage.getItem('role') || '', // 'admin' 或 'superadmin'
    lastLoginError: '', // 最近一次登录失败的后端文案（如账号锁定/限流提示）
    isLoggingOut: false, // 登出进行中标志：防止 401 处理器与手动登出并发重入
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    isSuperAdmin: (state) => state.role === 'superadmin',
    isAdmin: (state) => state.role === 'admin',
  },
  
  actions: {
    /**
     * 登录。返回 true/false；失败时错误文案写入 this.lastLoginError，
     * 优先取后端 response.data.error（如 429 锁定/限流提示），无则回退通用文案。
     */
    async loginAsAdmin(adminForm) {
      this.lastLoginError = '';
      try {
        const response = await adminLogin({
          student_id: adminForm.student_id,
          password: adminForm.password
        });
        this.setUserData(response, 'admin');
        return true;
      } catch (error) {
        this.lastLoginError = error?.response?.data?.error || '用户名或密码错误';
        return false;
      }
    },

    async loginAsSuperAdmin(credentials) {
      this.lastLoginError = '';
      try {
        const response = await superAdminLogin(credentials);
        this.setUserData(response, 'superadmin');
        return true;
      } catch (error) {
        this.lastLoginError = error?.response?.data?.error || '用户名或密码错误';
        return false;
      }
    },
    
    setUserData(response, role) {
      this.token = response.access_token;
      this.refreshToken = response.refresh_token;
      this.id = response.id;
      this.role = role;
      
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('refreshToken', response.refresh_token);
      localStorage.setItem('userId', response.id);
      localStorage.setItem('role', role);
    },
    
    async refreshAccessToken() {
      const response = await refreshToken(this.refreshToken);
      // 只更新access token，不更新refresh token
      this.token = response.access_token;
      localStorage.setItem('token', response.access_token);
      return response;
    },

    /**
     * 登出：有 token 时先调用服务端 /common/logout 撤销令牌，无论成败
     * （fail-open，catch 吞掉）都继续执行本地清理。服务端调用走 api/auth.js
     * 的原始 axios，绕开 api/index.js 的 401 拦截器，确保登出接口自身
     * 返回 401 时不会再触发 logout 造成死循环。
     * isLoggingOut 标志保证幂等：axios 401 处理器与手动登出并发时只执行一次。
     */
    async logout() {
      if (this.isLoggingOut) return; // 已在登出流程中，直接返回保证幂等
      this.isLoggingOut = true;
      try {
        // 快照当前令牌：服务端撤销用快照，清理前用于检测是否有新登录写入
        const accessToken = this.token;
        if (accessToken) {
          try {
            await serverLogout(accessToken, this.refreshToken);
          } catch (error) {
            // 服务端撤销失败（含 401/网络错误）不阻断登出，本地照常清理
            console.warn('服务端登出失败（已忽略）:', error?.message || error);
          }
        }

        // 服务端调用期间若已重新登录（token 被覆盖），跳过清理避免误清新会话
        if (!accessToken || this.token === accessToken) {
          this.token = '';
          this.refreshToken = '';
          this.id = null;
          this.role = '';

          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('role');
        }
      } finally {
        this.isLoggingOut = false;
      }
    }
  }
}); 