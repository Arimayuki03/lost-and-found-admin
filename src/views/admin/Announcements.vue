<template>
  <div class="admin-container">
    <div class="page-header">
      <div class="header-top">
        <div class="title-section">
          <h1 class="page-title">公告管理</h1>
          <div class="title-decoration"></div>
        </div>

        <div class="header-actions">
          <el-button type="primary" class="action-button" icon="Plus" @click="openAddDialog">
            添加公告
          </el-button>

          <el-button type="primary" icon="Refresh" @click="handleShowAllAnnouncements">
            刷新公告
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
              <el-option label="标题" value="title" />
              <el-option label="创建时间" value="created_at" />
              <el-option label="更新时间" value="updated_at" />
            </el-select>

            <span class="filter-label">排序方式:</span>
            <el-select v-model="sortOrder" class="filter-item" @change="handleSortChange">
              <el-option label="升序" value="asc" />
              <el-option label="降序" value="desc" />
            </el-select>
          </div>

          <div class="search-group">
            <el-input v-model="searchQuery" placeholder="搜索公告标题或内容" class="search-input" @keyup.enter="handleSearch"
              clearable>
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
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
          <!-- 公告列表 -->
          <el-table v-loading="loading" :data="announcements" style="width: 100%" border :header-cell-style="{
            background: '#f0f7ff',
            color: '#1e3a8a',
            fontWeight: '600',
            fontSize: '14px',
            padding: '12px 0',
            borderBottom: '2px solid #dbeafe'
          }" :row-class-name="tableRowClassName" @sort-change="handleTableSortChange">
            <el-table-column prop="id" label="ID" width="80" sortable="custom" />
            <el-table-column prop="title" label="标题" min-width="200" sortable="custom" show-overflow-tooltip />
            <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip />
            <el-table-column prop="created_at" label="创建时间" width="180" sortable="custom">
              <template #default="scope">
                {{ formatDate(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column prop="updated_at" label="更新时间" width="180" sortable="custom">
              <template #default="scope">
                {{ formatDate(scope.row.updated_at) || '无' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="scope">
                <div class="operation-buttons">
                  <el-button type="primary" size="small" @click="openEditDialog(scope.row)" class="operation-button">
                    编辑
                  </el-button>
                  <el-button type="danger" size="small" @click="confirmDelete(scope.row.id)" class="operation-button">
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

        <el-pagination background layout="prev, pager, next" :total="total" :current-page="currentPage"
          :page-size="pageSize" @current-change="handleCurrentChange" />

        <div class="go-to-page">
          跳转到
          <el-input v-model="gotoPage" class="go-page-input" @keyup.enter="handleGotoPage" />
          页
        </div>
      </div>
    </div>

    <!-- 添加/编辑公告对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEditing ? '编辑公告' : '添加公告'" width="600px" :close-on-click-modal="false"
      @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入公告标题" />
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="请输入公告内容" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/api/admin';
import { Search } from '@element-plus/icons-vue';
import { formatDate } from '@/utils/format';

// 数据状态
const announcements = ref([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const sortBy = ref('created_at');
const sortOrder = ref('desc');
const searchQuery = ref('');
const gotoPage = ref('');

// 对话框状态
const dialogVisible = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const formRef = ref(null);

// 表单数据
const form = ref({
  id: null,
  title: '',
  content: ''
});

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在2到100个字符之间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入公告内容', trigger: 'blur' },
    { min: 5, max: 2000, message: '内容长度在5到2000个字符之间', trigger: 'blur' }
  ]
};

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(total.value / pageSize.value);
});

// 表格行样式
const tableRowClassName = ({ row, rowIndex }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row';
};

// 获取公告列表
const fetchAnnouncements = async () => {
  loading.value = true;
  try {
    const response = await getAnnouncements(
      currentPage.value,
      pageSize.value,
      searchQuery.value,
      sortBy.value,
      sortOrder.value
    );

    announcements.value = response.items || [];
    total.value = response.total || 0;
  } catch (error) {
    console.error('获取公告列表失败:', error);
    ElMessage.error('获取公告列表失败');
    announcements.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchAnnouncements();
};

// 处理排序变化
const handleSortChange = () => {
  currentPage.value = 1;
  fetchAnnouncements();
};

// 处理表格排序变化
const handleTableSortChange = (column) => {
  if (column.prop) {
    sortBy.value = column.prop;
    sortOrder.value = column.order === 'descending' ? 'desc' : 'asc';
    fetchAnnouncements();
  }
};

// 分页相关处理函数
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchAnnouncements();
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  fetchAnnouncements();
};

// 跳转页码处理
const handleGotoPage = () => {
  if (!gotoPage.value) return;

  const page = parseInt(gotoPage.value);
  if (page && page > 0 && page <= totalPages.value) {
    currentPage.value = page;
    fetchAnnouncements();
  } else {
    ElMessage.warning(`页码应在1到${totalPages.value}之间`);
  }
  gotoPage.value = '';
};

// 打开添加对话框
const openAddDialog = () => {
  form.value = {
    id: null,
    title: '',
    content: ''
  };
  isEditing.value = false;
  dialogVisible.value = true;
};

// 打开编辑对话框
const openEditDialog = (row) => {
  form.value = {
    id: row.id,
    title: row.title,
    content: row.content
  };
  isEditing.value = true;
  dialogVisible.value = true;
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      if (isEditing.value) {
        // 编辑公告
        await updateAnnouncement(form.value.id, {
          title: form.value.title,
          content: form.value.content
        });
        ElMessage.success('公告更新成功');
      } else {
        // 添加公告
        await addAnnouncement({
          title: form.value.title,
          content: form.value.content
        });
        ElMessage.success('公告添加成功');
      }

      dialogVisible.value = false;
      fetchAnnouncements(); // 刷新列表
    } catch (error) {
      console.error('操作失败: 请检查网络连接或联系管理员');
      ElMessage.error(isEditing.value ? '更新公告失败' : '添加公告失败');
    } finally {
      submitting.value = false;
    }
  });
};

// 处理删除
const handleDelete = async (id) => {
  try {
    await deleteAnnouncement(id);
    ElMessage({
      type: 'success',
      message: '删除成功',
      duration: 2000
    });

    // 如果当前页没有数据了，跳转到上一页
    if (announcements.value.length === 1 && currentPage.value > 1) {
      currentPage.value--;
    }

    fetchAnnouncements();
  } catch (error) {
    console.error('删除公告失败: 请检查网络连接或联系管理员');
    ElMessage.error('删除失败');
  }
};

// 查看所有公告（重置所有筛选）
const handleShowAllAnnouncements = () => {
  searchQuery.value = '';
  sortBy.value = 'created_at';
  sortOrder.value = 'desc';
  currentPage.value = 1;
  fetchAnnouncements();

  // 添加操作成功的提示
  ElMessage({
    type: 'success',
    message: '已显示全部公告',
    duration: 2000
  });
};

// 确认删除
const confirmDelete = (id) => {
  ElMessageBox.confirm(
    '确定要删除这条公告吗？此操作不可恢复',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      draggable: true,
    }
  )
    .then(() => {
      handleDelete(id);
    })
    .catch(() => {
      // 用户取消删除操作
    });
};

// 页面加载时获取数据
onMounted(() => {
  fetchAnnouncements();
});
</script>

<style scoped>
/* 使用公共样式，只添加特定于此组件的样式 */

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

/* 内容单元格样式 */
:deep(.el-table__row .el-table__cell.content-cell) {
  padding-top: 12px;
  padding-bottom: 12px;
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
