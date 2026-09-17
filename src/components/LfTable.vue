<template>
  <div class="lf-table-card">
    <div class="lf-table-body">
      <el-table
        v-loading="loading"
        :data="data"
        height="100%"
        border
        style="width: 100%"
        :header-cell-style="headerCellStyle"
        :row-class-name="rowClassName"
        @sort-change="(col) => $emit('sort-change', col)"
      >
        <el-table-column
          v-for="col in columns"
          :key="col.prop || col.label"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :align="col.align || 'left'"
          :header-align="col.headerAlign || col.align || 'left'"
          :fixed="col.fixed"
          :sortable="col.sortable"
          :show-overflow-tooltip="col.showOverflowTooltip"
        >
          <template #default="scope">
            <slot v-if="col.slot" :name="col.slot" :row="scope.row" :index="scope.$index" />
            <span v-else-if="col.formatter">{{ col.formatter(scope.row) }}</span>
            <span v-else>{{ scope.row[col.prop] }}</span>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="emptyText" :image-size="90" />
        </template>
      </el-table>
    </div>

    <div class="lf-pagination">
      <span class="total-text">共 {{ total }} 条记录</span>
      <div class="pagination-controls">
        <el-select :model-value="pageSize" class="page-size-select" @change="(s) => $emit('update:pageSize', s)">
          <el-option v-for="s in pageSizes" :key="s" :value="s" :label="`${s}条/页`" />
        </el-select>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :current-page="page"
          :page-size="pageSize"
          @current-change="(p) => $emit('update:page', p)"
        />
        <div class="go-to-page">
          跳转到
          <el-input v-model="gotoPage" class="go-page-input" @keyup.enter="handleGotoPage" />
          页
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 表格页统一封装：el-table（表头样式/斑马纹/空态内置）+ 底部条式分页（含跳页）
 *
 * 用法：
 *   <LfTable v-model:page="currentPage" v-model:page-size="pageSize"
 *            :data="rows" :loading="loading" :total="total" :columns="columns"
 *            @sort-change="onSortChange">
 *     <template #status="{ row }">...</template>
 *   </LfTable>
 * columns 项：{ prop, label, width, minWidth, align, fixed, sortable, showOverflowTooltip,
 *              formatter(row), slot: '插槽名' }
 */
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  /** 列配置，见组件注释 */
  columns: { type: Array, required: true },
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  pageSizes: { type: Array, default: () => [10, 20, 30, 50] },
  emptyText: { type: String, default: '暂无数据' },
  /** 行高（px），带图片的表格可调大；默认自适应 */
  rowHeight: { type: Number, default: 0 },
});

const emit = defineEmits(['update:page', 'update:pageSize', 'sort-change']);

// 表头样式统一收敛于此（原 6 个页面各复制一份内联对象）
const headerCellStyle = {
  background: 'var(--lf-header-bg)',
  color: 'var(--el-color-primary)',
  fontWeight: '600',
  fontSize: '14px',
  padding: '12px 0',
  borderBottom: '2px solid var(--lf-border-color)',
};

const rowClassName = ({ rowIndex }) => (rowIndex % 2 === 0 ? 'even-row' : 'odd-row');

const gotoPage = ref('');
const handleGotoPage = () => {
  if (!gotoPage.value) return;
  const page = parseInt(gotoPage.value, 10);
  const max = Math.max(1, Math.ceil(props.total / props.pageSize));
  if (!isNaN(page) && page >= 1 && page <= max) {
    emit('update:page', page);
  } else {
    ElMessage.warning(`页码应在 1 到 ${max} 之间`);
  }
  gotoPage.value = '';
};

// 每页条数变化时回到第一页
watch(() => props.pageSize, () => { emit('update:page', 1); });
</script>

<style scoped>
.lf-table-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--lf-bg-card);
  border-radius: var(--lf-radius-card);
  box-shadow: var(--lf-shadow-card);
  overflow: hidden;
}

.lf-table-body {
  flex: 1;
  min-height: 0;
}

.lf-pagination {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--lf-border-color-light);
  padding: 10px 16px;
  background-color: var(--lf-bg-card);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.03);
}

.lf-pagination .pagination-controls {
  display: flex;
  align-items: center;
}

/* 行高可配置（图片列需要更高行） */
.lf-table-body :deep(.el-table__row) {
  height: v-bind(rowHeight ? rowHeight + 'px' : 'auto');
}

.lf-table-body :deep(.el-table__cell) {
  vertical-align: middle;
}
</style>
