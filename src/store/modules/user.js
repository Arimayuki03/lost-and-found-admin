import { defineStore } from 'pinia';
import { adminLogin } from '@/api/admin';
import { superAdminLogin } from '@/api/superadmin';
import { refreshToken } from '@/api/auth';

export const useUserStore = defineStore('user', {
  state: () => ({
    id: localStorage.getItem('userId') || null,
    token: localStorage.getItem('token') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
    role: localStorage.getItem('role') || '', // 'admin' 或 'superadmin'
    lastLoginError: '', // 最近一次登录失败的后端文案（如账号锁定/限流提示）
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

    logout() {
      this.token = '';
      this.refreshToken = '';
      this.id = null;
      this.role = '';

      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
    }
  }
}); 