<template>
  <div class="lf-page lf-page--flow">
    <LfPageHeader title="超级管理员控制面板" />

    <el-row :gutter="20" class="stat-row">
      <el-col :span="12">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>总用户数</span>
              <el-icon class="card-header-icon"><User /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <span class="stat-value">{{ userCount }}</span>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>管理员数</span>
              <el-icon class="card-header-icon"><UserFilled /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <span class="stat-value">{{ adminCount }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="welcome-card">
      <template #header>
        <div class="card-header"><span>使用说明</span></div>
      </template>
      <p class="welcome-text">您可以在这里管理系统用户和管理员账户：左侧「管理员管理」维护后台账号，「用户管理」查看与处理平台用户。</p>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAdminStore } from '@/store/modules/admin';
import LfPageHeader from '@/components/LfPageHeader.vue';

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
/* 与 admin/Home 的概览卡保持同一尺寸与配色 */
.stat-row {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header-icon {
  color: var(--el-color-primary);
}

.card-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.welcome-text {
  margin: 0;
  color: var(--lf-text-regular);
  line-height: 1.7;
}

@media screen and (max-width: 1200px) {
  .stat-row :deep(.el-col) {
    width: 100%;
  }
}
</style> 