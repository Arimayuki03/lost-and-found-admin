<template>
  <div class="admin-container">
    <div class="page-header">
      <div class="header-top">
        <div class="title-section">
          <h1 class="page-title">拾物管理</h1>
          <div class="title-decoration"></div>
        </div>
        
        <div class="header-actions">
          <el-button 
            type="primary" 
            :class="{ 'active-button': viewMode === 'all' }"
            @click="switchToAllItems"
            icon="List"
          >
            所有拾物
          </el-button>
          <el-button 
            type="warning" 
            :class="{ 'active-button': viewMode === 'unreviewed' }"
            @click="switchToUnreviewed"
            icon="Warning"
          >
            未审核拾物
          </el-button>
        </div>
      </div>
      
      <!-- 搜索和过滤区域 -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-group">
            <span class="filter-label">排序字段:</span>
            <el-select v-model="sortBy" class="filter-item">
              <el-option label="ID" value="id" />
              <el-option label="物品名称" value="name" />
              <el-option label="分类" value="category" />
              <el-option label="拾取地点" value="location" />
              <el-option label="状态" value="is_completed" />
              <el-option label="审核状态" value="is_under_review" />
              <el-option label="拾取时间" value="found_time" />
              <el-option label="用户ID" value="user_id" />
              <el-option label="创建时间" value="created_at" />
              <el-option label="更新时间" value="updated_at" />
            </el-select>
            
            <span class="filter-label">排序方式:</span>
            <el-select v-model="sortOrder" class="filter-item">
              <el-option label="升序" value="asc" />
              <el-option label="降序" value="desc" />
            </el-select>
          </div>
          
          <div class="search-group">
            <el-input
              v-model="searchQuery"
              placeholder="搜索物品名称或分类"
              class="search-input"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
          </div>
        </div>
        
        <!-- 添加高级筛选折叠面板 -->
        <el-collapse v-model="activeCollapse" class="filter-collapse">
          <el-collapse-item name="advancedFilter">
            <template #title>
              <div class="collapse-title">
                <el-icon><component :is="Filter" /></el-icon>
                <span>高级筛选</span>
              </div>
            </template>
            
            <div class="advanced-filter-container">
              <div class="filter-grid">
                <div class="filter-item-container">
                  <span class="filter-label">物品分类:</span>
                  <el-select v-model="filterParams.category" clearable placeholder="选择分类" class="filter-select" filterable allow-create default-first-option>
                    <el-option label="电子产品" value="电子产品" />
                    <el-option label="证件" value="证件" />
                    <el-option label="钱包" value="钱包" />
                    <el-option label="钥匙" value="钥匙" />
                    <el-option label="书籍" value="书籍" />
                    <el-option label="衣物" value="衣物" />
                    <el-option label="饰品" value="饰品" />
                    <el-option label="其他" value="其他" />
                  </el-select>
                </div>
                
                <div class="filter-item-container">
                  <span class="filter-label">物品名称:</span>
                  <el-input v-model="filterParams.name" clearable placeholder="输入物品名称" class="filter-input" />
                </div>
                
                <div class="filter-item-container">
                  <span class="filter-label">拾取地点:</span>
                  <el-input v-model="filterParams.location" clearable placeholder="输入拾取地点" class="filter-input" />
                </div>
                
                <div class="filter-item-container">
                  <span class="filter-label">状态:</span>
                  <el-select v-model="filterParams.is_completed" clearable placeholder="选择状态" class="filter-select">
                    <el-option label="已完成" :value="true" />
                    <el-option label="未完成" :value="false" />
                  </el-select>
                </div>
                
                <div class="filter-item-container">
                  <span class="filter-label">审核状态:</span>
                  <el-select v-model="filterParams.is_under_review" clearable placeholder="选择审核状态" class="filter-select">
                    <el-option label="未审核" :value="true" />
                    <el-option label="已审核" :value="false" />
                  </el-select>
                </div>
                
                <div class="filter-item-container">
                  <span class="filter-label">用户ID:</span>
                  <el-input v-model="filterParams.user_id" clearable placeholder="输入用户ID" class="filter-input" type="number" />
                </div>
                
                <!-- 添加拾取时间范围筛选 -->
                <div class="filter-item-container time-range-container">
                  <span class="filter-label">拾取时间:</span>
                  <el-date-picker
                    v-model="filterParams.found_time_range"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    class="date-range-picker"
                    clearable
                  />
                </div>
                
                <!-- 添加创建时间范围筛选 -->
                <div class="filter-item-container time-range-container">
                  <span class="filter-label">创建时间:</span>
                  <el-date-picker
                    v-model="filterParams.created_at_range"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    class="date-range-picker"
                    clearable
                  />
                </div>
              </div>
              
              <div class="filter-actions">
                <el-button type="primary" @click="applyFilter">应用筛选</el-button>
                <el-button @click="resetFilter">重置筛选</el-button>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="scrollable-content">
      <div class="main-content">
        <div class="table-container">
          <!-- 拾物列表 -->
          <el-table 
            v-loading="loading" 
            :data="foundItems" 
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
          >
            <el-table-column prop="id" label="ID" width="60" align="center" />
            <el-table-column prop="user_id" label="用户ID" width="80" align="center" />
            <el-table-column prop="category" label="分类" width="100" align="center" />
            <el-table-column prop="name" label="物品名称" min-width="120" />
            <el-table-column prop="description" label="详细描述" min-width="180" show-overflow-tooltip />
            <el-table-column label="拾取时间" width="150" align="center">
              <template #default="scope">
                {{ formatDate(scope.row.found_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="location" label="拾取地点" min-width="150" />
            <el-table-column prop="contact" label="联系方式" min-width="120" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.is_completed ? 'success' : 'info'" size="small">
                  {{ scope.row.is_completed ? '已完成' : '未完成' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="审核状态" width="80" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.is_under_review ? 'warning' : 'success'" size="small">
                  {{ scope.row.is_under_review ? '未审核' : '已审核' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="图片" width="120">
              <template #default="scope">
                <el-image
                  v-if="scope.row.image_url"
                  :src="scope.row.image_url"
                  style="width: 100px; height: 60px; border-radius: 4px;"
                  fit="contain"
                  :preview-src-list="[scope.row.image_url]"
                  preview-teleported
                  :initial-index="0"
                />
                <span v-else>无图片</span>
              </template>
            </el-table-column>
            <el-table-column label="时间信息" min-width="200">
              <template #default="scope">
                <div class="time-info">
                  <div class="time-row">
                    <span class="time-label">创建:</span>
                    <span>{{ formatDate(scope.row.created_at) }}</span>
                  </div>
                  <div class="time-row">
                    <span class="time-label">更新:</span>
                    <span>{{ formatDate(scope.row.updated_at) }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="scope">
                <div class="operation-buttons">
                  <!-- 审核按钮 - 仅对未审核物品显示 -->
                  <el-button 
                    v-if="scope.row.is_under_review" 
                    size="small" 
                    type="success" 
                    @click="confirmReviewItem(scope.row.id)"
                    class="operation-button"
                  >
                    审核
                  </el-button>
                  
                  <!-- 取消审核按钮 - 仅对已审核物品显示 -->
                  <el-button 
                    v-if="!scope.row.is_under_review" 
                    size="small" 
                    type="warning" 
                    @click="confirmCancelReview(scope.row.id)"
                    class="operation-button"
                  >
                    取消审核
                  </el-button>
                  
                  <!-- 删除按钮 -->
                  <el-button 
                    size="small" 
                    type="danger" 
                    @click="confirmDeleteItem(scope.row.id)"
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
      <span class="total-text">共 {{ totalItems }} 条记录</span>
      
      <div class="pagination-controls">
        <el-select v-model="pageSize" class="page-size-select" @change="handleSizeChange">
          <el-option :value="10" label="10条/页" />
          <el-option :value="20" label="20条/页" />
          <el-option :value="50" label="50条/页" />
        </el-select>
        
        <el-pagination
          background
          layout="prev, pager, next"
          :total="totalItems"
          :current-page="currentPage"
          :page-size="pageSize"
          @current-change="handleCurrentChange"
        />
        
        <div class="go-to-page">
          跳转到
          <el-input
            v-model="goToPage"
            class="go-page-input"
            @keyup.enter="handleGoToPage"
          />
          页
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Filter } from '@element-plus/icons-vue';
import { getFoundItems, getUnreviewedFoundItems, reviewFoundItem, deleteFoundItem as deleteApi, cancelFoundItemReview, searchFoundItems } from '@/api/admin';
import { formatDate } from '@/utils/format';

const loading = ref(false);
const foundItems = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const viewMode = ref('all');
const sortBy = ref('created_at');
const sortOrder = ref('desc');
const searchQuery = ref('');
const goToPage = ref('');
const isFiltering = ref(false);

// 高级筛选
const activeCollapse = ref([]);
const filterParams = ref({
  category: '',
  name: '',
  location: '',
  is_completed: '',
  is_under_review: '',
  user_id: '',
  found_time_range: null,
  created_at_range: null
});

// 监听排序变化
watch([sortBy, sortOrder], () => {
  fetchFoundItems();
});

// 应用高级筛选
const applyFilter = () => {
  // 检查是否有筛选条件
  const hasFilters = Object.values(filterParams.value).some(value => 
    value !== '' && value !== null
  );
  
  if (!hasFilters) {
    isFiltering.value = false;
    fetchFoundItems();
    return;
  }
  
  isFiltering.value = true;
  currentPage.value = 1; // 筛选时重置页码
  fetchFilteredItems();
};

// 获取筛选后的数据
const fetchFilteredItems = async () => {
  loading.value = true;
  
  try {
    // 准备筛选参数
    const params = {};
    
    if (filterParams.value.category) {
      params.category = filterParams.value.category;
    }
    
    if (filterParams.value.name) {
      params.name = filterParams.value.name;
    }
    
    if (filterParams.value.location) {
      params.location = filterParams.value.location;
    }
    
    if (filterParams.value.is_completed !== '') {
      params.is_completed = filterParams.value.is_completed;
    }
    
    if (filterParams.value.is_under_review !== '') {
      params.is_under_review = filterParams.value.is_under_review === true || 
                              filterParams.value.is_under_review === 'true';
    }
    
    if (filterParams.value.user_id) {
      params.user_id = filterParams.value.user_id;
    }
    
    // 添加拾取时间范围筛选
    if (filterParams.value.found_time_range && filterParams.value.found_time_range.length === 2) {
      params.found_time_start = filterParams.value.found_time_range[0];
      params.found_time_end = filterParams.value.found_time_range[1];
    }
    
    // 添加创建时间范围筛选
    if (filterParams.value.created_at_range && filterParams.value.created_at_range.length === 2) {
      params.created_at_start = filterParams.value.created_at_range[0];
      params.created_at_end = filterParams.value.created_at_range[1];
    }
    
    // 调用筛选API
    const response = await searchFoundItems(params, currentPage.value, pageSize.value);
    
    if (response.items && Array.isArray(response.items)) {
      foundItems.value = response.items;
      totalItems.value = response.total || 0;
    } else if (Array.isArray(response)) {
      foundItems.value = response;
      totalItems.value = response.length;
    } else {
      foundItems.value = [];
      totalItems.value = 0;
    }
    
    ElMessage.success(`筛选成功，共找到 ${totalItems.value} 条记录`);
  } catch (err) {
    ElMessage.error('筛选拾物失败: ' + (err.message || '未知错误'));
    foundItems.value = [];
    totalItems.value = 0;
  } finally {
    loading.value = false;
  }
};

// 重置筛选
const resetFilter = () => {
  filterParams.value = {
    category: '',
    name: '',
    location: '',
    is_completed: '',
    is_under_review: '',
    user_id: '',
    found_time_range: null,
    created_at_range: null
  };
  
  isFiltering.value = false;
  fetchFoundItems();
  ElMessage.success('已重置筛选条件');
};

// 获取拾物列表
const fetchFoundItems = async () => {
  if (isFiltering.value) {
    fetchFilteredItems();
    return;
  }

  loading.value = true;

  try {
    // 构建查询参数
    const params = {
      sort_by: sortBy.value,
      sort_order: sortOrder.value,
      query: searchQuery.value
    };
    
    let response;
    if (viewMode.value === 'unreviewed') {
      response = await getUnreviewedFoundItems(
        currentPage.value, 
        pageSize.value,
        params
      );
    } else {
      response = await getFoundItems(
        currentPage.value, 
        pageSize.value, 
        params
      );
    }
    
    if (response.items && Array.isArray(response.items)) {
      foundItems.value = response.items;
      totalItems.value = response.total || 0;
    } else if (Array.isArray(response)) {
      foundItems.value = response;
      totalItems.value = response.length;
    } else {
      foundItems.value = [];
      totalItems.value = 0;
    }
  } catch (err) {
    ElMessage.error('获取拾物列表失败');
    foundItems.value = [];
    totalItems.value = 0;
  } finally {
    loading.value = false;
  }
};

// 切换到所有拾物
const switchToAllItems = () => {
  if (viewMode.value !== 'all') {
    viewMode.value = 'all';
    currentPage.value = 1;
    isFiltering.value = false; // 切换视图时重置筛选状态
    // 保留当前排序设置
    fetchFoundItems();
    
    // 添加操作成功的提示
    ElMessage({
      type: 'success',
      message: '已显示所有拾物',
      duration: 2000
    });
  }
};

// 切换到未审核拾物
const switchToUnreviewed = () => {
  if (viewMode.value !== 'unreviewed') {
    viewMode.value = 'unreviewed';
    currentPage.value = 1;
    isFiltering.value = false; // 切换视图时重置筛选状态
    // 保留当前排序设置
    fetchFoundItems();
    
    // 添加操作成功的提示
    ElMessage({
      type: 'success',
      message: '已显示未审核拾物',
      duration: 2000
    });
  }
};

// 确认审核拾物
const confirmReviewItem = (id) => {
  ElMessageBox.confirm(
    '确定要审核通过该拾物吗？',
    '审核确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    reviewItem(id);
  }).catch(() => {
    // 用户取消操作
  });
};

// 审核拾物
const reviewItem = async (id) => {
  try {
    await reviewFoundItem(id);
    ElMessage.success('审核成功');
    // 刷新列表
    fetchFoundItems();
  } catch (err) {
    ElMessage.error('审核拾物失败');
  }
};

// 确认取消审核
const confirmCancelReview = (id) => {
  ElMessageBox.confirm(
    '确定要取消该拾物的审核状态吗？',
    '取消审核确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    cancelReview(id);
  }).catch(() => {
    // 用户取消操作
  });
};

// 取消审核
const cancelReview = async (id) => {
  try {
    await cancelFoundItemReview(id);
    ElMessage.success('取消审核成功');
    // 刷新列表
    fetchFoundItems();
  } catch (err) {
    ElMessage.error('取消审核失败');
  }
};

// 确认删除拾物
const confirmDeleteItem = (id) => {
  ElMessageBox.confirm(
    '确定要删除该拾物吗？此操作不可恢复！',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(() => {
    deleteItem(id);
  }).catch(() => {
    // 用户取消操作
  });
};

// 删除拾物
const deleteItem = async (id) => {
  try {
    await deleteApi(id);
    ElMessage.success('删除成功');
    fetchFoundItems();
  } catch (err) {
    ElMessage.error('删除拾物失败');
  }
};

// 处理页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page;
  fetchFoundItems();
};

// 处理每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchFoundItems();
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchFoundItems();
};

// 设置表格行的类名
const tableRowClassName = ({ rowIndex }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row';
};

// 跳转到指定页码
const handleGoToPage = () => {
  const page = parseInt(goToPage.value);
  if (page && page > 0 && page <= Math.ceil(totalItems.value / pageSize.value)) {
    currentPage.value = page;
    fetchFoundItems();
  } else {
    ElMessage.warning('请输入有效的页码');
  }
  goToPage.value = '';
};

// 页面加载获取数据
onMounted(() => {
  fetchFoundItems();
});
</script>

<style scoped>
/* 使用公共样式，只添加特定于此组件的样式 */

/* 时间信息样式 */
.time-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.time-row {
  display: flex;
  align-items: center;
}

.time-label {
  color: #606266;
  width: 45px;
  text-align: right;
  margin-right: 5px;
}

/* 无图片占位符 */
.no-image {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
  border-radius: 4px;
  font-size: 12px;
}

/* 图片预览对话框 */
.image-preview-dialog :deep(.el-dialog) {
  margin-top: 5vh !important;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.image-preview-dialog :deep(.el-dialog__body) {
  padding: 10px;
  text-align: center;
  overflow: auto;
  flex: 1;
}

.image-container {
  max-width: 100%;
  max-height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 表格行高设置 */
:deep(.el-table__row) {
  height: 100px; /* 拾物图片需要更高的行高 */
}

/* 单元格垂直居中 */
:deep(.el-table__cell) {
  vertical-align: middle;
}

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

/* 详情对话框样式 */
.detail-dialog {
  padding: 10px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.detail-item {
  margin-bottom: 15px;
}

.full-width {
  grid-column: span 2;
}

.detail-item h3 {
  font-size: 15px;
  margin-bottom: 8px;
  color: #606266;
  font-weight: 600;
}

.detail-item p {
  margin: 0;
  color: #303133;
  line-height: 1.5;
}

/* 优化筛选面板样式 */
.filter-collapse {
  margin-bottom: 10px;
}

.advanced-filter-container {
  padding: 10px;
  border-radius: 4px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.filter-item-container {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-label {
  font-size: 16px;
  color: #606266;
}

.filter-select,
.filter-input,
.date-range-picker {
  width: 100%;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

/* 折叠面板标题样式 */
.collapse-title {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #409EFF;
}

/* 确保筛选区域不会太高 */
:deep(.el-collapse-item__content) {
  max-height: 300px;
  overflow-y: auto;
}


</style> 