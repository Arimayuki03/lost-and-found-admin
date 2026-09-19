<template>
  <div class="lf-page lf-page--flow">
    <LfPageHeader title="管理员控制面板">
      <template #actions>
        <el-button type="primary" icon="Refresh" :loading="matchingLoading" @click="runMatching">
          运行失物匹配
        </el-button>
      </template>
    </LfPageHeader>

    <!-- 数据概览卡片 -->
    <el-row :gutter="20" class="data-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>未审核失物</span>
              <el-button @click="navigateTo('/admin-dashboard/lost-items')" text type="primary">查看</el-button>
            </div>
          </template>
          <div class="card-content"><h2>{{ stats.unreviewedLostItems || 0 }}</h2></div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>未审核拾物</span>
              <el-button @click="navigateTo('/admin-dashboard/found-items')" text type="primary">查看</el-button>
            </div>
          </template>
          <div class="card-content"><h2>{{ stats.unreviewedFoundItems || 0 }}</h2></div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header><div class="card-header"><span>总失物数</span></div></template>
          <div class="card-content"><h2>{{ stats.lostTotal || 0 }}</h2></div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header><div class="card-header"><span>总拾物数</span></div></template>
          <div class="card-content"><h2>{{ stats.foundTotal || 0 }}</h2></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 匹配成功率 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card match-card">
          <template #header><div class="card-header"><span>匹配成功率</span></div></template>
          <LfChart :option="gaugeOptions" height="220px" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card match-card">
          <template #header><div class="card-header"><span>匹配状态统计</span></div></template>
          <div class="status-summary">
            <div class="status-item">
              <div class="status-label">已匹配失物</div>
              <div class="status-value">{{ matching.matched.lost || 0 }}</div>
            </div>
            <div class="status-item">
              <div class="status-label">已匹配拾物</div>
              <div class="status-value">{{ matching.matched.found || 0 }}</div>
            </div>
            <div class="status-item">
              <div class="status-label">未匹配失物</div>
              <div class="status-value">{{ matching.unmatched.lost || 0 }}</div>
            </div>
            <div class="status-item">
              <div class="status-label">未匹配拾物</div>
              <div class="status-value">{{ matching.unmatched.found || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计图表 - 分类 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header><div class="card-header"><span>失物分类统计</span></div></template>
          <LfChart :option="lostCategoryOptions" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header><div class="card-header"><span>拾物分类统计</span></div></template>
          <LfChart :option="foundCategoryOptions" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计图表 - 时间趋势 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header><div class="card-header"><span>失物时间趋势</span></div></template>
          <LfChart :option="lostTrendOptions" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header><div class="card-header"><span>拾物时间趋势</span></div></template>
          <LfChart :option="foundTrendOptions" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计图表 - 地点 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header><div class="card-header"><span>失物地点统计</span></div></template>
          <LfChart :option="lostLocationOptions" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header><div class="card-header"><span>拾物地点统计</span></div></template>
          <LfChart :option="foundLocationOptions" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
/**
 * 管理员首页：统计卡片 + 7 个图表
 * 图表全部走 LfChart（init/resize/dispose 托管），option 由 utils/chartTheme 工厂生成。
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getStats, getMatchingStats, getLostItemsStats, getFoundItemsStats, runMatching as runMatchingApi } from '@/api/admin';
import { categoryPieOption, trendLineOption, locationBarOption, gaugeOption, CHART_COLORS } from '@/utils/chartTheme';
import LfChart from '@/components/LfChart.vue';
import LfPageHeader from '@/components/LfPageHeader.vue';

const router = useRouter();
const stats = ref({});
const matching = ref({ matched: {}, unmatched: {}, matchRate: {} });
const matchingLoading = ref(false);
const timeRange = ref('all'); // 默认使用全部时间

// 各维度统计数据（后端返回后填充）
const lostStats = ref({});
const foundStats = ref({});

// option 工厂（失物/拾物共用，仅配色区分）
const gaugeOptions = computed(() => gaugeOption(matching.value.matchRate?.overall || 0));
const lostCategoryOptions = computed(() => categoryPieOption(lostStats.value.categoryStats || []));
const foundCategoryOptions = computed(() => categoryPieOption(foundStats.value.categoryStats || []));
const lostTrendOptions = computed(() => trendLineOption(lostStats.value.timeStats || [], { name: '失物数量', color: CHART_COLORS.lost }));
const foundTrendOptions = computed(() => trendLineOption(foundStats.value.timeStats || [], { name: '拾物数量', color: CHART_COLORS.found }));
const lostLocationOptions = computed(() => locationBarOption(lostStats.value.locationStats || [], { color: CHART_COLORS.danger }));
const foundLocationOptions = computed(() => locationBarOption(foundStats.value.locationStats || [], { color: CHART_COLORS.warning }));

// 刷新所有数据
const refreshData = async () => {
  await Promise.all([fetchBasicStats(), fetchMatchingStats(), fetchLostItemsStats(), fetchFoundItemsStats()]);
};

// 获取基础统计数据
const fetchBasicStats = async () => {
  try {
    stats.value = await getStats();
  } catch (error) {
    ElMessage.error('获取统计数据失败');
  }
};

// 获取匹配统计（真实物品口径，用于仪表盘与匹配状态卡片）
const fetchMatchingStats = async () => {
  try {
    const response = await getMatchingStats();
    if (!response) {
      ElMessage.warning('未获取到匹配统计数据');
      return;
    }
    matching.value = response;
  } catch (error) {
    ElMessage.error('获取匹配统计数据失败');
  }
};

// 获取失物统计数据
const fetchLostItemsStats = async () => {
  try {
    const response = await getLostItemsStats({ time_range: timeRange.value });
    if (!response) {
      ElMessage.warning('未获取到失物统计数据');
      return;
    }
    lostStats.value = response;
  } catch (error) {
    ElMessage.error('获取失物统计数据失败');
  }
};

// 获取拾物统计数据
const fetchFoundItemsStats = async () => {
  try {
    const response = await getFoundItemsStats({ time_range: timeRange.value });
    if (!response) {
      ElMessage.warning('未获取到拾物统计数据');
      return;
    }
    foundStats.value = response;
  } catch (error) {
    ElMessage.error('获取拾物统计数据失败');
  }
};

// 运行匹配算法
const refreshTimer = ref(null);

const runMatching = async () => {
  matchingLoading.value = true;
  try {
    const response = await runMatchingApi();
    // 后端 /admin/run 在后台线程执行匹配并立即返回，响应仅代表任务启动成功
    if (response && response.success) {
      ElMessage.success('匹配任务已在后台启动，稍后自动刷新');
      // 延时后刷新一次统计数据，给后台匹配留出执行时间
      clearTimeout(refreshTimer.value); // 防止连点叠加多个定时器
      refreshTimer.value = setTimeout(async () => {
        try {
          await refreshData();
        } catch (error) {
          ElMessage.error('数据刷新失败');
          console.error('刷新数据出错:', error);
        }
      }, 3000);
    } else {
      ElMessage.warning(response?.message || '匹配任务未成功启动，请稍后重试');
    }
  } catch (error) {
    ElMessage.error('运行匹配功能失败');
    console.error('运行匹配出错:', error);
  } finally {
    matchingLoading.value = false;
  }
};

onBeforeUnmount(() => {
  clearTimeout(refreshTimer.value); // 组件卸载后不再触发刷新与提示
});

const navigateTo = (path) => router.push(path);

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
/* 统一的区块间距：所有 el-row 之间保持同一节奏 */
.data-cards,
.chart-row {
  margin-bottom: 20px;
}

/* 图表卡与统计卡高度统一为「内容 + 卡片」整体一致，避免同排参差 */
.chart-card {
  height: 380px;
}

.match-card {
  height: 380px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 概览数字卡：固定高度 + 居中大数字 */
.data-cards .el-card {
  height: 140px;
}

.data-cards :deep(.el-card__body) {
  height: calc(100% - 53px);
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
}

.card-content h2 {
  margin: 0;
  font-size: 32px;
  color: var(--el-color-primary);
}

.status-summary {
  height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 10px 20px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: var(--lf-bg-page);
  border-radius: 4px;
  margin-bottom: 10px;
}

.status-label {
  font-weight: bold;
  color: var(--lf-text-regular);
}

.status-value {
  font-size: 18px;
  color: var(--el-color-primary);
  font-weight: bold;
}

/* 响应式：窄屏图表卡降高、概览卡两列 */
@media screen and (max-width: 1200px) {
  .chart-card,
  .match-card {
    height: 340px;
  }

  .data-cards :deep(.el-col) {
    width: 50%;
    margin-bottom: 20px;
  }
}
</style>
