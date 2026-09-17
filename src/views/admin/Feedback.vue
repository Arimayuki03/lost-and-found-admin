<template>
  <div class="lf-page">
    <LfPageHeader title="反馈管理">
      <template #actions>
        <el-button type="primary" icon="Refresh" @click="handleShowAll">刷新反馈</el-button>
      </template>
    </LfPageHeader>

    <LfFilterPanel
      v-model:sort-by="sortBy"
      v-model:sort-order="sortOrder"
      v-model:search="searchQuery"
      :sort-options="sortOptions"
      search-placeholder="搜索反馈内容"
      @search="handleSearch"
    />

    <LfTable
      v-model:page="currentPage"
      v-model:page-size="pageSize"
      :data="feedbacks"
      :loading="loading"
      :total="totalItems"
      :columns="columns"
      empty-text="暂无反馈"
      @sort-change="handleTableSortChange"
    >
      <template #createdAt="{ row }">{{ formatDate(row.timestamp || row.created_at) }}</template>
      <template #actions="{ row }">
        <div class="operation-buttons">
          <el-button size="small" type="danger" class="operation-button" @click="confirmDelete(row.id)">删除</el-button>
        </div>
      </template>
    </LfTable>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getFeedbacks, deleteFeedback as deleteApi } from '@/api/admin';
import { formatDate } from '@/utils/format';
import LfPageHeader from '@/components/LfPageHeader.vue';
import LfFilterPanel from '@/components/LfFilterPanel.vue';
import LfTable from '@/components/LfTable.vue';

const feedbacks = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const sortBy = ref('timestamp');
const sortOrder = ref('desc');
const searchQuery = ref('');

const sortOptions = [
  { label: 'ID', value: 'id' },
  { label: '用户ID', value: 'user_id' },
  { label: '创建时间', value: 'timestamp' },
];

const columns = [
  { prop: 'id', label: 'ID', width: 80, sortable: 'custom' },
  { prop: 'user_id', label: '用户ID', width: 100, sortable: 'custom' },
  { prop: 'content', label: '反馈内容', minWidth: 400, showOverflowTooltip: true },
  { prop: 'timestamp', label: '创建时间', width: 180, sortable: 'custom', slot: 'createdAt' },
  { label: '操作', width: 120, fixed: 'right', slot: 'actions' },
];

const fetchFeedbacks = async () => {
  loading.value = true;
  try {
    const response = await getFeedbacks(currentPage.value, pageSize.value, searchQuery.value, sortBy.value, sortOrder.value);
    if (response && Array.isArray(response.items)) {
      feedbacks.value = response.items;
      totalItems.value = response.total || 0;
    } else if (Array.isArray(response)) {
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

const confirmDelete = (id) => {
  ElMessageBox.confirm('确定要删除这条反馈吗？此操作不可恢复', '删除确认', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
  }).then(() => deleteFeedback(id)).catch(() => ElMessage.info('已取消删除'));
};

const deleteFeedback = async (id) => {
  try {
    await deleteApi(id);
    ElMessage.success('反馈已删除');
    if (feedbacks.value.length === 1 && currentPage.value > 1) {
      currentPage.value--; // 分页 watch 会发起唯一请求
    } else {
      fetchFeedbacks(); // 页码不变时 watch 不触发，显式补发
    }
  } catch (error) {
    ElMessage.error('删除反馈失败');
  }
};

const handleSearch = () => {
  if (currentPage.value === 1) {
    fetchFeedbacks(); // 已在第 1 页，页码赋值不会触发 watch，这里补发
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
  fetchFeedbacks();
});

// 排序变化：回到第 1 页；已在第 1 页时页码赋值不触发分页 watch，这里补发唯一请求
watch([sortBy, sortOrder], () => {
  if (currentPage.value === 1) {
    fetchFeedbacks();
  } else {
    currentPage.value = 1; // 分页 watch 会发起唯一请求
  }
});

const handleTableSortChange = (column) => {
  if (!column.prop) return;
  // order 为 null 表示取消排序，回退默认排序（id 降序）
  const nextSortBy = column.order ? column.prop : 'id';
  const nextSortOrder = column.order === 'ascending' ? 'asc' : 'desc';
  if (nextSortBy === sortBy.value && nextSortOrder === sortOrder.value) {
    fetchFeedbacks(); // 值无变化时 watch 不触发，显式补发
    return;
  }
  sortBy.value = nextSortBy;
  sortOrder.value = nextSortOrder; // 由排序 watch 统一触发请求
};

const handleShowAll = () => {
  const sortChanged = sortBy.value !== 'timestamp' || sortOrder.value !== 'desc';
  searchQuery.value = '';
  sortBy.value = 'timestamp';
  sortOrder.value = 'desc';
  if (currentPage.value === 1 && !sortChanged) {
    fetchFeedbacks(); // 状态无变化时两个 watch 均不触发，这里补发
  } else if (currentPage.value !== 1 && !sortChanged) {
    currentPage.value = 1; // 分页 watch 会发起唯一请求
  }
  // 页码>1 且排序有变化：排序 watch 重置页码后由分页 watch 发起唯一请求
  ElMessage({ type: 'success', message: '已显示全部反馈', duration: 2000 });
};

onMounted(() => {
  fetchFeedbacks();
});
</script>
