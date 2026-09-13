<template>
  <div class="home-container">
    <h1>管理员控制面板</h1>

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
          <div class="card-content">
            <h2>{{ stats.unreviewedLostItems || 0 }}</h2>
          </div>
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
          <div class="card-content">
            <h2>{{ stats.unreviewedFoundItems || 0 }}</h2>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>总失物数</span>
            </div>
          </template>
          <div class="card-content">
            <h2>{{ stats.lostTotal || 0 }}</h2>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>总拾物数</span>
            </div>
          </template>
          <div class="card-content">
            <h2>{{ stats.foundTotal || 0 }}</h2>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 工具栏 -->
    <div class="dashboard-toolbar">
      <div class="action-buttons">
        <el-button type="primary" @click="runMatching" :loading="matchingLoading">运行失物匹配</el-button>
      </div>
    </div>

    <!-- 匹配成功率 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card match-card">
          <template #header>
            <div class="card-header">
              <span>匹配成功率</span>
            </div>
          </template>
          <div class="chart-container" ref="matchingSuccessRateRef"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="chart-card match-card">
          <template #header>
            <div class="card-header">
              <span>匹配状态统计</span>
            </div>
          </template>
          <div class="status-summary">
            <div class="status-item">
              <div class="status-label">已匹配物品</div>
              <div class="status-value">{{ stats.matchedItems || 0 }}</div>
            </div>
            <div class="status-item">
              <div class="status-label">未匹配失物</div>
              <div class="status-value">{{ Math.round(stats.lostTotal - stats.matchedItems) || 0 }}</div>
            </div>
            <div class="status-item">
              <div class="status-label">未匹配拾物</div>
              <div class="status-value">{{ Math.round(stats.foundTotal - stats.matchedItems) || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计图表 - 第一行 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>失物分类统计</span>
            </div>
          </template>
          <div class="chart-container" ref="lostCategoryChartRef"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>拾物分类统计</span>
            </div>
          </template>
          <div class="chart-container" ref="foundCategoryChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计图表 - 第二行 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>失物时间趋势</span>
            </div>
          </template>
          <div class="chart-container" ref="lostMonthChartRef"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>拾物时间趋势</span>
            </div>
          </template>
          <div class="chart-container" ref="foundMonthChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计图表 - 第三行 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>失物地点统计</span>
            </div>
          </template>
          <div class="chart-container" ref="lostLocationChartRef"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>拾物地点统计</span>
            </div>
          </template>
          <div class="chart-container" ref="foundLocationChartRef"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getStats, getLostItemsStats, getFoundItemsStats, runMatching as runMatchingApi } from '@/api/admin';
import * as echarts from 'echarts';

const router = useRouter();
const stats = ref({});
const matchingLoading = ref(false);

const timeRange = ref('all'); // 默认使用全部时间

// 图表引用
const lostCategoryChartRef = ref(null);
const foundCategoryChartRef = ref(null);
const lostMonthChartRef = ref(null);
const foundMonthChartRef = ref(null);
const lostLocationChartRef = ref(null);
const foundLocationChartRef = ref(null);
const matchingSuccessRateRef = ref(null);

// 图表实例
let lostCategoryChart = null;
let foundCategoryChart = null;
let lostMonthChart = null;
let foundMonthChart = null;
let lostLocationChart = null;
let foundLocationChart = null;
let matchingSuccessRateChart = null;

// 定义防抖的resize处理计时器
let resizeTimer = null;

// 刷新所有数据
const refreshData = async () => {
  try {
    await fetchBasicStats();
    await fetchLostItemsStats();
    await fetchFoundItemsStats();
    
    // 确保图表更新
    updateAllCharts();
  } catch (error) {
    console.error('刷新数据出错:', error);
    throw error;
  }
};

// 更新所有图表
const updateAllCharts = () => {
  updateMatchingSuccessRateChart();
  
  // 如果各图表已有数据，强制重绘
  if (lostCategoryChart) lostCategoryChart.setOption(lostCategoryChart.getOption(), true);
  if (foundCategoryChart) foundCategoryChart.setOption(foundCategoryChart.getOption(), true);
  if (lostMonthChart) lostMonthChart.setOption(lostMonthChart.getOption(), true);
  if (foundMonthChart) foundMonthChart.setOption(foundMonthChart.getOption(), true);
  if (lostLocationChart) lostLocationChart.setOption(lostLocationChart.getOption(), true);
  if (foundLocationChart) foundLocationChart.setOption(foundLocationChart.getOption(), true);
};

// 获取基础统计数据
const fetchBasicStats = async () => {
  try {
    const response = await getStats();
    stats.value = response;

    // 确保图表实例已创建后再更新
    updateMatchingSuccessRateChart();
  } catch (error) {
    ElMessage.error('获取统计数据失败');
  }
};

// 获取失物统计数据
const fetchLostItemsStats = async () => {
  try {
    // 仅传递时间范围参数
    const params = {
      time_range: timeRange.value
    };

    const response = await getLostItemsStats(params);

    // 检查数据是否存在
    if (!response) {
      ElMessage.warning('未获取到失物统计数据');
      return;
    }

    // 初始化各图表
    if (response.categoryStats) {
      initLostCategoryChart(response.categoryStats);
    }

    if (response.timeStats) {
      initLostMonthChart(response.timeStats);
    }

    if (response.locationStats) {
      initLostLocationChart(response.locationStats);
    }
  } catch (error) {
    ElMessage.error('获取失物统计数据失败');
  }
};

// 获取拾物统计数据
const fetchFoundItemsStats = async () => {
  try {
    // 仅传递时间范围，不传递时间单位
    const params = {
      time_range: timeRange.value
    };

    const response = await getFoundItemsStats(params);

    // 检查数据是否存在
    if (!response) {
      ElMessage.warning('未获取到拾物统计数据');
      return;
    }

    // 初始化各图表
    if (response.categoryStats) {
      initFoundCategoryChart(response.categoryStats);
    }

    if (response.timeStats) {
      initFoundMonthChart(response.timeStats);
    }

    if (response.locationStats) {
      initFoundLocationChart(response.locationStats);
    }
  } catch (error) {
    ElMessage.error('获取拾物统计数据失败');
  }
};

// 初始化失物类别图表
const initLostCategoryChart = (data) => {
  if (!lostCategoryChartRef.value || !data || data.length === 0) return;

  if (!lostCategoryChart) {
    lostCategoryChart = echarts.init(lostCategoryChartRef.value);
  }

  lostCategoryChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: data.map(item => item.name)
    },
    series: [
      {
        name: '分类统计',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '12',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  });
};

// 初始化拾物类别图表
const initFoundCategoryChart = (data) => {
  if (!foundCategoryChartRef.value || !data || data.length === 0) return;

  if (!foundCategoryChart) {
    foundCategoryChart = echarts.init(foundCategoryChartRef.value);
  }

  foundCategoryChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: data.map(item => item.name)
    },
    series: [
      {
        name: '分类统计',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '12',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  });
};

// 初始化失物时间趋势图表 - 修改为线图
const initLostMonthChart = (data) => {
  if (!lostMonthChartRef.value || !data || data.length === 0) return;

  if (!lostMonthChart) {
    lostMonthChart = echarts.init(lostMonthChartRef.value);
  }

  // 直接使用后端返回的数据，不再根据视图类型处理
  const xAxisData = data.map(item => item.month || item.date || '');
  const seriesData = data.map(item => item.count);

  lostMonthChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        return `${params[0].name}: ${params[0].value}件`;
      }
    },
    grid: {
      top: '40px',
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: {
        rotate: 45  // 固定旋转角度，删除条件判断
      }
    },
    yAxis: {
      type: 'value',
      name: '数量',
      minInterval: 1
    },
    series: [
      {
        name: '失物数量',
        type: 'line',
        data: seriesData,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        },
        itemStyle: {
          color: '#409EFF'
        },
        lineStyle: {
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8,
        smooth: true
      }
    ]
  });
};

// 初始化拾物时间趋势图表 - 修改为线图
const initFoundMonthChart = (data) => {
  if (!foundMonthChartRef.value || !data || data.length === 0) return;

  if (!foundMonthChart) {
    foundMonthChart = echarts.init(foundMonthChartRef.value);
  }

  // 直接使用后端返回的数据
  const xAxisData = data.map(item => item.month || item.date || '');
  const seriesData = data.map(item => item.count);

  foundMonthChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        return `${params[0].name}: ${params[0].value}件`;
      }
    },
    grid: {
      top: '40px',
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '数量',
      minInterval: 1
    },
    series: [
      {
        name: '拾物数量',
        type: 'line',
        data: seriesData,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.5)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
          ])
        },
        itemStyle: {
          color: '#67C23A'
        },
        lineStyle: {
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8,
        smooth: true
      }
    ]
  });
};

// 修改失物地点统计图表的初始化函数
const initLostLocationChart = (data) => {
  if (!lostLocationChartRef.value || !data || data.length === 0) return;

  if (!lostLocationChart) {
    lostLocationChart = echarts.init(lostLocationChartRef.value);
  }

  // 准备数据，按照数量倒序排列
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  const locations = sortedData.map(item => item.location);
  const counts = sortedData.map(item => item.count);

  lostLocationChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%', // 增加底部留白，为标签腾出空间
      top: '10%',    // 增加顶部留白
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: ''
    },
    yAxis: {
      type: 'category',
      data: locations,
      axisLabel: {
        interval: 0,      // 显示所有标签
        width: 110,       // 限制标签宽度
        overflow: 'truncate', // 溢出时显示省略号
        formatter: function (value) {
          // 如果文本过长，截断显示
          if (value.length > 15) {
            return value.substring(0, 12) + '...';
          }
          return value;
        }
      }
    },
    series: [
      {
        name: '数量',
        type: 'bar',
        data: counts,
        itemStyle: {
          color: '#f56c6c'  // 红色
        }
      }
    ]
  });
};

// 修改拾物地点统计图表的初始化函数
const initFoundLocationChart = (data) => {
  if (!foundLocationChartRef.value || !data || data.length === 0) return;

  if (!foundLocationChart) {
    foundLocationChart = echarts.init(foundLocationChartRef.value);
  }

  // 准备数据，按照数量倒序排列
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  const locations = sortedData.map(item => item.location);
  const counts = sortedData.map(item => item.count);

  foundLocationChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%', // 增加底部留白
      top: '10%',    // 增加顶部留白
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: ''
    },
    yAxis: {
      type: 'category',
      data: locations,
      axisLabel: {
        interval: 0,      // 显示所有标签
        width: 110,       // 限制标签宽度
        overflow: 'truncate', // 溢出时显示省略号
        formatter: function (value) {
          // 如果文本过长，截断显示
          if (value.length > 15) {
            return value.substring(0, 12) + '...';
          }
          return value;
        }
      }
    },
    series: [
      {
        name: '数量',
        type: 'bar',
        data: counts,
        itemStyle: {
          color: '#e6a23c'  // 黄色
        }
      }
    ]
  });
};

// 修改匹配成功率图表的配置
const updateMatchingSuccessRateChart = () => {
  // 确保DOM引用和图表实例存在
  if (!matchingSuccessRateRef.value) return;

  // 强制重新创建图表实例以确保数据刷新
  if (matchingSuccessRateChart) {
    matchingSuccessRateChart.dispose();
    matchingSuccessRateChart = null;
  }
  
  matchingSuccessRateChart = echarts.init(matchingSuccessRateRef.value);

  // 使用当前stats中的数据
  const matchRate = stats.value.matchSuccessRate || 0;

  // 完整的图表配置
  const option = {
    series: [
      {
        type: 'gauge',
        radius: '100%',
        center: ['50%', '60%'],
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 10,
        axisLine: {
          lineStyle: {
            width: 30,
            color: [
              [0.3, '#f56c6c'],
              [0.7, '#e6a23c'],
              [1, '#67c23a']
            ]
          }
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '12%',
          width: 20,
          offsetCenter: [0, '-60%'],
          itemStyle: {
            color: 'inherit'
          }
        },
        axisTick: {
          length: 12,
          lineStyle: {
            color: 'inherit',
            width: 2
          }
        },
        splitLine: {
          length: 20,
          lineStyle: {
            color: 'inherit',
            width: 5
          }
        },
        axisLabel: {
          color: '#464646',
          fontSize: 16,
          distance: -80,
          formatter: function (value) {
            if (value === 0 || value === 100) {
              return value + '%';
            }
            return '';
          }
        },
        title: {
          show: false,
        },
        detail: {
          fontSize: 36,
          offsetCenter: [0, '0%'],
          valueAnimation: true,
          formatter: function (value) {
            return Math.round(value) + '%';
          },
          color: '#409EFF'
        },
        data: [
          {
            value: matchRate,
            name: ''
          }
        ]
      }
    ]
  };

  // 设置图表选项
  matchingSuccessRateChart.setOption(option, true);  // 添加true参数强制重绘
};

// 运行匹配算法
const runMatching = async () => {
  try {
    matchingLoading.value = true;

    
    const response = await runMatchingApi();
    ElMessage.success('匹配功能运行成功');
    
    // 提示正在刷新数据
    ElMessage.info('正在刷新数据，请稍候...');
    
    // 延迟2秒再刷新数据，确保后端数据已经完全更新
    setTimeout(async () => {
      try {
        // 强制清空当前stats，确保全新获取数据
        stats.value = {};
        
        // 使用刷新数据函数
        await refreshData();
        
        ElMessage.success('数据已成功刷新');
      } catch (error) {
        ElMessage.error('数据刷新失败');
        console.error('刷新数据出错:', error);
      }
    }, 2000);
    
  } catch (error) {
    ElMessage.error('运行匹配功能失败');
    console.error('运行匹配出错:', error);
  } finally {
    matchingLoading.value = false;
  }
};

// 页面跳转
const navigateTo = (path) => {
  router.push(path);
};

// 处理窗口大小变化，调整图表尺寸
const handleResize = () => {
  if (resizeTimer) {
    clearTimeout(resizeTimer);
  }

  resizeTimer = setTimeout(() => {
    lostCategoryChart?.resize();
    foundCategoryChart?.resize();
    lostMonthChart?.resize();
    foundMonthChart?.resize();
    lostLocationChart?.resize();
    foundLocationChart?.resize();
    matchingSuccessRateChart?.resize();
  }, 200);
};

// 创建ResizeObserver监听容器大小变化
let resizeObserver = null;

onMounted(() => {
  // 先获取基础统计数据
  fetchBasicStats();

  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize);

  // 确保DOM已经渲染，然后再初始化图表
  setTimeout(() => {
    try {
      // 修复：确保图表实例不存在时才初始化
      if (lostCategoryChartRef.value && !lostCategoryChart) lostCategoryChart = echarts.init(lostCategoryChartRef.value);
      if (foundCategoryChartRef.value && !foundCategoryChart) foundCategoryChart = echarts.init(foundCategoryChartRef.value);
      if (lostMonthChartRef.value && !lostMonthChart) lostMonthChart = echarts.init(lostMonthChartRef.value);
      if (foundMonthChartRef.value && !foundMonthChart) foundMonthChart = echarts.init(foundMonthChartRef.value);
      if (lostLocationChartRef.value && !lostLocationChart) lostLocationChart = echarts.init(lostLocationChartRef.value);
      if (foundLocationChartRef.value && !foundLocationChart) foundLocationChart = echarts.init(foundLocationChartRef.value);
      if (matchingSuccessRateRef.value && !matchingSuccessRateChart) {
        matchingSuccessRateChart = echarts.init(matchingSuccessRateRef.value);
        // 重要：初始化后立即更新图表
        updateMatchingSuccessRateChart();
      }

      // 获取其他统计数据
      fetchLostItemsStats();
      fetchFoundItemsStats();
    } catch (error) {
      ElMessage.error('图表初始化失败');
    }
  }, 300);

  // 使用ResizeObserver监听容器大小变化
  try {
    resizeObserver = new ResizeObserver(handleResize);

    // 监听每个图表容器的大小变化
    const chartRefs = [
      lostCategoryChartRef, foundCategoryChartRef,
      lostMonthChartRef, foundMonthChartRef,
      lostLocationChartRef, foundLocationChartRef,
      matchingSuccessRateRef
    ];

    chartRefs.forEach(ref => {
      if (ref.value) resizeObserver.observe(ref.value);
    });
  } catch (error) {
  }
});

// 在组件卸载前移除事件监听器和观察器
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);

  // 取消观察并销毁观察器
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  // 销毁图表实例，释放资源
  lostCategoryChart?.dispose();
  foundCategoryChart?.dispose();
  lostMonthChart?.dispose();
  foundMonthChart?.dispose();
  lostLocationChart?.dispose();
  foundLocationChart?.dispose();
  matchingSuccessRateChart?.dispose();

  // 清空图表引用
  lostCategoryChart = null;
  foundCategoryChart = null;
  lostMonthChart = null;
  foundMonthChart = null;
  lostLocationChart = null;
  foundLocationChart = null;
  matchingSuccessRateChart = null;
});
</script>

<style scoped>
.home-container {
  padding: 20px;
  color: #2364cd;
  height: calc(100vh - 100px);
  /* 确保高度考虑了页头和其他元素 */
  max-height: unset !important;
  /* 覆盖可能的最大高度限制 */
  overflow-y: auto !important;
  /* 强制启用垂直滚动 */
  overflow-x: hidden;
  /* 防止水平滚动 */
}

.data-cards {
  margin-bottom: 30px;
}

.dashboard-toolbar {
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.chart-row {
  margin-bottom: 30px;
}

.chart-card {
  height: 400px;
  margin-bottom: 30px;
}

.chart-container {
  height: 320px;
  width: 100%;
}

/* 恢复滚动条样式 */
.home-container::-webkit-scrollbar {
  width: 8px !important;
  height: 8px !important;
  display: block !important;
}

.home-container::-webkit-scrollbar-thumb {
  background: #c0c4cc !important;
  border-radius: 4px !important;
}

.home-container::-webkit-scrollbar-track {
  background: #f5f7fa !important;
}

/* 确保滚动条始终可见 */
.home-container {
  scrollbar-width: thin !important;
  scrollbar-color: #c0c4cc #f5f7fa !important;
  -ms-overflow-style: scrollbar !important;
}

/* 响应式调整 */
@media screen and (max-width: 1200px) {
  .chart-card {
    height: 350px;
  }

  .el-col {
    width: 100% !important;
    margin-bottom: 20px;
  }

  .dashboard-toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}

/* 修复父容器滚动限制 */
:deep(.el-main) {
  overflow-y: auto !important;
  height: 100% !important;
  padding-bottom: 60px !important;
}

:deep(.el-container) {
  height: 100% !important;
}

/* 添加固定高度和最小宽度给卡片 */
.data-cards .el-card {
  height: 140px;
  min-width: 100%;
}

/* 统一卡片头部样式 */
.data-cards .el-card :deep(.el-card__header) {
  padding: 15px;
  height: 50px;
  display: flex;
  align-items: center;
}

/* 统一卡片内容区样式 */
.data-cards .el-card :deep(.el-card__body) {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 数据数字的样式统一 */
.card-content h2 {
  margin: 0;
  font-size: 32px;
}

/* 固定每列宽度，防止自动调整 */
.data-cards .el-col {
  width: 25%;
}

/* 匹配状态卡片样式 */
.match-card {
  height: 300px;
}

.match-card .chart-container {
  height: 220px;
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
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 10px;
}

.status-label {
  font-weight: bold;
  color: #606266;
}

.status-value {
  font-size: 18px;
  color: #409EFF;
  font-weight: bold;
}

/* 添加卡片头部样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-actions {
  display: flex;
  gap: 10px;
}</style> 