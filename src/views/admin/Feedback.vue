<template>
  <div class="admin-container">
    <div class="page-header">
      <div class="header-top">
        <div class="title-section">
          <h1 class="page-title">反馈管理</h1>
          <div class="title-decoration"></div>
        </div>

        <div class="header-actions">
          <el-button type="primary" class="action-button" icon="Refresh" @click="handleShowAllFeedback">
            刷新反馈
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
              <el-option label="用户ID" value="user_id" />
              <el-option label="创建时间" value="timestamp" />
            </el-select>

            <span class="filter-label">排序方式:</span>
            <el-select v-model="sortOrder" class="filter-item" @change="handleSortChange">
              <el-option label="升序" value="asc" />
              <el-option label="降序" value="desc" />
            </el-select>
          </div>

          <div class="search-group">
            <el-input v-model="searchQuery" placeholder="搜索反馈内容" class="search-input" clearable @clear="handleSearch"
              @keyup.enter="handleSearch">
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
          <!-- 反馈列表 -->
          <el-table v-loading="loading" :data="feedbacks" style="width: 100%" border :header-cell-style="{
            background: '#f0f7ff',
            color: '#1e3a8a',
            fontWeight: '600',
            fontSize: '14px',
            padding: '12px 0',
            borderBottom: '2px solid #dbeafe'
          }" :row-class-name="tableRowClassName" @sort-change="handleTableSortChange">
            <el-table-column prop="id" label="ID" width="80" sortable="custom" />
            <el-table-column prop="user_id" label="用户ID" width="100" sortable="custom" />
            <el-table-column prop="content" label="反馈内容" min-width="400" show-overflow-tooltip />
            <el-table-column prop="created_at" label="创建时间" width="180" sortable="custom">
              <template #default="scope">
                {{ formatDate(scope.row.timestamp || scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="scope">
                <div class="operation-buttons">
                  <el-button size="small" type="danger" @click="confirmDelete(scope.row.id)" class="operation-button">
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
      <span class="total-text">共 {{ totalItems }} 条记录</span>

      <div class="pagination-controls">
        <el-select v-model="pageSize" class="page-size-select" @change="handleSizeChange">
          <el-option :value="10" label="10条/页" />
          <el-option :value="20" label="20条/页" />
          <el-option :value="30" label="30条/页" />
          <el-option :value="50" label="50条/页" />
        </el-select>

        <el-pagination background layout="prev, pager, next" :total="totalItems" :current-page="currentPage"
          :page-size="pageSize" @current-change="handlePageChange" />

        <div class="go-to-page">
          跳转到
          <el-input v-model="goToPage" class="go-page-input" @keyup.enter="jumpToPage" />
          页
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { getFeedbacks, deleteFeedback as deleteApi } from '@/api/admin';
import { formatDate } from '@/utils/format';

const feedbacks = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const goToPage = ref('');
const sortBy = ref('timestamp');
const sortOrder = ref('desc');
const searchQuery = ref('');

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(totalItems.value / pageSize.value);
});

// 表格行样式
const tableRowClassName = ({ row, rowIndex }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row';
};

// 获取所有反馈
const fetchFeedbacks = async () => {
  loading.value = true;
  try {
    const response = await getFeedbacks(
      currentPage.value,
      pageSize.value,
      searchQuery.value,
      sortBy.value,
      sortOrder.value
    );

    // 检查响应格式，适应新的后端API格式
    if (response && response.items && Array.isArray(response.items)) {
      // 新的API格式，包含items和total
      feedbacks.value = response.items;
      totalItems.value = response.total || 0;
    } else if (Array.isArray(response)) {
      // 旧的API格式，直接返回数组
      feedbacks.value = response;
      totalItems.value = response.length;
    } else {
      feedbacks.value = [];
      totalItems.value = 0;
      ElMessage.info('没有反馈数据');
    }
  } catch (error) {
    ElMessage.error('获取反馈数据失败');
    feedbacks.value = [];
    totalItems.value = 0;
  } finally {
    loading.value = false;
  }
};

// 确认删除
const confirmDelete = (id) => {
  ElMessageBox.confirm('确定要删除这条反馈吗？此操作不可恢复', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteFeedback(id);
  }).catch(() => {
    ElMessage.info('已取消删除');
  });
};

// 删除反馈
const deleteFeedback = async (id) => {
  try {
    await deleteApi(id);
    ElMessage.success('反馈已删除');

    // 如果当前页没有数据了，跳转到上一页
    if (feedbacks.value.length === 1 && currentPage.value > 1) {
      currentPage.value--;
    }

    fetchFeedbacks();
  } catch (error) {
    ElMessage.error('删除反馈失败');
  }
};

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchFeedbacks();
};

// 清除搜索
const clearSearch = () => {
  searchQuery.value = '';
  currentPage.value = 1;
  fetchFeedbacks();
};

// 处理排序变化
const handleSortChange = () => {
  currentPage.value = 1;
  fetchFeedbacks();
};

// 处理表格排序变化
const handleTableSortChange = (column) => {
  if (column.prop && column.order) {
    sortBy.value = column.prop;
    sortOrder.value = column.order === 'ascending' ? 'asc' : 'desc';
    fetchFeedbacks();
  }
};

// 处理页面变化
const handlePageChange = (page) => {
  currentPage.value = page;
  fetchFeedbacks();
};

// 处理每页显示数量变化
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchFeedbacks();
};

// 跳转到指定页
const jumpToPage = () => {
  const page = parseInt(goToPage.value);
  if (page && page > 0 && page <= totalPages.value) {
    currentPage.value = page;
    fetchFeedbacks();
  } else {
    ElMessage.warning(`页码应在1到${totalPages.value}之间`);
  }
  goToPage.value = '';
};

// 显示所有反馈
const handleShowAllFeedback = () => {
  searchQuery.value = '';
  sortBy.value = 'timestamp';
  sortOrder.value = 'desc';
  currentPage.value = 1;
  fetchFeedbacks();

  ElMessage({
    type: 'success',
    message: '已显示全部反馈',
    duration: 2000
  });
};

// 页面加载时获取数据
onMounted(() => {
  fetchFeedbacks();
});
</script>

<style scoped>
/* 使用公共样式，只添加特定于此组件的样式 */

/* 空结果提示样式 */
.empty-result {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  background-color: #fff;
  border-radius: 4px;
  margin-top: 20px;
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
</style> 