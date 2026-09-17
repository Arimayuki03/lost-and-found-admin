/**
 * ECharts 统一主题与图表配置工厂（见 前端UI优化方案.md 4.1.3）
 *
 * 颜色与 styles/variables.css 的主色保持一致（ECharts 无法读 CSS 变量，此处为唯一同步点）。
 * 页面只调用工厂函数拿 option 传给 LfChart，不再手写 init/resize/dispose。
 */
import * as echarts from 'echarts';

/** 主题色（与 --el-color-primary 同步） */
export const CHART_COLORS = {
  primary: '#1e40af',
  lost: '#4068d8',     // 失物系列色
  found: '#34a065',    // 拾物系列色
  danger: '#f56c6c',
  warning: '#e6a23c',
  success: '#67c23a',
  pie: ['#1e40af', '#4a68c6', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#9a6cff', '#36cfc9', '#ffc53d', '#ff7a45'],
};

/** 注册全局主题（幂等），LfChart 内部调用 */
let themeRegistered = false;
export function ensureTheme() {
  if (themeRegistered) return;
  themeRegistered = true;
  echarts.registerTheme('lf', {
    color: CHART_COLORS.pie,
    textStyle: { fontFamily: "'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif" },
    tooltip: {
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e5e7eb',
      textStyle: { color: '#1f2329', fontSize: 12 },
      extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-radius: 6px;',
    },
  });
}

/** 分类占比环形图（失物/拾物分类统计共用） */
export function categoryPieOption(data) {
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center', data: data.map((i) => i.name) },
    series: [
      {
        name: '分类统计',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: '12', fontWeight: 'bold' } },
        labelLine: { show: false },
        data,
      },
    ],
  };
}

/** 时间趋势折线图（失物/拾物月度趋势共用） */
export function trendLineOption(data, { name = '数量', color = CHART_COLORS.primary } = {}) {
  const xAxisData = data.map((item) => item.month || item.date || '');
  const seriesData = data.map((item) => item.count);
  const rgb = hexToRgb(color);
  return {
    tooltip: { trigger: 'axis', formatter: (params) => `${params[0].name}: ${params[0].value}件` },
    grid: { top: '40px', left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: xAxisData, axisLabel: { rotate: 45 } },
    yAxis: { type: 'value', name: '数量', minInterval: 1 },
    series: [
      {
        name,
        type: 'line',
        data: seriesData,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `rgba(${rgb}, 0.5)` },
            { offset: 1, color: `rgba(${rgb}, 0.1)` },
          ]),
        },
        itemStyle: { color },
        lineStyle: { width: 3 },
        symbol: 'circle',
        symbolSize: 8,
        smooth: true,
      },
    ],
  };
}

/** 地点排行横向柱状图（失物/拾物地点统计共用） */
export function locationBarOption(data, { color = CHART_COLORS.primary } = {}) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const locations = sorted.map((i) => i.location);
  const counts = sorted.map((i) => i.count);
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: locations,
      axisLabel: {
        interval: 0,
        width: 110,
        overflow: 'truncate',
        formatter: (value) => (value.length > 15 ? value.substring(0, 12) + '...' : value),
      },
    },
    series: [{ name: '数量', type: 'bar', data: counts, itemStyle: { color } }],
  };
}

/** 匹配成功率仪表盘 */
export function gaugeOption(value) {
  return {
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
              [0.3, CHART_COLORS.danger],
              [0.7, CHART_COLORS.warning],
              [1, CHART_COLORS.success],
            ],
          },
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '12%',
          width: 20,
          offsetCenter: [0, '-60%'],
          itemStyle: { color: 'inherit' },
        },
        axisTick: { length: 12, lineStyle: { color: 'inherit', width: 2 } },
        splitLine: { length: 20, lineStyle: { color: 'inherit', width: 5 } },
        axisLabel: {
          color: '#464646',
          fontSize: 16,
          distance: -80,
          formatter: (v) => (v === 0 || v === 100 ? v + '%' : ''),
        },
        title: { show: false },
        detail: {
          fontSize: 36,
          offsetCenter: [0, '0%'],
          valueAnimation: true,
          formatter: (v) => Math.round(v) + '%',
          color: CHART_COLORS.primary,
        },
        data: [{ value, name: '' }],
      },
    ],
  };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}
