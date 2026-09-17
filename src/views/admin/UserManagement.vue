<template>
  <div class="lf-page">
    <LfPageHeader title="用户管理">
      <template #actions>
        <el-button type="primary" icon="Refresh" @click="refreshUsers">刷新用户</el-button>
      </template>
    </LfPageHeader>

    <LfFilterPanel
      v-model:sort-by="sortBy"
      v-model:sort-order="sortOrder"
      v-model:search="searchQuery"
      :sort-options="sortOptions"
      search-placeholder="搜索用户名、学号或邮箱"
      @search="handleSearch"
    />

    <LfTable
      v-model:page="currentPage"
      v-model:page-size="pageSize"
      :data="users"
      :loading="loading"
      :total="total"
      :columns="columns"
      empty-text="暂无用户"
      @sort-change="handleTableSortChange"
    >
      <template #avatar="{ row }">
        <el-image
          v-if="row.avatar_url"
          :src="row.avatar_url"
          style="width: 40px; height: 40px; border-radius: 50%;"
          fit="cover"
          :preview-src-list="[row.avatar_url]"
          :initial-index="0"
          preview-teleported
        />
        <el-avatar v-else :size="40" icon="UserFilled" />
      </template>
      <template #counts="{ row }">
        <div class="count-info">
          <el-tag type="danger" size="small">失物: {{ row.lostItemsCount }}</el-tag>
          <el-tag type="success" size="small">拾物: {{ row.foundItemsCount }}</el-tag>
        </div>
      </template>
      <template #actions="{ row }">
        <div class="operation-buttons">
          <el-button type="primary" size="small" class="operation-button" @click="openEditDialog(row)">编辑</el-button>
          <el-button type="warning" size="small" class="operation-button" @click="resetPassword(row.id)">重置密码</el-button>
          <el-button type="danger" size="small" class="operation-button" @click="confirmDelete(row.id)">删除</el-button>
        </div>
      </template>
    </LfTable>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="editUserVisible" title="编辑用户信息" width="500px" :close-on-click-modal="false" @closed="resetForm">
      <el-form ref="userFormRef" :model="userForm" :rules="userFormRules" label-width="80px" label-position="right">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="userForm.name" placeholder="请输入用户姓名" />
        </el-form-item>
        <el-form-item label="学号" prop="student_id">
          <el-input v-model="userForm.student_id" placeholder="请输入学号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editUserVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getAdminUsers, updateAdminUser, deleteAdminUser, resetAdminUserPassword } from '@/api/admin';
import LfPageHeader from '@/components/LfPageHeader.vue';
import LfFilterPanel from '@/components/LfFilterPanel.vue';
import LfTable from '@/components/LfTable.vue';

const users = ref([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const sortBy = ref('student_id');
const sortOrder = ref('asc');
const searchQuery = ref('');

const sortOptions = [
  { label: 'ID', value: 'id' },
  { label: '姓名', value: 'name' },
  { label: '学号', value: 'student_id' },
  { label: '邮箱', value: 'email' },
];

const columns = [
  { prop: 'id', label: 'ID', width: 80, sortable: 'custom' },
  { label: '头像', width: 100, slot: 'avatar' },
  { prop: 'name', label: '姓名', minWidth: 120, sortable: 'custom' },
  { prop: 'student_id', label: '学号', minWidth: 150, sortable: 'custom' },
  { prop: 'email', label: '邮箱', minWidth: 200, sortable: 'custom', showOverflowTooltip: true },
  { label: '失物/拾物', width: 120, slot: 'counts' },
  { label: '操作', width: 180, fixed: 'right', slot: 'actions' },
];

// 对话框状态
const editUserVisible = ref(false);
const userForm = ref({ id: null, name: '', student_id: '' });
const userFormRef = ref(null);
const submitting = ref(false);

const userFormRules = {
  name: [
    { required: true, message: '请输入用户姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  student_id: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { pattern: /^\d+$/, message: '学号必须为数字', trigger: 'blur' },
  ],
};

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await getAdminUsers({
      page: currentPage.value,
      size: pageSize.value,
      query: searchQuery.value,
      sort_by: sortBy.value,
      sort_order: sortOrder.value,
    });
    if (response && Array.isArray(response.data)) {
      users.value = response.data;
      total.value = response.total || 0;
    } else {
      ElMessage.warning('获取用户数据格式异常');
      users.value = [];
      total.value = 0;
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败，请检查网络或权限');
    users.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const refreshUsers = () => {
  fetchUsers();
  ElMessage.success('用户列表已刷新');
};

const handleSearch = () => {
  if (currentPage.value === 1) {
    fetchUsers(); // 已在第 1 页，页码赋值不会触发 watch，这里补发
  } else {
    currentPage.value = 1; // 分页 watch 会发起唯一请求
  }
};

// 分页变化统一触发拉取；每页容量变化时先回到第 1 页再请求（避免停留在超出范围的页码）
watch([currentPage, pageSize], ([page, size], [, prevSize]) => {
  if (size !== prevSize && page !== 1) {
    currentPage.value = 1; // 重置页码后会再次进入本 watch 发起请求
    return;
  }
  fetchUsers();
});

// 排序变化：回到第 1 页；已在第 1 页时页码赋值不触发分页 watch，这里补发唯一请求
watch([sortBy, sortOrder], () => {
  if (currentPage.value === 1) {
    fetchUsers();
  } else {
    currentPage.value = 1; // 分页 watch 会发起唯一请求
  }
});

const handleTableSortChange = (column) => {
  if (!column.prop) return;
  // order 为 null 表示取消排序，回退默认排序（学号升序）
  const nextSortBy = column.order ? column.prop : 'student_id';
  const nextSortOrder = column.order ? (column.order === 'ascending' ? 'asc' : 'desc') : 'asc';
  if (nextSortBy === sortBy.value && nextSortOrder === sortOrder.value) {
    fetchUsers(); // 值无变化时 watch 不触发，显式补发
    return;
  }
  sortBy.value = nextSortBy;
  sortOrder.value = nextSortOrder; // 由排序 watch 统一触发请求
};

const openEditDialog = (user) => {
  userForm.value = { id: user.id, name: user.name, student_id: user.student_id };
  editUserVisible.value = true;
};

const resetForm = () => {
  if (userFormRef.value) userFormRef.value.resetFields();
  userForm.value = { id: null, name: '', student_id: '' };
};

const submitForm = async () => {
  if (!userFormRef.value) return;
  await userFormRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('请正确填写表单');
      return;
    }
    submitting.value = true;
    try {
      await updateAdminUser(userForm.value.id, { name: userForm.value.name, student_id: userForm.value.student_id });
      ElMessage.success('用户信息更新成功');
      editUserVisible.value = false;
      fetchUsers();
    } catch (error) {
      ElMessage.error('更新用户信息失败');
    } finally {
      submitting.value = false;
    }
  });
};

const resetPassword = async (userId) => {
  try {
    await ElMessageBox.confirm('确定要重置该用户的密码吗？重置后将生成随机新密码。', '密码重置确认', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
    });
    const res = await resetAdminUserPassword(userId);
    if (res && res.new_password) {
      ElMessageBox.alert(res.new_password, '密码已重置，请将新密码告知用户', { confirmButtonText: '知道了' }).catch(() => {});
    } else {
      ElMessage.success('密码重置成功');
    }
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('重置密码失败');
  }
};

const confirmDelete = async (userId) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？此操作不可恢复！', '删除确认', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'error',
    });
    await deleteAdminUser(userId);
    ElMessage.success('用户删除成功');
    fetchUsers();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除用户失败');
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.count-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
