<template>
  <div class="admin-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>管理员列表</span>
          <div class="header-right">
            <el-select v-model="sortOption" placeholder="排序方式" style="width: 150px; margin-right: 10px">
              <el-option label="按ID排序" value="id" />
              <el-option label="按用户名排序" value="name" />
              <el-option label="按学号排序" value="student_id" />
            </el-select>
            <el-select v-model="sortDirection" style="width: 120px; margin-right: 20px">
              <el-option label="升序" value="asc" />
              <el-option label="降序" value="desc" />
            </el-select>
            <el-button type="primary" @click="openAddDialog">添加管理员</el-button>
          </div>
        </div>
      </template>
      
      <el-table
        v-loading="adminStore.loading"
        :data="adminList"
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column label="头像" width="100">
          <template #default="scope">
            <el-avatar :size="40" :src="scope.row.avatar_url || ''" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="用户名" sortable />
        <el-table-column prop="student_id" label="学号" sortable />
        <el-table-column prop="email" label="邮箱" width="220" show-overflow-tooltip />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <div class="action-buttons">
              <el-button
                size="small"
                type="primary"
                @click="handleEdit(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="handleDelete(scope.row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="adminStore.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 添加/编辑管理员对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加管理员' : '编辑管理员'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="adminForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            action="/api/common/images/upload"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
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
          <el-button type="primary" @click="submitForm">确认</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="400px"
    >
      <p>确定要删除管理员 {{ currentAdmin?.name }} 吗？此操作不可恢复。</p>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">确认删除</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useAdminStore } from '@/store/modules/admin';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

const adminStore = useAdminStore();
const currentPage = ref(1);
const pageSize = ref(10);
const sortOption = ref('id'); // 默认按ID排序
const sortDirection = ref('asc'); // 默认升序
const dialogVisible = ref(false);
const dialogType = ref('add'); // 'add' 或 'edit'
const deleteDialogVisible = ref(false);
const currentAdmin = ref(null);
const formRef = ref(null);

const adminForm = reactive({
  id: '',
  name: '',
  student_id: '',
  email: '',
  password: '',
  is_admin: true,
  avatar_url: ''
});

const formRules = {
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  student_id: [
    { required: true, message: '请输入学号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ]
};

// 监听排序选项变化，重新加载数据
watch([sortOption, sortDirection], () => {
  fetchAdmins();
});

const fetchAdmins = async () => {
  await adminStore.fetchAdmins(
    currentPage.value, 
    pageSize.value,
    sortOption.value,
    sortDirection.value
  );
};

const adminList = computed(() => adminStore.admins);

const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchAdmins();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchAdmins();
};

const openAddDialog = () => {
  dialogType.value = 'add';
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  dialogType.value = 'edit';
  currentAdmin.value = row;
  resetForm();
  Object.assign(adminForm, row);
  dialogVisible.value = true;
};

const handleDelete = (row) => {
  currentAdmin.value = row;
  deleteDialogVisible.value = true;
};

const resetForm = () => {
  adminForm.id = '';
  adminForm.name = '';
  adminForm.student_id = '';
  adminForm.email = '';
  adminForm.password = '';
  adminForm.is_admin = true;
  adminForm.avatar_url = '';
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 头像上传相关方法
const handleAvatarSuccess = (response) => {
  adminForm.avatar_url = response.file_url;
  ElMessage.success('头像上传成功');
};

const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJPG) {
    ElMessage.error('头像只能是JPG或PNG格式!');
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过2MB!');
  }
  return isJPG && isLt2M;
};

const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      // 处理表单数据
      const formData = { ...adminForm };
      if (!formData.avatar_url) {
        formData.avatar_url = '';
      }

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
      }
    } else {
      ElMessage.error('请正确填写表单信息');
      return false;
    }
  });
};

const confirmDelete = async () => {
  if (currentAdmin.value) {
    const result = await adminStore.deleteUser(currentAdmin.value.id);
    if (result !== false) {
      deleteDialogVisible.value = false;
      currentAdmin.value = null;
    }
  }
};

// 初始加载
fetchAdmins();
</script>

<style scoped>
.admin-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

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
  border-color: #409EFF;
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

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 10px; /* 增加按钮之间的间距 */
}

.el-button {
  padding: 8px 15px;
  border-radius: 4px;
  transition: all 0.3s;
}

.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style> 