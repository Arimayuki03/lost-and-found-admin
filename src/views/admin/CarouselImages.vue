<template>
  <div class="admin-container">
    <div class="page-header">
      <div class="header-top">
        <div class="title-section">
          <h1 class="page-title">轮播图管理</h1>
          <div class="title-decoration"></div>
        </div>

        <div class="header-actions">
          <el-button type="primary" class="action-button" icon="Plus" @click="openAddDialog">
            添加轮播图
          </el-button>

          <el-button type="primary" icon="Refresh" @click="handleShowAllCarouselImages">
            刷新轮播图
          </el-button>
        </div>
      </div>

      <!-- 搜索和过滤区域 -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-group">
            <span class="filter-label">排序字段:</span>
            <el-select v-model="sortBy" class="filter-item" @change="handleSortChange">
              <el-option label="ID" value="id" />
              <el-option label="排序号" value="order" />
              <el-option label="创建时间" value="created_at" />
              <el-option label="更新时间" value="updated_at" />
            </el-select>

            <span class="filter-label">排序方式:</span>
            <el-select v-model="sortOrder" class="filter-item" @change="handleSortChange">
              <el-option label="升序" value="asc" />
              <el-option label="降序" value="desc" />
            </el-select>
          </div>

          <div class="search-group">
            <el-input v-model="searchQuery" placeholder="请输入轮播图描述关键词" class="search-input" clearable @clear="handleSearch"
              @keyup.enter="handleSearch">
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="scrollable-content">
      <div class="main-content">
        <div class="table-container">
          <!-- 轮播图列表 -->
          <el-table v-loading="loading" :data="carouselImages" style="width: 100%" border :header-cell-style="{
            background: '#f0f7ff',
            color: '#1e3a8a',
            fontWeight: '600',
            fontSize: '14px',
            padding: '12px 0',
            borderBottom: '2px solid #dbeafe'
          }" :row-class-name="tableRowClassName" @sort-change="handleTableSortChange">
            <el-table-column prop="id" label="ID" width="80" sortable="custom" />
            <el-table-column label="图片预览" width="200">
              <template #default="scope">
                <el-image :src="scope.row.image_url" style="width: 180px; height: 100px;" fit="contain"
                  :preview-src-list="[scope.row.image_url]" :initial-index="0" preview-teleported />
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
            <el-table-column prop="order" label="排序号" width="100" sortable="custom" />
            <el-table-column prop="created_at" label="创建时间" width="180" sortable="custom">
              <template #default="scope">
                {{ formatDate(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column prop="updated_at" label="更新时间" width="180" sortable="custom">
              <template #default="scope">
                {{ formatDate(scope.row.updated_at) || '无' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="scope">
                <div class="operation-buttons">
                  <el-button type="primary" size="small" @click="openEditDialog(scope.row)" class="operation-button">
                    编辑
                  </el-button>
                  <el-button type="danger" size="small" @click="confirmDelete(scope.row.id)" class="operation-button">
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

        
        </div>
      </div>
    </div>

    <!-- 底部分页 -->
    <div class="pagination-container">
      <span class="total-text">共 {{ total }} 条记录</span>

      <div class="pagination-controls">
        <el-select v-model="pageSize" class="page-size-select" @change="handleSizeChange">
          <el-option :value="10" label="10条/页" />
          <el-option :value="20" label="20条/页" />
          <el-option :value="30" label="30条/页" />
          <el-option :value="50" label="50条/页" />
        </el-select>

        <el-pagination background layout="prev, pager, next" :total="total" :current-page="currentPage"
          :page-size="pageSize" @current-change="handleCurrentChange" />

        <div class="go-to-page">
          跳转到
          <el-input v-model="gotoPage" class="go-page-input" @keyup.enter="handleGotoPage" />
          页
        </div>
      </div>
    </div>

    <!-- 添加/编辑轮播图对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEditing ? '编辑轮播图' : '添加轮播图'" width="600px" :close-on-click-modal="false"
      @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
        <el-form-item label="图片链接" prop="image_url">
          <el-input v-model="form.image_url" placeholder="请输入图片URL" />
        </el-form-item>

        <el-form-item label="图片上传">
          <el-upload class="upload-demo" action="/api/common/images/upload" :headers="uploadHeaders" :show-file-list="false"
            :on-success="handleUploadSuccess" :on-error="handleUploadError" :before-upload="beforeUpload">
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">只能上传jpg/png文件，且不超过5MB</div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="图片预览" v-if="form.image_url">
          <div class="image-preview">
            <el-image :src="form.image_url" fit="contain" style="width: 100%; max-height: 300px; border-radius: 4px;"
              :preview-src-list="[form.image_url]" />
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
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCarouselImages, addCarouselImage, updateCarouselImage, deleteCarouselImage } from '@/api/admin';
import { Search } from '@element-plus/icons-vue';
import { formatDate } from '@/utils/format';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();
// 上传接口已要求登录，el-upload 直传需要手动携带 token
const uploadHeaders = computed(() => ({ Authorization: `Bearer ${userStore.token}` }));

// 数据状态
const carouselImages = ref([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const sortBy = ref('created_at');
const sortOrder = ref('desc');
const searchQuery = ref('');
const gotoPage = ref('');

// 对话框状态
const dialogVisible = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const formRef = ref(null);

// 表单数据
const form = ref({
  id: null,
  image_url: '',
  description: '',
  order: 0
});

// 表单验证规则
const rules = {
  image_url: [
    { required: true, message: '请输入图片链接或上传图片', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL地址', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入轮播图描述', trigger: 'blur' },
    { max: 200, message: '描述不能超过200个字符', trigger: 'blur' }
  ],
  order: [
    { required: true, message: '请输入排序号', trigger: 'blur' }
  ]
};

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(total.value / pageSize.value);
});

// 表格行样式
const tableRowClassName = ({ row, rowIndex }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row';
};

// 获取轮播图列表
const fetchCarouselImages = async () => {
  loading.value = true;
  try {
    const response = await getCarouselImages(
      currentPage.value,
      pageSize.value,
      searchQuery.value,
      sortBy.value,
      sortOrder.value
    );

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

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchCarouselImages();
};

// 处理排序变化
const handleSortChange = () => {
  currentPage.value = 1;
  fetchCarouselImages();
};

// 处理表格排序变化
const handleTableSortChange = (column) => {
  if (column.prop) {
    sortBy.value = column.prop;
    sortOrder.value = column.order === 'descending' ? 'desc' : 'asc';
    fetchCarouselImages();
  }
};

// 分页相关处理函数
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchCarouselImages();
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  fetchCarouselImages();
};

// 跳转页码处理
const handleGotoPage = () => {
  if (!gotoPage.value) return;

  const page = parseInt(gotoPage.value);
  if (page && page > 0 && page <= totalPages.value) {
    currentPage.value = page;
    fetchCarouselImages();
  } else {
    ElMessage.warning(`页码应在1到${totalPages.value}之间`);
  }
  gotoPage.value = '';
};

// 打开添加对话框
const openAddDialog = () => {
  form.value = {
    id: null,
    image_url: '',
    description: '',
    order: 0
  };
  isEditing.value = false;
  dialogVisible.value = true;
};

// 打开编辑对话框
const openEditDialog = (row) => {
  form.value = {
    id: row.id,
    image_url: row.image_url,
    description: row.description,
    order: row.order
  };
  isEditing.value = true;
  dialogVisible.value = true;
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      if (isEditing.value) {
        // 编辑轮播图
        await updateCarouselImage(form.value.id, {
          image_url: form.value.image_url,
          description: form.value.description,
          order: form.value.order
        });
        ElMessage.success('轮播图更新成功');
      } else {
        // 添加轮播图
        await addCarouselImage({
          image_url: form.value.image_url,
          description: form.value.description,
          order: form.value.order
        });
        ElMessage.success('轮播图添加成功');
      }

      dialogVisible.value = false;
      fetchCarouselImages(); // 刷新列表
    } catch (error) {
      ElMessage.error(isEditing.value ? '更新轮播图失败' : '添加轮播图失败');
    } finally {
      submitting.value = false;
    }
  });
};

// 处理删除
const handleDelete = async (id) => {
  try {
    await deleteCarouselImage(id);
    ElMessage({
      type: 'success',
      message: '删除成功',
      duration: 2000
    });

    // 如果当前页没有数据了，跳转到上一页
    if (carouselImages.value.length === 1 && currentPage.value > 1) {
      currentPage.value--;
    }

    fetchCarouselImages();
  } catch (error) {
    ElMessage.error('删除失败');
  }
};

// 查看所有轮播图（重置所有筛选）
const handleShowAllCarouselImages = () => {
  searchQuery.value = '';
  sortBy.value = 'order';
  sortOrder.value = 'asc';
  currentPage.value = 1;
  fetchCarouselImages();

  // 添加操作成功的提示
  ElMessage({
    type: 'success',
    message: '已显示全部轮播图',
    duration: 2000
  });
};

// 确认删除
const confirmDelete = (id) => {
  ElMessageBox.confirm(
    '确定要删除这张轮播图吗？此操作不可恢复',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      draggable: true,
    }
  )
    .then(() => {
      handleDelete(id);
    })
    .catch(() => {
      // 用户取消删除操作
    });
};

// 上传相关方法
const handleUploadSuccess = (response) => {
  if (response && response.file_url) {
    form.value.image_url = response.file_url;
    ElMessage.success('图片上传成功');
  }
};

const handleUploadError = () => {
  ElMessage.error('图片上传失败');
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

// 页面加载时获取数据
onMounted(() => {
  fetchCarouselImages();
});
</script>

<style scoped>
/* 使用公共样式，只添加特定于此组件的样式 */

/* 对话框样式优化 */
:deep(.el-dialog__header) {
  border-bottom: 1px solid #f0f0f0;
  padding: 15px 20px;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #f0f0f0;
  padding: 15px 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 操作按钮样式 */
.operation-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.operation-button {
  padding: 4px 12px !important;
  font-size: 12px !important;
}

/* 表格行高设置 */
:deep(.el-table__row) {
  height: 100px;
  /* 轮播图需要更高的行高 */
}

/* 单元格垂直居中 */
:deep(.el-table__cell) {
  vertical-align: middle;
}

/* 添加空结果提示样式 */
.empty-result {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  background-color: #fff;
  border-radius: 4px;
  margin-top: 20px;
}

/* 图片预览样式 */
.image-preview {
  margin-top: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
  background-color: #f8f9fa;
}

/* 上传组件样式 */
.upload-demo {
  margin-bottom: 10px;
}

.el-upload__tip {
  line-height: 1.2;
  margin-top: 5px;
  color: #909399;
}
</style>
