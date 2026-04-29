<template>
  <div class="projects-view">
    <div class="page-header">
      <h2>📁 项目管理</h2>
      <div class="header-actions">
        <el-input v-model="searchText" placeholder="搜索项目..." prefix-icon="Search" clearable style="width: 200px;" />
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 120px;">
          <el-option label="未开始" :value="0" />
          <el-option label="进行中" :value="1" />
          <el-option label="已完成" :value="2" />
        </el-select>
        <el-button type="primary" @click="openCreate">+ 新建项目</el-button>
      </div>
    </div>

    <!-- 项目列表 -->
    <div class="project-grid">
      <div v-for="project in filteredProjects" :key="project.id" class="project-card" @click="openEdit(project)">
        <div class="card-top">
          <span class="color-bar" :style="{ background: project.color }"></span>
          <div class="card-title">
            <h3>{{ project.name }}</h3>
            <el-tag :type="statusType(project.status)" size="small">{{ statusText(project.status) }}</el-tag>
          </div>
        </div>
        <p class="card-detail">{{ project.detail || '暂无描述' }}</p>
        <div class="card-meta">
          <span>📅 {{ project.start_date }}</span>
          <span v-if="project.end_date">→ {{ project.end_date }}</span>
          <span class="category-tag" v-if="project.category_name">
            {{ project.category_name }}
          </span>
        </div>
        <div class="card-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: project.progress + '%', background: project.color }"></div>
          </div>
          <span class="progress-text">{{ project.progress }}%</span>
        </div>
        <div class="card-priority">
          <span v-for="i in project.priority" :key="i">⭐</span>
        </div>
      </div>
    </div>

    <el-empty v-if="!filteredProjects.length" description="暂无项目" />

    <!-- 项目对话框 -->
    <el-dialog v-model="showDialog" :title="editingProject ? '编辑项目' : '新建项目'" width="500px" :close-on-click-modal="false">
      <el-form :model="form" label-width="80px">
        <el-form-item label="项目名称" required>
          <el-input v-model="form.name" placeholder="输入项目名称" />
        </el-form-item>
        <el-form-item label="项目细节">
          <el-input v-model="form.detail" type="textarea" :rows="3" placeholder="输入项目详细描述" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category_id" placeholder="选择分类" clearable style="width: 100%;">
            <el-option v-for="cat in projectStore.categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" required>
          <el-date-picker v-model="form.start_date" type="date" placeholder="选择开始日期" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="form.end_date" type="date" placeholder="选择结束日期" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="完成进度">
          <el-slider v-model="form.progress" :min="0" :max="100" show-input />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="0">未开始</el-radio>
            <el-radio :value="1">进行中</el-radio>
            <el-radio :value="2">已完成</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="优先级">
          <el-rate v-model="form.priority" :max="3" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="form.color" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button v-if="editingProject" type="danger" @click="handleDelete">删除</el-button>
        <el-button type="primary" @click="handleSave" :disabled="!form.name || !form.start_date">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useProjectStore } from '../stores/project'
import { ElMessage, ElMessageBox } from 'element-plus'

const projectStore = useProjectStore()
const searchText = ref('')
const filterStatus = ref('')
const showDialog = ref(false)
const editingProject = ref(null)

const form = ref({
  name: '', detail: '', category_id: null,
  start_date: '', end_date: '', progress: 0,
  status: 0, priority: 0, color: '#4CAF50'
})

const filteredProjects = computed(() => {
  let list = projectStore.projects
  if (filterStatus.value !== '') {
    list = list.filter(p => p.status === filterStatus.value)
  }
  if (searchText.value) {
    const s = searchText.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(s) || p.detail.toLowerCase().includes(s))
  }
  return list
})

function statusType(status) {
  return ['info', 'warning', 'success'][status] || 'info'
}

function statusText(status) {
  return ['未开始', '进行中', '已完成'][status] || '未知'
}

function openCreate() {
  editingProject.value = null
  form.value = { name: '', detail: '', category_id: null, start_date: '', end_date: '', progress: 0, status: 0, priority: 0, color: '#4CAF50' }
  showDialog.value = true
}

function openEdit(project) {
  editingProject.value = project
  form.value = { ...project }
  showDialog.value = true
}

async function handleSave() {
  try {
    if (editingProject.value) {
      await projectStore.updateProject(editingProject.value.id, form.value)
      ElMessage.success('项目已更新')
    } else {
      await projectStore.createProject(form.value)
      ElMessage.success('项目已创建')
    }
    showDialog.value = false
    loadData()
  } catch (err) {
    ElMessage.error(err.error || '保存失败')
  }
}

async function handleDelete() {
  try {
    await ElMessageBox.confirm('确定要删除这个项目吗？', '确认删除', { type: 'warning' })
    await projectStore.deleteProject(editingProject.value.id)
    ElMessage.success('项目已删除')
    showDialog.value = false
    loadData()
  } catch {}
}

async function loadData() {
  try {
    await projectStore.fetchCategories()
    await projectStore.fetchProjects()
  } catch (err) {
    console.error('加载项目失败:', err)
  }
}

onMounted(loadData)
watch([searchText, filterStatus], () => {})
</script>

<style scoped lang="scss">
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.project-card {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  .card-top {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;

    .color-bar {
      width: 4px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .card-title {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;

      h3 {
        font-size: 15px;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .card-detail {
    font-size: 13px;
    color: #909399;
    margin-bottom: 10px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-meta {
    display: flex;
    gap: 8px;
    font-size: 12px;
    color: #909399;
    margin-bottom: 10px;
    flex-wrap: wrap;

    .category-tag {
      background: #f0f2f5;
      padding: 1px 8px;
      border-radius: 10px;
    }
  }

  .card-progress {
    display: flex;
    align-items: center;
    gap: 10px;

    .progress-bar {
      flex: 1;
    }

    .progress-text {
      font-size: 13px;
      font-weight: 600;
      color: #606266;
      min-width: 40px;
      text-align: right;
    }
  }

  .card-priority {
    margin-top: 6px;
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .project-grid {
    grid-template-columns: 1fr;
  }
}
</style>
