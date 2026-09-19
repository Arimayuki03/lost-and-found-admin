<template>
  <div class="lf-page">
    <LfPageHeader title="用户管理" />

    <LfFilterPanel
      v-model:sort-by="sortOption"
      v-model:sort-order="sortDirection"
      v-model:search="searchQuery"
      :sort-options="sortOptions"
      search-placeholder="搜索用户名或学号"
      @search="handleSearch"
    />

    <LfTable
      v-model:page="currentPage"
      v-model:page-size="pageSize"
      :data="userList"
      :loading="adminStore.loading"
      :total="adminStore.usersTotal"
      :columns="columns"
      :page-sizes="[10, 20, 50, 100]"
      empty-text="暂无用户"
    >
      <template #avatar="{ row }">
        <el-avatar :size="40" :src="row.avatar_url || ''" />
      </template>
      <template #role="{ row }">
        <el-tag :type="row.is_admin ? 'success' : 'info'">
          {{ row.is_admin ? '管理员' : '普通用户' }}
        </el-tag>
      </template>
      <template #actions="{ row }">
        <div class="operation-buttons">
          <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </div>
      </template>
    </LfTable>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="dialogVisible" title="编辑用户" width="500px">
      <el-form ref="formRef" :model="userForm" :rules="userRules" label-width="100px">
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            action="/api/common/images/upload"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="userForm.avatar_url" :src="userForm.avatar_url" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="用户名" prop="name">
          <el-input v-model="userForm.name" />
        </el-form-item>
        <el-form-item label="学号" prop="student_id">
          <el-input v-model="userForm.student_id" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" />
        </el-form-item>
        <el-form-item label="角色">
          <el-switch v-model="userForm.is_admin" active-text="管理员" inactive-text="普通用户" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="400px">
      <p>确定要删除用户 "{{ currentUser?.name }}" 吗？此操作不可逆。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">确认删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 超级管理员 · 用户管理（与 admin 侧统一使用 LfPageHeader/LfFilterPanel/LfTable）
 */
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useAdminStore } from '@/store/modules/admin';
import { useUserStore } from '@/store/modules/user';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import LfPageHeader from '@/components/LfPageHeader.vue';
import LfFilterPanel from '@/components/LfFilterPanel.vue';
import LfTable from '@/components/LfTable.vue';

const adminStore = useAdminStore();
const userStore = useUserStore();
// 上传接口已要求登录，el-upload 直传需要手动携带 token
const uploadHeaders = computed(() => ({ Authorization: `Bearer ${userStore.token}` }));

const currentPage = ref(1);
const pageSize = ref(10);
const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const currentUser = ref(null);
const searchQuery = ref('');
const sortOption = ref('id');
const sortDirection = ref('asc');
const formRef = ref(null);
const submitting = ref(false); // 提交进行中：按钮 loading 并防重复提交

const sortOptions = [
  { label: '按ID排序', value: 'id' },
  { label: '按用户名排序', value: 'name' },
  { label: '按学号排序', value: 'student_id' },
];

const columns = [
  { prop: 'id', label: 'ID', width: 80 },
  { label: '头像', width: 100, slot: 'avatar' },
  { prop: 'name', label: '用户名', minWidth: 120 },
  { prop: 'student_id', label: '学号', minWidth: 140 },
  { prop: 'email', label: '邮箱', width: 220, showOverflowTooltip: true },
  { label: '角色', width: 100, slot: 'role' },
  { label: '操作', width: 200, slot: 'actions' },
];

const userForm = reactive({
  id: null,
  name: '',
  student_id: '',
  email: '',
  is_admin: false,
  avatar_url: '',
});

const userRules = {
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  student_id: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
};

// 列表直接信任后端返回：搜索关键词已随请求透传（/sadmin/users 按
// name/student_id/email 服务端模糊匹配），不再做客户端二次过滤，
// 避免"客户端过滤清空了列表、total 却不变"的口径不一致问题
const userList = computed(() => adminStore.users);

const fetchUsers = async () => {
  await adminStore.fetchUsers(currentPage.value, pageSize.value, searchQuery.value, sortOption.value, sortDirection.value);
};

onMounted(() => {
  fetchUsers();
});

// 分页/排序/搜索变化统一触发拉取；每页容量变化时先回到第 1 页再请求（避免停留在超出范围的页码）
watch([currentPage, pageSize], ([page, size], [, prevSize]) => {
  if (size !== prevSize && page !== 1) {
    currentPage.value = 1; // 重置页码后会再次进入本 watch 发起请求
    return;
  }
  fetchUsers();
});
// 排序变化：回到第 1 页；已在第 1 页时页码赋值不触发分页 watch，这里补发唯一请求
watch([sortOption, sortDirection], () => {
  if (currentPage.value === 1) {
    fetchUsers();
  } else {
    currentPage.value = 1; // 分页 watch 会发起唯一请求
  }
});

const handleSearch = () => {
  if (currentPage.value === 1) {
    fetchUsers(); // 已在第 1 页，页码赋值不会触发 watch，这里补发
  } else {
    currentPage.value = 1; // 分页 watch 会发起唯一请求
  }
};

// 头像上传相关方法
const handleAvatarSuccess = (response) => {
  userForm.avatar_url = response.file_url;
  ElMessage.success('头像上传成功');
};

const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isJPG) ElMessage.error('头像只能是JPG或PNG格式!');
  if (!isLt2M) ElMessage.error('头像大小不能超过2MB!');
  return isJPG && isLt2M;
};

const handleEdit = (row) => {
  Object.keys(userForm).forEach((key) => {
    userForm[key] = row[key];
  });
  dialogVisible.value = true;
};

const handleDelete = (row) => {
  currentUser.value = row;
  deleteDialogVisible.value = true;
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        const result = await adminStore.updateUser(userForm.id, userForm);
        // 失败时保持弹窗打开，让用户修正后重试（store 内已有错误提示）
        if (result !== false) {
          dialogVisible.value = false;
          await fetchUsers(); // store 不再内置刷新，此处是本页列表的唯一刷新点
        }
      } finally {
        submitting.value = false;
      }
    } else {
      ElMessage.error('请正确填写表单信息');
      return false;
    }
  });
};

const confirmDelete = async () => {
  if (currentUser.value) {
    const result = await adminStore.deleteUser(currentUser.value.id);
    if (result !== false) {
      deleteDialogVisible.value = false;
      currentUser.value = null;
      await fetchUsers(); // store 不再内置刷新，本页刷新自己展示的用户列表
    }
  }
};
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.avatar-uploader {
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100px;
  height: 100px;
  margin: 0 auto;
}

.avatar-uploader:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
}
</style>
