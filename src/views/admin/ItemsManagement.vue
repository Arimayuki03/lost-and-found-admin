<template>
  <div class="lf-page">
    <LfPageHeader :title="`${noun}管理`">
      <template #actions>
        <el-button type="primary" :class="{ 'active-button': viewMode === 'all' }" @click="switchView('all')" :icon="List">
          所有{{ noun }}
        </el-button>
        <el-button type="warning" :class="{ 'active-button': viewMode === 'unreviewed' }" @click="switchView('unreviewed')" :icon="Warning">
          未审核{{ noun }}
        </el-button>
      </template>
    </LfPageHeader>

    <LfFilterPanel
      v-model:sort-by="sortBy"
      v-model:sort-order="sortOrder"
      v-model:search="searchQuery"
      :sort-options="sortOptions"
      :search-placeholder="`搜索${noun}名称或分类`"
      @search="handleSearch"
      @apply-filter="applyFilter"
      @reset-filter="resetFilter"
    >
      <template #advanced>
        <div class="filter-grid">
          <div class="filter-item-container">
            <span class="filter-label">物品分类:</span>
            <el-select v-model="filterParams.category" clearable placeholder="选择分类" class="filter-select" filterable allow-create default-first-option>
              <el-option v-for="c in CATEGORIES" :key="c" :label="c" :value="c" />
            </el-select>
          </div>
          <div class="filter-item-container">
            <span class="filter-label">物品名称:</span>
            <el-input v-model="filterParams.name" clearable placeholder="输入物品名称" class="filter-input" />
          </div>
          <div class="filter-item-container">
            <span class="filter-label">{{ locLabel }}:</span>
            <el-input v-model="filterParams.location" clearable :placeholder="`输入${locLabel}`" class="filter-input" />
          </div>
          <div class="filter-item-container">
            <span class="filter-label">状态:</span>
            <el-select v-model="filterParams.is_completed" clearable value-on-clear="" placeholder="选择状态" class="filter-select">
              <el-option label="已完成" :value="true" />
              <el-option label="未完成" :value="false" />
            </el-select>
          </div>
          <div class="filter-item-container">
            <span class="filter-label">审核状态:</span>
            <el-select v-model="filterParams.is_under_review" clearable value-on-clear="" placeholder="选择审核状态" class="filter-select">
              <el-option label="未审核" :value="true" />
              <el-option label="已审核" :value="false" />
            </el-select>
          </div>
          <div class="filter-item-container">
            <span class="filter-label">用户ID:</span>
            <el-input v-model="filterParams.user_id" clearable placeholder="输入用户ID" class="filter-input" type="number" />
          </div>
          <div class="filter-item-container">
            <span class="filter-label">{{ timeLabel }}:</span>
            <el-date-picker
              v-model="filterParams.time_range"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              clearable
            />
          </div>
          <div class="filter-item-container">
            <span class="filter-label">创建时间:</span>
            <el-date-picker
              v-model="filterParams.created_at_range"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              clearable
            />
          </div>
        </div>
      </template>
    </LfFilterPanel>

    <LfTable
      v-model:page="currentPage"
      v-model:page-size="pageSize"
      :data="items"
      :loading="loading"
      :total="totalItems"
      :columns="columns"
      :row-height="100"
      :empty-text="`暂无${noun}记录`"
    >
      <template #time="{ row }">{{ formatDate(row[timeField]) }}</template>
      <template #completed="{ row }">
        <el-tag :type="row.is_completed ? 'success' : 'info'" size="small">
          {{ row.is_completed ? '已完成' : '未完成' }}
        </el-tag>
      </template>
      <template #review="{ row }">
        <el-tag :type="row.is_under_review ? 'warning' : 'success'" size="small">
          {{ row.is_under_review ? '未审核' : '已审核' }}
        </el-tag>
      </template>
      <template #image="{ row }">
        <el-image
          v-if="row.image_url"
          :src="row.image_url"
          style="width: 100px; height: 60px; border-radius: 4px;"
          fit="contain"
          :preview-src-list="[row.image_url]"
          preview-teleported
          :initial-index="0"
        />
        <span v-else class="no-image-text">无图片</span>
      </template>
      <template #timeInfo="{ row }">
        <div class="time-info">
          <div class="time-row"><span class="time-label">创建:</span><span>{{ formatDate(row.created_at) }}</span></div>
          <div class="time-row"><span class="time-label">更新:</span><span>{{ formatDate(row.updated_at) }}</span></div>
        </div>
      </template>
      <template #actions="{ row }">
        <div class="operation-buttons">
          <el-button v-if="row.is_under_review" size="small" type="success" class="operation-button" @click="confirmReviewItem(row.id)">
            审核
          </el-button>
          <el-button v-else size="small" type="warning" class="operation-button" @click="confirmCancelReview(row.id)">
            取消审核
          </el-button>
          <el-button size="small" type="danger" class="operation-button" @click="confirmDeleteItem(row.id)">
            删除
          </el-button>
        </div>
      </template>
    </LfTable>
  </div>
</template>

<script setup>
/**
 * 失物/拾物管理（合并原 LostItems.vue 与 FoundItems.vue 两份双胞胎代码）
 * 路由 meta.type = 'lost' | 'found' 决定文案、时间字段与接口。
 */
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { List, Warning } from '@element-plus/icons-vue';
import {
  getLostItems, getUnreviewedLostItems, reviewLostItem, deleteLostItem,
  cancelLostItemReview, searchLostItems,
  getFoundItems, getUnreviewedFoundItems, reviewFoundItem, deleteFoundItem,
  cancelFoundItemReview, searchFoundItems,
} from '@/api/admin';
import { formatDate } from '@/utils/format';
import LfPageHeader from '@/components/LfPageHeader.vue';
import LfFilterPanel from '@/components/LfFilterPanel.vue';
import LfTable from '@/components/LfTable.vue';

const route = useRoute();
const isLost = computed(() => route.meta.type !== 'found');

// 文案/字段随类型切换
const noun = computed(() => (isLost.value ? '失物' : '拾物'));
const locLabel = computed(() => (isLost.value ? '丢失地点' : '拾取地点'));
const timeLabel = computed(() => (isLost.value ? '丢失时间' : '拾取时间'));
const timeField = computed(() => (isLost.value ? 'lost_time' : 'found_time'));

const CATEGORIES = ['电子产品', '证件', '钱包', '钥匙', '书籍', '衣物', '饰品', '其他'];

// 接口按类型选择（found 侧后端接收 params 对象，lost 侧为位置参数）
const api = computed(() =>
  isLost.value
    ? {
        list: (page, size, query, by, order) => getLostItems(page, size, query, by, order),
        unreviewed: (page, size, by, order) => getUnreviewedLostItems(page, size, by, order),
        search: (params, page, size) => searchLostItems(params, page, size),
        review: reviewLostItem,
        cancel: cancelLostItemReview,
        del: deleteLostItem,
      }
    : {
        list: (page, size, query, by, order) => getFoundItems(page, size, { sort_by: by, sort_order: order, query }),
        unreviewed: (page, size, by, order) => getUnreviewedFoundItems(page, size, { sort_by: by, sort_order: order }),
        search: (params, page, size) => searchFoundItems(params, page, size),
        review: reviewFoundItem,
        cancel: cancelFoundItemReview,
        del: deleteFoundItem,
      }
);

const sortOptions = computed(() => [
  { label: 'ID', value: 'id' },
  { label: '物品名称', value: 'name' },
  { label: '分类', value: 'category' },
  { label: locLabel.value, value: 'location' },
  { label: '状态', value: 'is_completed' },
  { label: '审核状态', value: 'is_under_review' },
  { label: timeLabel.value, value: timeField.value },
  { label: '用户ID', value: 'user_id' },
  { label: '创建时间', value: 'created_at' },
  { label: '更新时间', value: 'updated_at' },
]);

const columns = computed(() => [
  { prop: 'id', label: 'ID', width: 60, align: 'center' },
  { prop: 'user_id', label: '用户ID', width: 80, align: 'center' },
  { prop: 'category', label: '分类', width: 100, align: 'center' },
  { prop: 'name', label: '物品名称', minWidth: 120 },
  { prop: 'description', label: '详细描述', minWidth: 180, showOverflowTooltip: true },
  { label: timeLabel.value, width: 150, align: 'center', slot: 'time' },
  { prop: 'location', label: locLabel.value, minWidth: 150 },
  { prop: 'contact', label: '联系方式', minWidth: 120 },
  { label: '状态', width: 80, align: 'center', slot: 'completed' },
  { label: '审核状态', width: 80, align: 'center', slot: 'review' },
  { label: '图片', width: 120, slot: 'image' },
  { label: '时间信息', minWidth: 200, slot: 'timeInfo' },
  { label: '操作', width: 150, align: 'center', fixed: 'right', slot: 'actions' },
]);

const loading = ref(false);
const items = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const sortBy = ref('created_at');
const sortOrder = ref('desc');
const searchQuery = ref('');
const viewMode = ref('all');
const isFiltering = ref(false);

const emptyFilter = () => ({
  category: '',
  name: '',
  location: '',
  is_completed: '',
  is_under_review: '',
  user_id: '',
  time_range: null,
  created_at_range: null,
});
const filterParams = ref(emptyFilter());

// 分页变化统一触发拉取；每页容量变化时先回到第 1 页再请求（避免停留在超出范围的页码）
watch([currentPage, pageSize], ([page, size], [, prevSize]) => {
  if (size !== prevSize && page !== 1) {
    currentPage.value = 1; // 重置页码后会再次进入本 watch 发起请求
    return;
  }
  fetchItems();
});

// 排序变化：回到第 1 页；已在第 1 页时页码赋值不触发分页 watch，这里补发唯一请求
watch([sortBy, sortOrder], () => {
  if (currentPage.value === 1) {
    fetchItems();
  } else {
    currentPage.value = 1; // 分页 watch 会发起唯一请求
  }
});

// 应用筛选
const applyFilter = () => {
  const hasFilters = Object.values(filterParams.value).some(
    (v) => v !== '' && v !== null && v !== undefined
  );
  isFiltering.value = hasFilters;
  if (currentPage.value === 1) {
    fetchItems(); // 已在第 1 页，页码赋值不会触发 watch，这里补发（fetchItems 内部按 isFiltering 分流）
  } else {
    currentPage.value = 1; // 分页 watch 会发起唯一请求
  }
};

// 获取筛选后的数据
const fetchFilteredItems = async () => {
  loading.value = true;
  try {
    const params = {};
    const fp = filterParams.value;
    if (fp.category) params.category = fp.category;
    if (fp.name) params.name = fp.name;
    if (fp.location) params.location = fp.location;
    // el-select 清空后 emit undefined/null 而非 ''，需三重判断避免把"已清空"误判为"筛 false"
    if (fp.is_completed !== '' && fp.is_completed !== null && fp.is_completed !== undefined) {
      params.is_completed = fp.is_completed;
    }
    if (fp.is_under_review !== '' && fp.is_under_review !== null && fp.is_under_review !== undefined) {
      params.is_under_review = fp.is_under_review === true || fp.is_under_review === 'true';
    }
    // 未审核视图下筛选面板不参与审核状态过滤，强制只看未审核
    if (viewMode.value === 'unreviewed') {
      params.is_under_review = true;
    }
    if (fp.user_id) params.user_id = fp.user_id;
    if (fp.time_range && fp.time_range.length === 2) {
      params[`${timeField.value}_start`] = fp.time_range[0];
      params[`${timeField.value}_end`] = fp.time_range[1];
    }
    if (fp.created_at_range && fp.created_at_range.length === 2) {
      params.created_at_start = fp.created_at_range[0];
      params.created_at_end = fp.created_at_range[1];
    }
    // 透传排序（后端 search 端点白名单已覆盖全部可选字段）
    params.sort_by = sortBy.value;
    params.sort_order = sortOrder.value;

    const response = await api.value.search(params, currentPage.value, pageSize.value);
    applyResponse(response);
    ElMessage.success(`筛选成功，共找到 ${totalItems.value} 条记录`);
  } catch (err) {
    ElMessage.error(`筛选${noun.value}失败: ` + (err.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

// 重置筛选
const resetFilter = () => {
  filterParams.value = emptyFilter();
  isFiltering.value = false;
  if (currentPage.value === 1) {
    fetchItems(); // 已在第 1 页，页码赋值不会触发 watch，这里补发
  } else {
    currentPage.value = 1; // 分页 watch 会发起唯一请求
  }
  ElMessage.success('已重置筛选条件');
};

// 统一处理后端分页响应（兼容 {items,total} 与裸数组两种格式）
const applyResponse = (response) => {
  if (response && Array.isArray(response.items)) {
    items.value = response.items;
    totalItems.value = response.total || 0;
  } else if (Array.isArray(response)) {
    items.value = response;
    totalItems.value = response.length;
  } else {
    items.value = [];
    totalItems.value = 0;
  }
};

// 获取列表
const fetchItems = async () => {
  if (isFiltering.value) {
    fetchFilteredItems();
    return;
  }
  loading.value = true;
  try {
    const response =
      viewMode.value === 'unreviewed'
        ? await api.value.unreviewed(currentPage.value, pageSize.value, sortBy.value, sortOrder.value)
        : await api.value.list(currentPage.value, pageSize.value, searchQuery.value, sortBy.value, sortOrder.value);
    applyResponse(response);
  } catch (err) {
    ElMessage.error(`获取${noun.value}列表失败`);
    items.value = [];
    totalItems.value = 0;
  } finally {
    loading.value = false;
  }
};

// 切换 所有/未审核 视图
const switchView = (mode) => {
  if (viewMode.value === mode) return;
  viewMode.value = mode;
  isFiltering.value = false; // 切换视图时重置筛选状态（保留排序）
  filterParams.value = emptyFilter(); // 同步清空筛选输入，避免面板显示旧值却未生效
  if (currentPage.value === 1) {
    fetchItems(); // 已在第 1 页，页码赋值不会触发 watch，这里补发
  } else {
    currentPage.value = 1; // 分页 watch 会发起唯一请求
  }
  ElMessage({ type: 'success', message: mode === 'all' ? `已显示所有${noun.value}` : `已显示未审核${noun.value}`, duration: 2000 });
};

// 确认审核
const confirmReviewItem = (id) => {
  ElMessageBox.confirm(`确定要审核通过该${noun.value}吗？`, '审核确认', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'info',
  }).then(() => reviewItem(id)).catch(() => {});
};

const reviewItem = async (id) => {
  try {
    await api.value.review(id);
    ElMessage.success('审核成功');
    fetchItems();
  } catch (err) {
    ElMessage.error(`审核${noun.value}失败`);
  }
};

// 确认取消审核
const confirmCancelReview = (id) => {
  ElMessageBox.confirm(`确定要取消该${noun.value}的审核状态吗？`, '取消审核确认', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
  }).then(() => cancelReview(id)).catch(() => {});
};

const cancelReview = async (id) => {
  try {
    await api.value.cancel(id);
    ElMessage.success('取消审核成功');
    fetchItems();
  } catch (err) {
    ElMessage.error('取消审核失败');
  }
};

// 确认删除
const confirmDeleteItem = (id) => {
  ElMessageBox.confirm(`确定要删除该${noun.value}吗？此操作不可恢复！`, '删除确认', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
  }).then(() => deleteItem(id)).catch(() => {});
};

const deleteItem = async (id) => {
  try {
    await api.value.del(id);
    ElMessage.success('删除成功');
    fetchItems();
  } catch (err) {
    ElMessage.error(`删除${noun.value}失败`);
  }
};

// 搜索
const handleSearch = () => {
  if (currentPage.value === 1) {
    fetchItems(); // 已在第 1 页，页码赋值不会触发 watch，这里补发
  } else {
    currentPage.value = 1; // 分页 watch 会发起唯一请求
  }
};

onMounted(() => {
  fetchItems();
});
</script>

<style scoped>
/* 高级筛选 4 列网格（与 LfFilterPanel 的 3 列默认区分开） */
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
  font-size: 14px;
  color: var(--lf-text-regular);
}

.filter-select,
.filter-input {
  width: 100%;
}

/* 时间信息列 */
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
  color: var(--lf-text-regular);
  width: 45px;
  text-align: right;
  margin-right: 5px;
}

.no-image-text {
  color: var(--lf-text-secondary);
}
</style>
