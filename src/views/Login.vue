<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2 class="login-title">失物招领后台管理系统</h2>
        <p class="login-subtitle">欢迎使用，请登录您的账号</p>
      </div>
      
      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="管理员登录" name="admin">
          <!-- 普通管理员登录表单 -->
          <el-form ref="adminFormRef" :model="adminForm" :rules="rules">
            <el-form-item prop="student_id">
              <el-input v-model="adminForm.student_id" placeholder="管理员学号" prefix-icon="User" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="adminForm.password" type="password" placeholder="密码" prefix-icon="Lock"
                @keyup.enter="loginAsAdmin" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" class="login-button" :loading="adminLoading" @click="loginAsAdmin">
                管理员登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="超级管理员登录" name="superadmin">
          <!-- 超级管理员登录表单 -->
          <el-form ref="superAdminFormRef" :model="superAdminForm" :rules="rules">
            <el-form-item prop="name">
              <el-input v-model="superAdminForm.name" placeholder="超级管理员用户名" prefix-icon="User" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="superAdminForm.password" type="password" placeholder="密码" prefix-icon="Lock"
                @keyup.enter="loginAsSuperAdmin" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" class="login-button" :loading="superAdminLoading" @click="loginAsSuperAdmin">
                超级管理员登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      
      <div class="login-footer">
        <p>© 2025 失物招领后台管理系统</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { ElMessage } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();
const activeTab = ref('admin');

// 表单引用
const adminFormRef = ref(null);
const superAdminFormRef = ref(null);

// 表单数据
const adminForm = reactive({
  student_id: '',
  password: ''
});
const superAdminForm = reactive({
  name: '',
  password: ''
});

// 加载状态
const adminLoading = ref(false);
const superAdminLoading = ref(false);

// 验证规则
const rules = {
  student_id: [
    { required: true, message: '请输入学号', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
};

// 普通管理员登录
const loginAsAdmin = async () => {
  if (!adminFormRef.value) return;
  
  await adminFormRef.value.validate(async (valid) => {
    if (valid) {
      adminLoading.value = true;
      try {
        const success = await userStore.loginAsAdmin({
          student_id: adminForm.student_id,
          password: adminForm.password
        });
        if (success) {
          ElMessage.success('管理员登录成功');
          router.push('/admin-dashboard');
        } else {
          ElMessage.error('登录失败：用户名或密码错误');
        }
      } catch (error) {
        // 避免输出包含敏感信息的错误
        console.error('登录失败: 请检查网络连接或联系管理员');
        ElMessage.error('登录失败：' + (error.message || '服务器连接异常'));
      } finally {
        adminLoading.value = false;
      }
    }
  });
};

// 超级管理员登录
const loginAsSuperAdmin = async () => {
  if (!superAdminFormRef.value) return;
  
  await superAdminFormRef.value.validate(async (valid) => {
    if (valid) {
      superAdminLoading.value = true;
      try {
        const success = await userStore.loginAsSuperAdmin({
          name: superAdminForm.name,
          password: superAdminForm.password
        });
        if (success) {
          ElMessage.success('超级管理员登录成功');
          router.push('/superadmin-dashboard');
        } else {
          ElMessage.error('登录失败：用户名或密码错误');
        }
      } catch (error) {
        // 避免输出包含敏感信息的错误
        console.error('登录失败: 请检查网络连接或联系管理员');
        ElMessage.error('登录失败：' + (error.message || '服务器连接异常'));
      } finally {
        superAdminLoading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: #f0f2f5;
  background-image: url('@/assets/images/login-bg.jpg');
  background-size: cover;
  background-position: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(3px);
  z-index: 1;
}

.login-box {
  width: 400px;
  padding: 30px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.login-box:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 25px;
}

.login-title {
  font-size: 28px;
  color: #303133;
  margin-bottom: 8px;
  font-weight: 600;
}

.login-subtitle {
  font-size: 14px;
  color: #909399;
  margin-bottom: 20px;
}

.login-tabs :deep(.el-tabs__nav) {
  width: 100%;
  display: flex;
}

.login-tabs :deep(.el-tabs__item) {
  flex: 1;
  text-align: center;
}

.login-button {
  width: 100%;
  height: 40px;
  font-size: 16px;
  border-radius: 4px;
  margin-top: 10px;
  transition: all 0.3s;
}

.login-button:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.login-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 12px;
  color: #909399;
}

:deep(.el-input__wrapper) {
  border-radius: 4px;
  padding: 0 15px;
}

:deep(.el-input__inner) {
  height: 40px;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}
</style> 