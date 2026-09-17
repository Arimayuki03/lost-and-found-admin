import { defineStore } from 'pinia';
import { getAllUsers, getAdmins, addAdmin, updateUser, deleteUser, getUserStats } from '@/api/superadmin';
import { ElMessage } from 'element-plus';

export const useAdminStore = defineStore('superAdminManagement', {
  state: () => ({
    users: [],
    admins: [],
    usersTotal: 0,
    adminsTotal: 0,
    loading: false,
    currentPage: 1,
    pageSize: 10
  }),
  
  actions: {
    async fetchUsers(page = 1, size = 10, query = '', sortBy = 'id', sortOrder = 'asc') {
      this.loading = true;
      try {
        const response = await getAllUsers({
          page,
          size,
          query,
          sort_by: sortBy,
          sort_order: sortOrder
        });
        this.users = response.items;
        this.usersTotal = response.total;
        this.currentPage = page;
        this.pageSize = size;
        return response;
      } catch (error) {
        ElMessage.error('获取用户列表失败');
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    async fetchAdmins(page = 1, size = 10, sortBy = 'id', sortOrder = 'asc') {
      this.loading = true;
      try {
        const response = await getAdmins(page, size, sortBy, sortOrder);
        this.admins = response.items;
        this.adminsTotal = response.total;
        this.currentPage = page;
        this.pageSize = size;
        return response;
      } catch (error) {
        ElMessage.error('获取管理员列表失败');
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    async addAdmin(adminData) {
      try {
        // 确保avatar_url不为null
        if (adminData.avatar_url === null || adminData.avatar_url === undefined) {
          adminData.avatar_url = '';
        }
        
        const response = await addAdmin(adminData);
        ElMessage.success('添加管理员成功');
        await this.fetchAdmins(this.currentPage, this.pageSize);
        return response;
      } catch (error) {
        ElMessage.error('添加管理员失败');
        return false;
      }
    },
    
    async updateUser(userId, userData) {
      try {
        // 确保avatar_url不为null
        if (userData.avatar_url === null || userData.avatar_url === undefined) {
          userData.avatar_url = '';
        }
        
        const response = await updateUser(userId, userData);
        ElMessage.success('更新用户信息成功');
        // 不在此处刷新列表：由调用页面刷新自己展示的列表，
        // 避免两个列表的 fetch 相互覆盖分页状态（usersTotal/adminsTotal 已拆分）
        return response;
      } catch (error) {
        ElMessage.error('更新用户信息失败');
        return false;
      }
    },
    
    async deleteUser(userId) {
      try {
        const response = await deleteUser(userId);
        ElMessage.success('删除用户成功');
        // 不在此处刷新列表：由调用页面刷新自己展示的列表，
        // 避免两个列表的 fetch 相互覆盖分页状态（usersTotal/adminsTotal 已拆分）
        return response;
      } catch (error) {
        ElMessage.error('删除用户失败');
        return false;
      }
    },
    
    /**
     * 获取用户统计数据
     * @returns {Promise<{totalUsers: number, totalAdmins: number}>} 用户统计信息
     */
    async fetchUserStats() {
      try {
        const response = await getUserStats();
        return {
          totalUsers: response.totalUsers,
          totalAdmins: response.totalAdmins
        };
      } catch (error) {
        ElMessage.error('获取用户统计数据失败');
        console.error('获取用户统计数据失败:', error);
        return {
          totalUsers: 0,
          totalAdmins: 0
        };
      }
    }
  }
}); 