<template>
  <div class="page-header">
    <div class="header-top">
      <div class="title-section">
        <h1 class="page-title">{{ title }}</h1>
        <div class="title-decoration"></div>
      </div>
      <div class="header-actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 页面标题区：标题 + 装饰条 + 右侧操作按钮插槽
 * 替代原先 6 个表格页各自复制的 title-section 结构
 */
defineProps({
  title: { type: String, required: true },
});
</script>

<style scoped>
.page-header {
  flex-shrink: 0;
  margin-bottom: 20px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title-section {
  position: relative;
  padding-bottom: 10px;
  margin-bottom: 5px;
}

.page-title {
  font-size: 26px;
  font-weight: 600;
  color: var(--el-color-primary);
  margin: 0;
  padding: 0;
  letter-spacing: 1px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.title-decoration {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, var(--el-color-primary) 0%, var(--el-color-primary-light-5) 100%);
  border-radius: 2px;
}

.header-actions {
  display: flex;
  gap: 10px;
}
</style>
