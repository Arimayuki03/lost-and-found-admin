<template>
  <div class="admin-container">
    <div class="page-header">
      <div class="header-top">
        <div class="title-section">
          <h1 class="page-title">用户管理</h1>
          <div class="title-decoration"></div>
        </div>
        
        <div class="header-actions">
          <el-button 
            type="primary" 
            class="action-button"
            icon="Refresh"
            @click="refreshUsers"
          >
            刷新用户
          </el-button>
        </div>
      </div>
      
      <!-- 搜索和过滤区域 -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-group">
            <span class="filter-label">排序字段:</span>
            <el-select v-model="sortBy" class="filter-item" @change="handleSortChange">
              <el-option label="ID" value="id" />
              <el-option label="姓名" value="name" />
              <el-option label="学号" value="student_id" />
              <el-option label="邮箱" value="email" />
            </el-select>
            
            <span class="filter-label">排序方式:</span>
            <el-select v-model="sortOrder" class="filter-item" @change="handleSortChange">
              <el-option label="升序" value="asc" />
              <el-option label="降序" value="desc" />
            </el-select>
          </div>
          
          <div class="search-group">
            <el-input
              v-model="searchQuery"
              placeholder="搜索用户名、学号或邮箱"
              class="search-input"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="scrollable-content">
      <div class="main-content">
        <div class="table-container">
          <!-- 用户列表 -->
          <el-table 
            v-loading="loading" 
            :data="users" 
            style="width: 100%" 
            border
            :header-cell-style="{
              background: '#f0f7ff',
              color: '#1e3a8a',
              fontWeight: '600',
              fontSize: '14px',
              padding: '12px 0',
              borderBottom: '2px solid #dbeafe'
            }"
            :row-class-name="tableRowClassName"
            @sort-change="handleTableSortChange"
          >
            <el-table-column prop="id" label="ID" width="80" sortable="custom" />
            <el-table-column label="头像" width="100">
              <template #default="scope">
                <el-image 
                  v-if="scope.row.avatar_url" 
                  :src="scope.row.avatar_url" 
                  style="width: 40px; height: 40px; border-radius: 50%;" 
                  fit="cover"
                  :preview-src-list="[scope.row.avatar_url]"
                  :initial-index="0"
                  preview-teleported
                />
                <el-avatar v-else :size="40" icon="UserFilled" />
              </template>
            </el-table-column>
            <el-table-column prop="name" label="姓名" min-width="120" sortable="custom" />
            <el-table-column prop="student_id" label="学号" min-width="150" sortable="custom" />
            <el-table-column prop="email" label="邮箱" min-width="200" sortable="custom" show-overflow-tooltip />
            <el-table-column label="失物/拾物" width="120">
              <template #default="scope">
                <div class="count-info">
                  <el-tag type="danger" size="small">失物: {{ scope.row.lostItemsCount }}</el-tag>
                  <el-tag type="success" size="small">拾物: {{ scope.row.foundItemsCount }}</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <div class="operation-buttons">
                  <el-button 
                    type="primary"
                    size="small"
                    @click="openEditDialog(scope.row)"
                    class="operation-button"
                  >
                    编辑
                  </el-button>
                  <el-button 
                    type="warning"
                    size="small"
                    @click="resetPassword(scope.row.id)"
                    class="operation-button"
                  >
                    重置密码
                  </el-button>
                  <el-button 
                    type="danger"
                    size="small"
                    @click="confirmDelete(scope.row.id)"
                    class="operation-button"
                  >
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          
          
        </div>
      </div>
    </div>
    
    <!-- 底部分页 -->
    <div class="pagination-container">
      <span class="total-text">共 {{ total }} 条记录</span>
      
      <div class="pagination-controls">
        <el-select v-model="pageSize" class="page-size-select" @change="handleSizeChange">
          <el-option :value="10" label="10条/页" />
          <el-option :value="20" label="20条/页" />
          <el-option :value="30" label="30条/页" />
          <el-option :value="50" label="50条/页" />
        </el-select>
        
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          @current-change="handleCurrentChange"
        />
        
        <div class="go-to-page">
          跳转到
          <el-input
            v-model="gotoPage"
            class="go-page-input"
            @keyup.enter="handleGotoPage"
          />
          页
        </div>
      </div>
    </div>
    
    <!-- 编辑用户对话框 -->
    <el-dialog
      v-model="editUserVisible"
      title="编辑用户信息"
      width="500px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userFormRules"
        label-width="80px"
        label-position="right"
      >
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
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { getAdminUsers, updateAdminUser, deleteAdminUser, resetAdminUserPassword } from '@/api/admin';

// 数据状态
const users = ref([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const sortBy = ref('student_id');
const sortOrder = ref('asc');
const searchQuery = ref('');
const gotoPage = ref('');

// 对话框状态
const editUserVisible = ref(false);
const userForm = ref({
  id: null,
  name: '',
  student_id: ''
});
const userFormRef = ref(null);
const submitting = ref(false);

// 表单验证规则
const userFormRules = {
  name: [
    { required: true, message: '请输入用户姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  student_id: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { pattern: /^\d+$/, message: '学号必须为数字', trigger: 'blur' }
  ]
};

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      query: searchQuery.value,
      sort_by: sortBy.value,
      sort_order: sortOrder.value
    };

    const response = await getAdminUsers(params);

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

// 刷新用户列表
const refreshUsers = () => {
  fetchUsers();
  ElMessage.success('用户列表已刷新');
};

// 处理排序变化
const handleSortChange = () => {
  currentPage.value = 1; // 重置到第一页
  fetchUsers();
};

// 处理表格排序变化
const handleTableSortChange = (column) => {
  if (column.prop && column.order) {
    sortBy.value = column.prop;
    sortOrder.value = column.order === 'ascending' ? 'asc' : 'desc';
    fetchUsers();
  }
};

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1; // 重置到第一页
  fetchUsers();
};

// 处理页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page;
  fetchUsers();
};

// 处理每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1; // 重置到第一页
  fetchUsers();
};

// 处理跳转到指定页
const handleGotoPage = () => {
  const page = parseInt(gotoPage.value);
  if (isNaN(page) || page < 1 || page > Math.ceil(total.value / pageSize.value)) {
    ElMessage.warning('请输入有效的页码');
    return;
  }
  
  currentPage.value = page;
  fetchUsers();
  gotoPage.value = '';
};

// 表格行样式
const tableRowClassName = ({ row, rowIndex }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row';
};

// 编辑用户信息
const openEditDialog = (user) => {
  userForm.value = {
    id: user.id,
    name: user.name,
    student_id: user.student_id
  };
  editUserVisible.value = true;
};

// 重置表单
const resetForm = () => {
  if (userFormRef.value) {
    userFormRef.value.resetFields();
  }
  userForm.value = {
    id: null,
    name: '',
    student_id: ''
  };
};

// 提交用户编辑
const submitForm = async () => {
  if (!userFormRef.value) return;
  
  await userFormRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('请正确填写表单');
      return;
    }
    
    submitting.value = true;
    try {
      await updateAdminUser(
        userForm.value.id,
        {
          name: userForm.value.name,
          student_id: userForm.value.student_id
        }
      );

      ElMessage.success('用户信息更新成功');
      editUserVisible.value = false;
      fetchUsers(); // 刷新列表
    } catch (error) {
      ElMessage.error('更新用户信息失败');
    } finally {
      submitting.value = false;
    }
  });
};

// 重置用户密码
const resetPassword = async (userId) => {
  try {
    await ElMessageBox.confirm(
      '确定要将该用户的密码重置为默认密码吗？',
      '密码重置确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    await resetAdminUserPassword(userId);

    ElMessage.success('密码重置成功');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重置密码失败');
    }
  }
};

// 删除用户
const confirmDelete = async (userId) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该用户吗？此操作不可恢复！',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
    );

    await deleteAdminUser(userId);
    ElMessage.success('用户删除成功');
    fetchUsers(); // 刷新列表
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除用户失败');
    }
  }
};

// 页面加载时获取数据
onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
/* 使用公共样式，只添加特定于此组件的样式 */
.count-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* 对话框样式优化 */
:deep(.el-dialog__header) {
  border-bottom: 1px solid #f0f0f0;
  padding: 15px 20px;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #f0f0f0;
  padding: 15px 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 操作按钮样式 */
.operation-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.operation-button {
  padding: 4px 12px !important;
  font-size: 12px !important;
}

/* 表格行高设置 */
:deep(.el-table__row) {
  height: 60px;
}

/* 单元格垂直居中 */
:deep(.el-table__cell) {
  vertical-align: middle;
}

/* 添加空结果提示样式 */
.empty-result {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  background-color: #fff;
  border-radius: 4px;
  margin-top: 20px;
}
</style> 