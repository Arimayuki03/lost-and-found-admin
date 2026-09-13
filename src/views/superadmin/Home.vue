<template>
  <div class="home-container">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>总用户数</span>
            </div>
          </template>
          <div class="card-content">
            <el-statistic :value="userCount">
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-statistic>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>管理员数</span>
            </div>
          </template>
          <div class="card-content">
            <el-statistic :value="adminCount">
              <template #prefix>
                <el-icon><UserFilled /></el-icon>
              </template>
            </el-statistic>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card class="welcome-card">
      <h2>欢迎使用超级管理员后台</h2>
      <p>您可以在这里管理系统用户和管理员账户</p>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAdminStore } from '@/store/modules/admin';

const adminStore = useAdminStore();
const userCount = ref(0);
const adminCount = ref(0);

onMounted(async () => {
  const stats = await adminStore.fetchUserStats();
  userCount.value = stats.totalUsers;
  adminCount.value = stats.totalAdmins;
});
</script>

<style scoped>
.home-container {
  padding: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
}

.welcome-card {
  text-align: center;
  padding: 30px;
}
</style> 