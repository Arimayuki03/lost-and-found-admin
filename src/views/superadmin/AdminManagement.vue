<template>
  <div class="lf-page">
    <LfPageHeader title="管理员管理">
      <template #actions>
        <el-button type="primary" @click="openAddDialog">添加管理员</el-button>
      </template>
    </LfPageHeader>

    <LfFilterPanel
      v-model:sort-by="sortOption"
      v-model:sort-order="sortDirection"
      :sort-options="sortOptions"
    />

    <LfTable
      v-model:page="currentPage"
      v-model:page-size="pageSize"
      :data="adminList"
      :loading="adminStore.loading"
      :total="adminStore.adminsTotal"
      :columns="columns"
      :page-sizes="[10, 20, 50, 100]"
      empty-text="暂无管理员"
    >
      <template #avatar="{ row }">
        <el-avatar :size="40" :src="row.avatar_url || ''" />
      </template>
      <template #actions="{ row }">
        <div class="operation-buttons">
          <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
          <!-- 后端 DELETE /sadmin/users 对 is_admin 用户一律 403"不能删除管理员账号"，删除按钮为死按钮已移除；管理员停用走编辑降级（有末位管理员保护） -->
        </div>
      </template>
    </LfTable>

    <!-- 添加/编辑管理员对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '添加管理员' : '编辑管理员'" width="500px">
      <el-form ref="formRef" :model="adminForm" :rules="formRules" label-width="100px">
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            :action="UPLOAD_URL"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :on-error="handleAvatarUploadError"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="adminForm.avatar_url" :src="adminForm.avatar_url" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="用户名" prop="name">
          <el-input v-model="adminForm.name" />
        </el-form-item>
        <el-form-item label="学号" prop="student_id">
          <el-input v-model="adminForm.student_id" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="adminForm.email" />
        </el-form-item>
        <el-form-item v-if="dialogType === 'add'" label="密码" prop="password">
          <el-input v-model="adminForm.password" type="password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 超级管理员 · 管理员管理（与 admin 侧统一使用 LfPageHeader/LfFilterPanel/LfTable）
 */
import { ref, reactive, computed, watch } from 'vue';
import { useAdminStore } from '@/store/modules/admin';
import { useUserStore } from '@/store/modules/user';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { UPLOAD_URL } from '@/api';
import LfPageHeader from '@/components/LfPageHeader.vue';
import LfFilterPanel from '@/components/LfFilterPanel.vue';
import LfTable from '@/components/LfTable.vue';

const adminStore = useAdminStore();
const userStore = useUserStore();
// 上传接口已要求登录，el-upload 直传需要手动携带 token
const uploadHeaders = computed(() => ({ Authorization: `Bearer ${userStore.token}` }));

const currentPage = ref(1);
const pageSize = ref(10);
const sortOption = ref('id'); // 默认按ID排序
const sortDirection = ref('asc'); // 默认升序
const dialogVisible = ref(false);
const dialogType = ref('add'); // 'add' 或 'edit'
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
  { label: '操作', width: 200, slot: 'actions' },
];

const adminForm = reactive({
  id: '',
  name: '',
  student_id: '',
  email: '',
  password: '',
  is_admin: true,
  avatar_url: '',
});

const formRules = {
  name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  student_id: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 64, message: '密码长度需为8-64位', trigger: 'blur' },
  ],
};

const adminList = computed(() => adminStore.admins);

const fetchAdmins = async () => {
  await adminStore.fetchAdmins(currentPage.value, pageSize.value, sortOption.value, sortDirection.value);
};

// 分页/排序变化统一触发拉取；每页容量变化时先回到第 1 页再请求（避免停留在超出范围的页码）
watch([currentPage, pageSize], ([page, size], [, prevSize]) => {
  if (size !== prevSize && page !== 1) {
    currentPage.value = 1; // 重置页码后会再次进入本 watch 发起请求
    return;
  }
  fetchAdmins();
});
// 排序变化：回到第 1 页；已在第 1 页时页码赋值不触发分页 watch，这里补发唯一请求
watch([sortOption, sortDirection], () => {
  if (currentPage.value === 1) {
    fetchAdmins();
  } else {
    currentPage.value = 1; // 分页 watch 会发起唯一请求
  }
});

const openAddDialog = () => {
  dialogType.value = 'add';
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  dialogType.value = 'edit';
  resetForm();
  Object.assign(adminForm, row);
  dialogVisible.value = true;
};

const resetForm = () => {
  // 先 resetFields 恢复 initialValue，再手工清空，
  // 避免 initialValue 恰为某条编辑记录时被覆盖回去（参照 admin/Announcements.vue 的顺序）
  if (formRef.value) formRef.value.resetFields();
  adminForm.id = '';
  adminForm.name = '';
  adminForm.student_id = '';
  adminForm.email = '';
  adminForm.password = '';
  adminForm.is_admin = true;
  adminForm.avatar_url = '';
};

// 头像上传相关方法
const handleAvatarSuccess = (response) => {
  adminForm.avatar_url = response.file_url;
  ElMessage.success('头像上传成功');
};

// el-upload 直传不经过 axios 拦截器，登录态失效（401）时只会走到这里，提示中补充引导
const handleAvatarUploadError = () => {
  ElMessage.error('图片上传失败，请确认登录状态后重试');
};

const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isJPG) ElMessage.error('头像只能是JPG或PNG格式!');
  if (!isLt2M) ElMessage.error('头像大小不能超过2MB!');
  return isJPG && isLt2M;
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        const formData = { ...adminForm };
        if (!formData.avatar_url) formData.avatar_url = '';

        let result;
        if (dialogType.value === 'add') {
          result = await adminStore.addAdmin(formData);
        } else {
          const { id, password, ...updateData } = formData;
          result = await adminStore.updateUser(id, updateData);
        }
        // 失败时保持弹窗打开，让用户修正后重试（store 内已有错误提示）
        if (result !== false) {
          dialogVisible.value = false;
          await fetchAdmins(); // store 不再内置刷新，本页刷新自己展示的管理员列表
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

// 初始加载
fetchAdmins();
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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
