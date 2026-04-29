<template>
  <div class="dashboard">
    <div class="page-header">
      <h2>📊 仪表盘</h2>
      <div class="header-actions">
        <el-tag type="info" size="large">
          {{ today }}
        </el-tag>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: #e6f0ff; color: #0066CC;">📁</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats?.total || 0 }}</div>
          <div class="stat-label">总项目数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #e8f5e9; color: #4CAF50;">✅</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats?.completed || 0 }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #fff3e0; color: #FF9800;">🔄</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats?.in_progress || 0 }}</div>
          <div class="stat-label">进行中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #fce4ec; color: #F44336;">⏳</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats?.not_started || 0 }}</div>
          <div class="stat-label">未开始</div>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- 今日计划 -->
      <el-col :xs="24" :sm="24" :md="12">
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-header">
            <h3>📝 今日计划</h3>
            <el-button type="primary" size="small" @click="showAddPlan = true">+ 添加</el-button>
          </div>
          <div class="plan-list" v-if="todayPlans.length">
            <div v-for="plan in todayPlans" :key="plan.id" class="plan-item" :class="{ completed: plan.completed }">
              <el-checkbox v-model="plan.completed" @change="togglePlan(plan)" />
              <span class="plan-content">{{ plan.content }}</span>
              <el-icon class="delete-btn" @click="removePlan(plan.id)"><Delete /></el-icon>
            </div>
          </div>
          <el-empty v-else description="暂无今日计划" :image-size="60" />
        </div>
      </el-col>

      <!-- 进行中的项目 -->
      <el-col :xs="24" :sm="24" :md="12">
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-header">
            <h3>🔄 进行中的项目</h3>
            <el-button type="primary" size="small" @click="$router.push('/projects')">查看全部</el-button>
          </div>
          <div class="project-list" v-if="activeProjects.length">
            <div v-for="project in activeProjects" :key="project.id" class="project-item" @click="$router.push('/gantt')">
              <div class="project-name">
                <span class="color-dot" :style="{ background: project.color }"></span>
                {{ project.name }}
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: project.progress + '%', background: project.color }"></div>
              </div>
              <div class="project-meta">
                <span>{{ project.start_date }}</span>
                <span>{{ project.progress }}%</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无进行中的项目" :image-size="60" />
        </div>
      </el-col>
    </el-row>

    <!-- 添加计划对话框 -->
    <el-dialog v-model="showAddPlan" title="添加今日计划" width="400px" :close-on-click-modal="false">
      <el-input v-model="newPlanContent" placeholder="输入计划内容..." type="textarea" :rows="3" />
      <template #footer>
        <el-button @click="showAddPlan = false">取消</el-button>
        <el-button type="primary" @click="addPlan" :disabled="!newPlanContent.trim()">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useProjectStore } from '../stores/project'
import dayjs from 'dayjs'

const projectStore = useProjectStore()
const today = dayjs().format('YYYY年MM月DD日')
const todayStr = dayjs().format('YYYY-MM-DD')
const showAddPlan = ref(false)
const newPlanContent = ref('')
const todayPlans = ref([])
const stats = ref(null)
const activeProjects = ref([])

onMounted(async () => {
  try {
    const [statsData, plans, projectsData] = await Promise.all([
      projectStore.fetchStats(),
      projectStore.fetchDailyPlans(todayStr),
      projectStore.fetchProjects({ status: 1 })
    ])
    stats.value = statsData.stats
    todayPlans.value = plans
    activeProjects.value = projectsData.projects.filter(p => p.status === 1).slice(0, 5)
  } catch (err) {
    console.error('加载仪表盘数据失败:', err)
  }
})

async function addPlan() {
  if (!newPlanContent.value.trim()) return
  const plan = await projectStore.createDailyPlan({
    plan_date: todayStr,
    content: newPlanContent.value.trim()
  })
  todayPlans.value.push(plan)
  newPlanContent.value = ''
  showAddPlan.value = false
}

async function togglePlan(plan) {
  await projectStore.updateDailyPlan(plan.id, { completed: plan.completed ? 1 : 0 })
}

async function removePlan(id) {
  await projectStore.deleteDailyPlan(id)
  todayPlans.value = todayPlans.value.filter(p => p.id !== id)
}
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h3 {
    font-size: 16px;
    font-weight: 600;
  }
}

.plan-list {
  .plan-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child { border-bottom: none; }

    &.completed .plan-content {
      text-decoration: line-through;
      color: #c0c4cc;
    }

    .plan-content {
      flex: 1;
      font-size: 14px;
    }

    .delete-btn {
      color: #c0c4cc;
      cursor: pointer;
      &:hover { color: #F44336; }
    }
  }
}

.project-list {
  .project-item {
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;

    &:last-child { border-bottom: none; }
    &:hover { background: #f5f7fa; margin: 0 -20px; padding: 12px 20px; }

    .project-name {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;

      .color-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
    }

    .project-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #909399;
      margin-top: 6px;
    }
  }
}
</style>
