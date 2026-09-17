<template>
  <div class="lf-page">
    <LfPageHeader title="公告管理">
      <template #actions>
        <el-button type="primary" icon="Plus" @click="openAddDialog">添加公告</el-button>
        <el-button type="primary" icon="Refresh" @click="handleShowAll">刷新公告</el-button>
      </template>
    </LfPageHeader>

    <LfFilterPanel
      v-model:sort-by="sortBy"
      v-model:sort-order="sortOrder"
      v-model:search="searchQuery"
      :sort-options="sortOptions"
      search-placeholder="搜索公告标题或内容"
      @search="handleSearch"
    />

    <LfTable
      v-model:page="currentPage"
      v-model:page-size="pageSize"
      :data="announcements"
      :loading="loading"
      :total="total"
      :columns="columns"
      empty-text="暂无公告"
      @sort-change="handleTableSortChange"
    >
      <template #createdAt="{ row }">{{ formatDate(row.created_at) }}</template>
      <template #updatedAt="{ row }">{{ formatDate(row.updated_at) || '无' }}</template>
      <template #actions="{ row }">
        <div class="operation-buttons">
          <el-button type="primary" size="small" class="operation-button" @click="openEditDialog(row)">编辑</el-button>
          <el-button type="danger" size="small" class="operation-button" @click="confirmDelete(row.id)">删除</el-button>
        </div>
      </template>
    </LfTable>

    <!-- 添加/编辑公告对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEditing ? '编辑公告' : '添加公告'" width="600px" :close-on-click-modal="false" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="请输入公告内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/api/admin';
import { formatDate } from '@/utils/format';
import LfPageHeader from '@/components/LfPageHeader.vue';
import LfFilterPanel from '@/components/LfFilterPanel.vue';
import LfTable from '@/components/LfTable.vue';

const announcements = ref([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const sortBy = ref('created_at');
const sortOrder = ref('desc');
const searchQuery = ref('');

const sortOptions = [
  { label: 'ID', value: 'id' },
  { label: '标题', value: 'title' },
  { label: '创建时间', value: 'created_at' },
  { label: '更新时间', value: 'updated_at' },
];

const columns = [
  { prop: 'id', label: 'ID', width: 80, sortable: 'custom' },
  { prop: 'title', label: '标题', minWidth: 200, sortable: 'custom', showOverflowTooltip: true },
  { prop: 'content', label: '内容', minWidth: 300, showOverflowTooltip: true },
  { prop: 'created_at', label: '创建时间', width: 180, sortable: 'custom', slot: 'createdAt' },
  { prop: 'updated_at', label: '更新时间', width: 180, sortable: 'custom', slot: 'updatedAt' },
  { label: '操作', width: 160, fixed: 'right', slot: 'actions' },
];

const dialogVisible = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const formRef = ref(null);
const form = ref({ id: null, title: '', content: '' });

const rules = {
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在2到100个字符之间', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入公告内容', trigger: 'blur' },
    { min: 5, max: 2000, message: '内容长度在5到2000个字符之间', trigger: 'blur' },
  ],
};

const fetchAnnouncements = async () => {
  loading.value = true;
  try {
    const response = await getAnnouncements(currentPage.value, pageSize.value, searchQuery.value, sortBy.value, sortOrder.value);
    announcements.value = response.items || [];
    total.value = response.total || 0;
  } catch (error) {
    console.error('获取公告列表失败:', error);
    ElMessage.error('获取公告列表失败');
    announcements.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  if (currentPage.value === 1) {
    fetchAnnouncements(); // 已在第 1 页，页码赋值不会触发 watch，这里补发
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
  fetchAnnouncements();
});

// 排序变化：回到第 1 页；已在第 1 页时页码赋值不触发分页 watch，这里补发唯一请求
watch([sortBy, sortOrder], () => {
  if (currentPage.value === 1) {
    fetchAnnouncements();
  } else {
    currentPage.value = 1; // 分页 watch 会发起唯一请求
  }
});

const handleTableSortChange = (column) => {
  if (!column.prop) return;
  const nextSortBy = column.prop;
  const nextSortOrder = column.order === 'descending' ? 'desc' : 'asc';
  if (nextSortBy === sortBy.value && nextSortOrder === sortOrder.value) {
    fetchAnnouncements(); // 值无变化时 watch 不触发，显式补发（如取消排序后再次点击）
    return;
  }
  sortBy.value = nextSortBy;
  sortOrder.value = nextSortOrder; // 由排序 watch 统一触发请求
};

const openAddDialog = () => {
  form.value = { id: null, title: '', content: '' };
  isEditing.value = false;
  dialogVisible.value = true;
};

const openEditDialog = (row) => {
  form.value = { id: row.id, title: row.title, content: row.content };
  isEditing.value = true;
  dialogVisible.value = true;
};

const resetForm = () => {
  if (formRef.value) formRef.value.resetFields();
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (isEditing.value) {
        await updateAnnouncement(form.value.id, { title: form.value.title, content: form.value.content });
        ElMessage.success('公告更新成功');
      } else {
        await addAnnouncement({ title: form.value.title, content: form.value.content });
        ElMessage.success('公告添加成功');
      }
      dialogVisible.value = false;
      fetchAnnouncements();
    } catch (error) {
      console.error('操作失败: 请检查网络连接或联系管理员');
      ElMessage.error(isEditing.value ? '更新公告失败' : '添加公告失败');
    } finally {
      submitting.value = false;
    }
  });
};

const handleDelete = async (id) => {
  try {
    await deleteAnnouncement(id);
    ElMessage({ type: 'success', message: '删除成功', duration: 2000 });
    if (announcements.value.length === 1 && currentPage.value > 1) {
      currentPage.value--; // 分页 watch 会发起唯一请求
    } else {
      fetchAnnouncements(); // 页码不变时 watch 不触发，显式补发
    }
  } catch (error) {
    console.error('删除公告失败: 请检查网络连接或联系管理员');
    ElMessage.error('删除失败');
  }
};

const confirmDelete = (id) => {
  ElMessageBox.confirm('确定要删除这条公告吗？此操作不可恢复', '删除确认', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning', draggable: true,
  }).then(() => handleDelete(id)).catch(() => {});
};

const handleShowAll = () => {
  const sortChanged = sortBy.value !== 'created_at' || sortOrder.value !== 'desc';
  searchQuery.value = '';
  sortBy.value = 'created_at';
  sortOrder.value = 'desc';
  if (currentPage.value === 1 && !sortChanged) {
    fetchAnnouncements(); // 状态无变化时两个 watch 均不触发，这里补发
  } else if (currentPage.value !== 1 && !sortChanged) {
    currentPage.value = 1; // 分页 watch 会发起唯一请求
  }
  // 页码>1 且排序有变化：排序 watch 重置页码后由分页 watch 发起唯一请求
  ElMessage({ type: 'success', message: '已显示全部公告', duration: 2000 });
};

onMounted(() => {
  fetchAnnouncements();
});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
