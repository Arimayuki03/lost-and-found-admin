<template>
  <div class="lf-page">
    <LfPageHeader title="轮播图管理">
      <template #actions>
        <el-button type="primary" icon="Plus" @click="openAddDialog">添加轮播图</el-button>
        <el-button type="primary" icon="Refresh" @click="handleShowAll">刷新轮播图</el-button>
      </template>
    </LfPageHeader>

    <LfFilterPanel
      v-model:sort-by="sortBy"
      v-model:sort-order="sortOrder"
      v-model:search="searchQuery"
      :sort-options="sortOptions"
      search-placeholder="请输入轮播图描述关键词"
      @search="handleSearch"
    />

    <LfTable
      v-model:page="currentPage"
      v-model:page-size="pageSize"
      :data="carouselImages"
      :loading="loading"
      :total="total"
      :columns="columns"
      :row-height="100"
      empty-text="暂无轮播图"
      @sort-change="handleTableSortChange"
    >
      <template #image="{ row }">
        <el-image
          :src="row.image_url"
          style="width: 180px; height: 100px;"
          fit="contain"
          :preview-src-list="[row.image_url]"
          :initial-index="0"
          preview-teleported
        />
      </template>
      <template #createdAt="{ row }">{{ formatDate(row.created_at) }}</template>
      <template #updatedAt="{ row }">{{ formatDate(row.updated_at) || '无' }}</template>
      <template #actions="{ row }">
        <div class="operation-buttons">
          <el-button type="primary" size="small" class="operation-button" @click="openEditDialog(row)">编辑</el-button>
          <el-button type="danger" size="small" class="operation-button" @click="confirmDelete(row.id)">删除</el-button>
        </div>
      </template>
    </LfTable>

    <!-- 添加/编辑轮播图对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEditing ? '编辑轮播图' : '添加轮播图'" width="600px" :close-on-click-modal="false" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
        <el-form-item label="图片链接" prop="image_url">
          <el-input v-model="form.image_url" placeholder="请输入图片URL" />
        </el-form-item>
        <el-form-item label="图片上传">
          <el-upload
            class="upload-demo"
            :action="UPLOAD_URL"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="upload-tip">只能上传jpg/png文件，且不超过5MB</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="图片预览" v-if="form.image_url">
          <div class="image-preview">
            <el-image :src="form.image_url" fit="contain" style="width: 100%; max-height: 300px; border-radius: 4px;" :preview-src-list="[form.image_url]" />
          </div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入轮播图描述" />
        </el-form-item>
        <el-form-item label="排序号" prop="order">
          <el-input-number v-model="form.order" :min="0" controls-position="right" placeholder="数字越小排序越靠前" />
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
import { ref, computed, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCarouselImages, addCarouselImage, updateCarouselImage, deleteCarouselImage } from '@/api/admin';
import { UPLOAD_URL } from '@/api';
import { formatDate } from '@/utils/format';
import { useUserStore } from '@/store/modules/user';
import LfPageHeader from '@/components/LfPageHeader.vue';
import LfFilterPanel from '@/components/LfFilterPanel.vue';
import LfTable from '@/components/LfTable.vue';

const userStore = useUserStore();
// 上传接口已要求登录，el-upload 直传需要手动携带 token
const uploadHeaders = computed(() => ({ Authorization: `Bearer ${userStore.token}` }));

const carouselImages = ref([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const sortBy = ref('created_at');
const sortOrder = ref('desc');
const searchQuery = ref('');

const sortOptions = [
  { label: 'ID', value: 'id' },
  { label: '排序号', value: 'order' },
  { label: '创建时间', value: 'created_at' },
  { label: '更新时间', value: 'updated_at' },
];

const columns = [
  { prop: 'id', label: 'ID', width: 80, sortable: 'custom' },
  { label: '图片预览', width: 200, slot: 'image' },
  { prop: 'description', label: '描述', minWidth: 200, showOverflowTooltip: true },
  { prop: 'order', label: '排序号', width: 100, sortable: 'custom' },
  { prop: 'created_at', label: '创建时间', width: 180, sortable: 'custom', slot: 'createdAt' },
  { prop: 'updated_at', label: '更新时间', width: 180, sortable: 'custom', slot: 'updatedAt' },
  { label: '操作', width: 220, fixed: 'right', slot: 'actions' },
];

const dialogVisible = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const formRef = ref(null);
const form = ref({ id: null, image_url: '', description: '', order: 0 });

const rules = {
  image_url: [
    { required: true, message: '请输入图片链接或上传图片', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL地址', trigger: 'blur' },
  ],
  description: [
    { required: true, message: '请输入轮播图描述', trigger: 'blur' },
    { max: 200, message: '描述不能超过200个字符', trigger: 'blur' },
  ],
  order: [{ required: true, message: '请输入排序号', trigger: 'blur' }],
};

const fetchCarouselImages = async () => {
  loading.value = true;
  try {
    const response = await getCarouselImages(currentPage.value, pageSize.value, searchQuery.value, sortBy.value, sortOrder.value);
    carouselImages.value = response.items || [];
    total.value = response.total || 0;
  } catch (error) {
    ElMessage.error('获取轮播图列表失败');
    carouselImages.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  if (currentPage.value === 1) {
    fetchCarouselImages(); // 已在第 1 页，页码赋值不会触发 watch，这里补发
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
  fetchCarouselImages();
});

// 排序变化：回到第 1 页；已在第 1 页时页码赋值不触发分页 watch，这里补发唯一请求
watch([sortBy, sortOrder], () => {
  if (currentPage.value === 1) {
    fetchCarouselImages();
  } else {
    currentPage.value = 1; // 分页 watch 会发起唯一请求
  }
});

const handleTableSortChange = (column) => {
  if (!column.prop) return;
  const nextSortBy = column.prop;
  const nextSortOrder = column.order === 'descending' ? 'desc' : 'asc';
  if (nextSortBy === sortBy.value && nextSortOrder === sortOrder.value) {
    fetchCarouselImages(); // 值无变化时 watch 不触发，显式补发（如取消排序后再次点击）
    return;
  }
  sortBy.value = nextSortBy;
  sortOrder.value = nextSortOrder; // 由排序 watch 统一触发请求
};

const openAddDialog = () => {
  form.value = { id: null, image_url: '', description: '', order: 0 };
  isEditing.value = false;
  dialogVisible.value = true;
};

const openEditDialog = (row) => {
  form.value = { id: row.id, image_url: row.image_url, description: row.description, order: row.order };
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
        await updateCarouselImage(form.value.id, { image_url: form.value.image_url, description: form.value.description, order: form.value.order });
        ElMessage.success('轮播图更新成功');
      } else {
        await addCarouselImage({ image_url: form.value.image_url, description: form.value.description, order: form.value.order });
        ElMessage.success('轮播图添加成功');
      }
      dialogVisible.value = false;
      fetchCarouselImages();
    } catch (error) {
      ElMessage.error(isEditing.value ? '更新轮播图失败' : '添加轮播图失败');
    } finally {
      submitting.value = false;
    }
  });
};

const handleDelete = async (id) => {
  try {
    await deleteCarouselImage(id);
    ElMessage({ type: 'success', message: '删除成功', duration: 2000 });
    if (carouselImages.value.length === 1 && currentPage.value > 1) {
      currentPage.value--; // 分页 watch 会发起唯一请求
    } else {
      fetchCarouselImages(); // 页码不变时 watch 不触发，显式补发
    }
  } catch (error) {
    ElMessage.error('删除失败');
  }
};

const confirmDelete = (id) => {
  ElMessageBox.confirm('确定要删除这张轮播图吗？此操作不可恢复', '删除确认', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning', draggable: true,
  }).then(() => handleDelete(id)).catch(() => {});
};

const handleShowAll = () => {
  const sortChanged = sortBy.value !== 'order' || sortOrder.value !== 'asc';
  searchQuery.value = '';
  sortBy.value = 'order';
  sortOrder.value = 'asc';
  if (currentPage.value === 1 && !sortChanged) {
    fetchCarouselImages(); // 状态无变化时两个 watch 均不触发，这里补发
  } else if (currentPage.value !== 1 && !sortChanged) {
    currentPage.value = 1; // 分页 watch 会发起唯一请求
  }
  // 页码>1 且排序有变化：排序 watch 重置页码后由分页 watch 发起唯一请求
  ElMessage({ type: 'success', message: '已显示全部轮播图', duration: 2000 });
};

// 上传相关方法
const handleUploadSuccess = (response) => {
  if (response && response.file_url) {
    form.value.image_url = response.file_url;
    ElMessage.success('图片上传成功');
  }
};

const handleUploadError = () => {
  // el-upload 直传不经过 axios 拦截器，登录态失效（401）时只会走到这里，提示中补充引导
  ElMessage.error('图片上传失败，请确认登录状态后重试');
};

const beforeUpload = (file) => {
  const isJPG = file.type === 'image/jpeg';
  const isPNG = file.type === 'image/png';
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isJPG && !isPNG) {
    ElMessage.error('上传图片只能是 JPG 或 PNG 格式!');
    return false;
  }
  if (!isLt5M) {
    ElMessage.error('上传图片大小不能超过 5MB!');
    return false;
  }
  return true;
};

onMounted(() => {
  fetchCarouselImages();
});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.image-preview {
  margin-top: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
  background-color: #f8f9fa;
}

.upload-tip {
  line-height: 1.2;
  margin-top: 5px;
  color: var(--lf-text-secondary);
}
</style>
