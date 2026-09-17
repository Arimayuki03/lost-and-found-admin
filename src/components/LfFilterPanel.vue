<template>
  <div class="filter-section">
    <div class="filter-row">
      <div class="filter-group">
        <template v-if="sortOptions && sortOptions.length">
          <span class="filter-label">排序字段:</span>
          <el-select :model-value="sortBy" class="filter-item" @update:model-value="$emit('update:sortBy', $event)">
            <el-option v-for="opt in sortOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>

          <span class="filter-label">排序方式:</span>
          <el-select :model-value="sortOrder" class="filter-item" @update:model-value="$emit('update:sortOrder', $event)">
            <el-option label="升序" value="asc" />
            <el-option label="降序" value="desc" />
          </el-select>
        </template>
        <slot name="extra" />
      </div>

      <div class="search-group" v-if="searchPlaceholder">
        <el-input
          :model-value="search"
          :placeholder="searchPlaceholder"
          class="search-input"
          clearable
          @update:model-value="$emit('update:search', $event)"
          @clear="$emit('search')"
          @keyup.enter="$emit('search')"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="$emit('search')">搜索</el-button>
      </div>
    </div>

    <!-- 高级筛选折叠面板（传入 #advanced 插槽才显示） -->
    <el-collapse v-if="$slots.advanced" v-model="activeCollapse" class="filter-collapse">
      <el-collapse-item name="advancedFilter">
        <template #title>
          <div class="collapse-title">
            <el-icon><Filter /></el-icon>
            <span>高级筛选</span>
          </div>
        </template>
        <div class="advanced-filter-container">
          <slot name="advanced" />
          <div class="filter-actions">
            <el-button type="primary" @click="$emit('apply-filter')">应用筛选</el-button>
            <el-button @click="$emit('reset-filter')">重置筛选</el-button>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
/**
 * 筛选面板：排序字段/方式 + 搜索框 + 可选高级筛选折叠区
 * 替代原先 6 个表格页各自复制的 filter-section 结构
 */
import { ref } from 'vue';
import { Search, Filter } from '@element-plus/icons-vue';

defineProps({
  /** v-model:sortBy 当前排序字段 */
  sortBy: { type: String, default: '' },
  /** v-model:sortOrder 当前排序方式 asc/desc */
  sortOrder: { type: String, default: 'desc' },
  /** 排序字段选项 [{ label, value }]，为空则不渲染排序控件 */
  sortOptions: { type: Array, default: () => [] },
  /** v-model:search 搜索关键词 */
  search: { type: String, default: '' },
  /** 搜索框占位文本，为空则不渲染搜索控件 */
  searchPlaceholder: { type: String, default: '' },
});

defineEmits(['update:sortBy', 'update:sortOrder', 'update:search', 'search', 'apply-filter', 'reset-filter']);

const activeCollapse = ref([]);
</script>

<style scoped>
.filter-collapse :deep(.el-collapse-item__content) {
  max-height: 300px;
  overflow-y: auto;
}
</style>
