<template>
  <div class="daily-view">
    <div class="page-header">
      <h2>📝 每日计划</h2>
      <div class="header-actions">
        <el-button-group>
          <el-button @click="changeDate(-1)">◀</el-button>
          <el-button @click="goToday">今天</el-button>
          <el-button @click="changeDate(1)">▶</el-button>
        </el-button-group>
        <span class="current-date">{{ currentDate }}</span>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- 每日计划 -->
      <el-col :xs="24" :md="12">
        <div class="card">
          <div class="card-header">
            <h3>📋 今日待办</h3>
            <el-button type="primary" size="small" @click="showAddPlan = true">+ 添加</el-button>
          </div>

          <div class="plan-list" v-if="plans.length">
            <div v-for="plan in plans" :key="plan.id" class="plan-item" :class="{ completed: plan.completed }">
              <el-checkbox v-model="plan.completed" @change="togglePlan(plan)" />
              <span class="plan-content">{{ plan.content }}</span>
              <el-icon class="plan-delete" @click="removePlan(plan.id)"><Delete /></el-icon>
            </div>
          </div>
          <el-empty v-else description="暂无计划" :image-size="60" />

          <div class="plan-summary" v-if="plans.length">
            已完成 {{ plans.filter(p => p.completed).length }} / {{ plans.length }}
          </div>
        </div>
      </el-col>

      <!-- 工作日志 -->
      <el-col :xs="24" :md="12">
        <div class="card">
          <div class="card-header">
            <h3>📊 工作日志</h3>
          </div>

          <el-form label-position="top">
            <el-form-item label="关联项目">
              <el-select v-model="logForm.project_id" placeholder="选择项目" clearable style="width: 100%;">
                <el-option v-for="p in projectStore.projects" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="今日进度 (%)">
              <el-slider v-model="logForm.progress" :min="0" :max="100" show-input />
            </el-form-item>
            <el-form-item label="工作内容">
              <el-input v-model="logForm.content" type="textarea" :rows="4" placeholder="记录今天的工作内容..." />
            </el-form-item>
            <el-button type="primary" @click="saveLog" style="width: 100%;">保存日志</el-button>
          </el-form>

          <div class="logs-list" v-if="logs.length">
            <h4>历史日志</h4>
            <div v-for="log in logs" :key="log.id" class="log-item">
              <div class="log-header">
                <span class="log-project" v-if="log.project_name">{{ log.project_name }}</span>
                <span class="log-date">{{ log.log_date }}</span>
                <span class="log-progress">{{ log.progress }}%</span>
              </div>
              <p class="log-content">{{ log.content }}</p>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 添加计划对话框 -->
    <el-dialog v-model="showAddPlan" title="添加计划" width="400px">
      <el-input v-model="newPlanContent" type="textarea" :rows="3" placeholder="输入计划内容..." />
      <template #footer>
        <el-button @click="showAddPlan = false">取消</el-button>
        <el-button type="primary" @click="addPlan" :disabled="!newPlanContent.trim()">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProjectStore } from '../stores/project'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const projectStore = useProjectStore()
const selectedDate = ref(dayjs())
const showAddPlan = ref(false)
const newPlanContent = ref('')
const plans = ref([])
const logs = ref([])

const currentDate = computed(() => selectedDate.value.format('YYYY年MM月DD日 dddd'))
const currentDateStr = computed(() => selectedDate.value.format('YYYY-MM-DD'))

const logForm = ref({
  project_id: null,
  content: '',
  progress: 0
})

function changeDate(dir) {
  selectedDate.value = selectedDate.value.add(dir, 'day')
  loadDateData()
}

function goToday() {
  selectedDate.value = dayjs()
  loadDateData()
}

async function loadDateData() {
  try {
    await Promise.all([
      projectStore.fetchProjects(),
      projectStore.fetchDailyPlans(currentDateStr.value),
      projectStore.fetchDailyLogs(currentDateStr.value)
    ])
    plans.value = projectStore.dailyPlans
    logs.value = projectStore.dailyLogs
  } catch (err) {
    console.error('加载数据失败:', err)
  }
}

async function addPlan() {
  if (!newPlanContent.value.trim()) return
  const plan = await projectStore.createDailyPlan({
    plan_date: currentDateStr.value,
    content: newPlanContent.value.trim()
  })
  plans.value.push(plan)
  newPlanContent.value = ''
  showAddPlan.value = false
}

async function togglePlan(plan) {
  await projectStore.updateDailyPlan(plan.id, { completed: plan.completed ? 1 : 0 })
}

async function removePlan(id) {
  await projectStore.deleteDailyPlan(id)
  plans.value = plans.value.filter(p => p.id !== id)
}

async function saveLog() {
  try {
    await projectStore.saveDailyLog({
      ...logForm.value,
      log_date: currentDateStr.value
    })
    ElMessage.success('日志已保存')
    logForm.value = { project_id: null, content: '', progress: 0 }
    loadDateData()
  } catch (err) {
    ElMessage.error(err.error || '保存失败')
  }
}

onMounted(loadDateData)
</script>

<style scoped lang="scss">
.current-date {
  font-size: 15px;
  font-weight: 600;
  color: var(--primary-color);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h3 { font-size: 16px; font-weight: 600; }
}

.plan-list {
  .plan-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child { border-bottom: none; }

    &.completed .plan-content {
      text-decoration: line-through;
      color: #c0c4cc;
    }

    .plan-content { flex: 1; font-size: 14px; }

    .plan-delete {
      color: #c0c4cc;
      cursor: pointer;
      &:hover { color: #F44336; }
    }
  }
}

.plan-summary {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
  font-size: 13px;
  color: #909399;
  text-align: right;
}

.logs-list {
  margin-top: 20px;
  border-top: 1px solid #e4e7ed;
  padding-top: 16px;

  h4 { font-size: 14px; margin-bottom: 12px; color: #606266; }

  .log-item {
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child { border-bottom: none; }

    .log-header {
      display: flex;
      gap: 10px;
      font-size: 12px;
      margin-bottom: 6px;

      .log-project {
        background: #e6f0ff;
        color: #0066CC;
        padding: 1px 8px;
        border-radius: 10px;
      }

      .log-date { color: #909399; }
      .log-progress { color: #4CAF50; font-weight: 600; }
    }

    .log-content {
      font-size: 13px;
      color: #606266;
      line-height: 1.6;
    }
  }
}
</style>
