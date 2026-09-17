<template>
  <div ref="elRef" class="lf-chart" :style="{ height }"></div>
</template>

<script setup>
/**
 * ECharts 托管组件：init（统一主题）/ resize（ResizeObserver）/ dispose 全生命周期
 * 页面只负责算 option 并传入；option 变化自动重绘。
 */
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import { ensureTheme } from '@/utils/chartTheme';

const props = defineProps({
  option: { type: Object, default: () => ({}) },
  height: { type: String, default: '320px' },
});

const elRef = ref(null);
let chart = null;
let observer = null;

onMounted(async () => {
  ensureTheme();
  await nextTick();
  if (!elRef.value) return;
  chart = echarts.init(elRef.value, 'lf');
  chart.setOption(props.option, true);
  observer = new ResizeObserver(() => chart && chart.resize());
  observer.observe(elRef.value);
});

watch(
  () => props.option,
  (opt) => { if (chart) chart.setOption(opt, true); },
  { deep: true }
);

onBeforeUnmount(() => {
  if (observer) { observer.disconnect(); observer = null; }
  if (chart) { chart.dispose(); chart = null; }
});
</script>

<style scoped>
.lf-chart {
  width: 100%;
}
</style>
