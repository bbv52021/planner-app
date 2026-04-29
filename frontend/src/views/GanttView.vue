<template>
  <div class="gantt-view">
    <div class="page-header">
      <h2>📅 甘特图 - 工作计划总览</h2>
      <div class="header-actions">
        <el-button-group>
          <el-button :type="viewMode === 'month' ? 'primary' : ''" @click="setViewMode('month')">月视图</el-button>
          <el-button :type="viewMode === 'quarter' ? 'primary' : ''" @click="setViewMode('quarter')">季度视图</el-button>
          <el-button :type="viewMode === 'year' ? 'primary' : ''" @click="setViewMode('year')">年视图</el-button>
        </el-button-group>
        <el-button-group>
          <el-button @click="navigate(-1)">◀</el-button>
          <el-button @click="navigateToToday">今天</el-button>
          <el-button @click="navigate(1)">▶</el-button>
        </el-button-group>
        <el-button type="success" @click="showProjectDialog = true">+ 新建项目</el-button>
      </div>
    </div>

    <!-- 信息栏 -->
    <div class="info-bar">
      <span>📅 今日: {{ todayStr }}</span>
      <span>📊 表格范围: {{ rangeStart }} ~ {{ rangeEnd }}</span>
      <span>📈 项目数: {{ projects.length }}</span>
    </div>

    <!-- 甘特图表格 -->
    <div class="gantt-container" ref="ganttContainer">
      <div class="gantt-table">
        <!-- 固定左侧表头 -->
        <div class="gantt-left-header">
          <div class="header-cell" style="width: 50px;">序号</div>
          <div class="header-cell" style="width: 160px;">项目名称</div>
          <div class="header-cell" style="width: 200px;">项目细节</div>
          <div class="header-cell" style="width: 100px;">开始日期</div>
          <div class="header-cell" style="width: 100px;">结束日期</div>
          <div class="header-cell" style="width: 80px;">完成进度</div>
        </div>

        <!-- 日期时间线表头 -->
        <div class="gantt-timeline-header" ref="timelineHeader">
          <div class="month-row">
            <div v-for="month in monthHeaders" :key="month.label" class="month-cell" :style="{ width: month.days * dayWidth + 'px' }">
              {{ month.label }}
            </div>
          </div>
          <div class="day-row">
            <div v-for="day in days" :key="day.date" class="day-cell" :class="dayClass(day)" :style="{ width: dayWidth + 'px' }">
              <span class="day-num">{{ day.day }}</span>
              <span class="day-week">{{ day.weekday }}</span>
            </div>
          </div>
        </div>

        <!-- 数据行 -->
        <div class="gantt-body">
          <div class="gantt-left-body">
            <div v-for="(project, index) in projects" :key="project.id" class="data-row" @click="editProject(project)">
              <div class="data-cell" style="width: 50px;">{{ index + 1 }}</div>
              <div class="data-cell project-name-cell" style="width: 160px;">
                <span class="color-dot" :style="{ background: project.color }"></span>
                {{ project.name }}
              </div>
              <div class="data-cell" style="width: 200px;" :title="project.detail">
                {{ project.detail || '-' }}
              </div>
              <div class="data-cell" style="width: 100px;">{{ project.start_date }}</div>
              <div class="data-cell" style="width: 100px;">{{ project.end_date || '进行中' }}</div>
              <div class="data-cell" style="width: 80px;">
                <div class="mini-progress">
                  <div class="mini-progress-fill" :style="{ width: project.progress + '%', background: project.color }"></div>
                </div>
                <span class="progress-text">{{ project.progress }}%</span>
              </div>
            </div>
            <div v-if="!projects.length" class="empty-row">
              <div class="data-cell" style="width: 690px; text-align: center; padding: 40px 0; color: #909399;">
                暂无项目，点击右上角"新建项目"开始添加
              </div>
            </div>
          </div>

          <div class="gantt-timeline-body" ref="timelineBody">
            <div v-for="project in projects" :key="'t-' + project.id" class="timeline-row">
              <!-- 甘特条 -->
              <div v-if="getBarStyle(project)" class="gantt-bar" :style="getBarStyle(project)" @click="editProject(project)">
                <div class="bar-fill" :style="{ width: project.progress + '%', background: project.color }"></div>
                <span class="bar-label" v-if="dayWidth >= 25">{{ project.name }}</span>
              </div>
            </div>
            <div v-if="!projects.length" class="timeline-row">
              <div class="empty-timeline"></div>
            </div>
            <!-- 今天标记线 -->
            <div class="today-line" :style="{ left: getTodayOffset() + 'px' }">
              <div class="today-marker">今天</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图例 -->
    <div class="legend">
      <span class="legend-item"><span class="legend-color" style="background: #f0f9eb;"></span>周末</span>
      <span class="legend-item"><span class="legend-color" style="background: #e8f5e9;"></span>节假日</span>
      <span class="legend-item"><span class="legend-color" style="background: #0066CC;"></span>项目进度条</span>
    </div>

    <!-- 新建/编辑项目对话框 -->
    <el-dialog v-model="showProjectDialog" :title="editingProject ? '编辑项目' : '新建项目'" width="500px" :close-on-click-modal="false">
      <el-form :model="projectForm" label-width="80px">
        <el-form-item label="项目名称" required>
          <el-input v-model="projectForm.name" placeholder="输入项目名称" />
        </el-form-item>
        <el-form-item label="项目细节">
          <el-input v-model="projectForm.detail" type="textarea" :rows="3" placeholder="输入项目详细描述" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="projectForm.category_id" placeholder="选择分类" clearable style="width: 100%;">
            <el-option v-for="cat in projectStore.categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" required>
          <el-date-picker v-model="projectForm.start_date" type="date" placeholder="选择开始日期" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="projectForm.end_date" type="date" placeholder="选择结束日期（可选）" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="完成进度">
          <el-slider v-model="projectForm.progress" :min="0" :max="100" show-input />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="projectForm.status">
            <el-radio :value="0">未开始</el-radio>
            <el-radio :value="1">进行中</el-radio>
            <el-radio :value="2">已完成</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="优先级">
          <el-rate v-model="projectForm.priority" :max="3" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="projectForm.color" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button v-if="editingProject" type="danger" @click="deleteProject">删除</el-button>
        <el-button type="primary" @click="saveProject" :disabled="!projectForm.name || !projectForm.start_date">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useProjectStore } from '../stores/project'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const projectStore = useProjectStore()
const ganttContainer = ref(null)
const timelineBody = ref(null)

const viewMode = ref('month')
const currentDate = ref(dayjs())
const projects = ref([])
const showProjectDialog = ref(false)
const editingProject = ref(null)

const todayStr = dayjs().format('YYYY-MM-DD')

const projectForm = ref({
  name: '', detail: '', category_id: null,
  start_date: '', end_date: '', progress: 0,
  status: 0, priority: 0, color: '#4CAF50'
})

const dayWidth = computed(() => {
  if (viewMode.value === 'year') return 4
  if (viewMode.value === 'quarter') return 12
  return 36
})

const rangeStart = computed(() => {
  if (viewMode.value === 'year') return currentDate.value.startOf('year').format('YYYY-MM-DD')
  if (viewMode.value === 'quarter') return currentDate.value.startOf('month').subtract(1, 'month').format('YYYY-MM-DD')
  return currentDate.value.startOf('month').format('YYYY-MM-DD')
})

const rangeEnd = computed(() => {
  if (viewMode.value === 'year') return currentDate.value.endOf('year').format('YYYY-MM-DD')
  if (viewMode.value === 'quarter') return currentDate.value.endOf('month').add(1, 'month').format('YYYY-MM-DD')
  return currentDate.value.endOf('month').format('YYYY-MM-DD')
})

const days = computed(() => {
  const result = []
  let start = dayjs(rangeStart.value)
  const end = dayjs(rangeEnd.value)
  while (start.isBefore(end) || start.isSame(end, 'day')) {
    result.push({
      date: start.format('YYYY-MM-DD'),
      day: start.date(),
      weekday: ['日', '一', '二', '三', '四', '五', '六'][start.day()],
      isWeekend: start.day() === 0 || start.day() === 6,
      isToday: start.isSame(dayjs(), 'day'),
      month: start.month(),
      year: start.year()
    })
    start = start.add(1, 'day')
  }
  return result
})

const monthHeaders = computed(() => {
  const months = []
  let currentMonth = -1
  let currentYear = -1
  let count = 0

  for (const day of days.value) {
    if (day.month !== currentMonth || day.year !== currentYear) {
      if (count > 0) {
        months[months.length - 1].days = count
      }
      months.push({
        label: `${day.year}年${day.month + 1}月`,
        month: day.month,
        year: day.year,
        days: 0
      })
      currentMonth = day.month
      currentYear = day.year
      count = 0
    }
    count++
  }
  if (count > 0 && months.length) {
    months[months.length - 1].days = count
  }
  return months
})

function dayClass(day) {
  return {
    weekend: day.isWeekend,
    today: day.isToday,
    holiday: isHoliday(day.date)
  }
}

function isHoliday(date) {
  // 简单的节假日判断（五一、国庆等）
  const m = dayjs(date)
  const month = m.month() + 1
  const day = m.date()
  if (month === 1 && day === 1) return true
  if (month === 5 && day >= 1 && day <= 5) return true
  if (month === 10 && day >= 1 && day <= 7) return true
  return false
}

function getBarStyle(project) {
  const start = dayjs(project.start_date)
  const end = project.end_date ? dayjs(project.end_date) : dayjs().add(30, 'day')
  const rangeStartDay = dayjs(rangeStart.value)

  const offsetDays = start.diff(rangeStartDay, 'day')
  const durationDays = Math.max(end.diff(start, 'day'), 1)

  if (offsetDays + durationDays < 0 || offsetDays > days.value.length) return null

  const left = Math.max(offsetDays, 0) * dayWidth.value
  const width = Math.min(durationDays - Math.max(-offsetDays, 0), days.value.length - Math.max(offsetDays, 0)) * dayWidth.value

  if (width <= 0) return null

  return {
    left: left + 'px',
    width: width + 'px',
    '--bar-color': project.color
  }
}

function getTodayOffset() {
  const today = dayjs()
  const rangeStartDay = dayjs(rangeStart.value)
  const diff = today.diff(rangeStartDay, 'day')
  if (diff < 0 || diff > days.value.length) return -100
  return diff * dayWidth.value + dayWidth.value / 2
}

function setViewMode(mode) {
  viewMode.value = mode
  loadData()
}

function navigate(direction) {
  if (viewMode.value === 'month') {
    currentDate.value = currentDate.value.add(direction, 'month')
  } else if (viewMode.value === 'quarter') {
    currentDate.value = currentDate.value.add(direction * 3, 'month')
  } else {
    currentDate.value = currentDate.value.add(direction, 'year')
  }
  loadData()
}

function navigateToToday() {
  currentDate.value = dayjs()
  loadData()
}

async function loadData() {
  try {
    await projectStore.fetchCategories()
    const data = await projectStore.fetchGanttData(rangeStart.value, rangeEnd.value)
    projects.value = data
  } catch (err) {
    console.error('加载甘特图数据失败:', err)
  }
}

function editProject(project) {
  editingProject.value = project
  projectForm.value = {
    name: project.name,
    detail: project.detail,
    category_id: project.category_id,
    start_date: project.start_date,
    end_date: project.end_date,
    progress: project.progress,
    status: project.status,
    priority: project.priority,
    color: project.color
  }
  showProjectDialog.value = true
}

function closeDialog() {
  showProjectDialog.value = false
  editingProject.value = null
  projectForm.value = {
    name: '', detail: '', category_id: null,
    start_date: '', end_date: '', progress: 0,
    status: 0, priority: 0, color: '#4CAF50'
  }
}

async function saveProject() {
  try {
    if (editingProject.value) {
      await projectStore.updateProject(editingProject.value.id, projectForm.value)
      ElMessage.success('项目已更新')
    } else {
      await projectStore.createProject(projectForm.value)
      ElMessage.success('项目已创建')
    }
    closeDialog()
    loadData()
  } catch (err) {
    ElMessage.error(err.error || '保存失败')
  }
}

async function deleteProject() {
  try {
    await projectStore.deleteProject(editingProject.value.id)
    ElMessage.success('项目已删除')
    closeDialog()
    loadData()
  } catch (err) {
    ElMessage.error(err.error || '删除失败')
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.gantt-view {
  .header-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
}

.info-bar {
  display: flex;
  gap: 20px;
  padding: 10px 16px;
  background: #e6f0ff;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #0066CC;
  flex-wrap: wrap;
}

.gantt-container {
  overflow: auto;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: white;
  box-shadow: var(--shadow);
}

.gantt-table {
  display: inline-block;
  min-width: 100%;
}

.gantt-left-header {
  display: flex;
  position: sticky;
  top: 0;
  left: 0;
  z-index: 20;
  background: #0066CC;

  .header-cell {
    min-width: unset;
    padding: 10px 8px;
    color: white;
    font-size: 13px;
    font-weight: 600;
    text-align: center;
    border-right: 1px solid rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
  }
}

.gantt-timeline-header {
  display: inline-block;
  position: sticky;
  top: 0;
  z-index: 10;
  background: #0066CC;

  .month-row {
    display: flex;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);

    .month-cell {
      padding: 8px 4px;
      color: white;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      border-right: 1px solid rgba(255, 255, 255, 0.2);
      white-space: nowrap;
    }
  }

  .day-row {
    display: flex;

    .day-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4px 0;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;

      &.weekend {
        background: rgba(255, 255, 255, 0.15);
      }

      &.today {
        background: rgba(255, 193, 7, 0.3);
      }

      &.holiday {
        background: rgba(76, 175, 80, 0.2);
      }

      .day-num {
        color: white;
        font-size: 12px;
        font-weight: 600;
      }

      .day-week {
        color: rgba(255, 255, 255, 0.8);
        font-size: 10px;
      }
    }
  }
}

.gantt-body {
  display: flex;
}

.gantt-left-body {
  position: sticky;
  left: 0;
  z-index: 5;
  background: white;

  .data-row {
    display: flex;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: #f5f7fa;
    }
  }

  .data-cell {
    padding: 10px 8px;
    font-size: 13px;
    border-right: 1px solid #f0f0f0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .project-name-cell {
    gap: 6px;

    .color-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
  }

  .mini-progress {
    width: 50px;
    height: 6px;
    background: #e4e7ed;
    border-radius: 3px;
    overflow: hidden;
    margin-right: 6px;

    .mini-progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s;
    }
  }

  .progress-text {
    font-size: 11px;
    color: #606266;
    white-space: nowrap;
  }

  .empty-row {
    .data-cell {
      justify-content: center;
    }
  }
}

.gantt-timeline-body {
  display: inline-block;
  position: relative;

  .timeline-row {
    height: 42px;
    border-bottom: 1px solid #f0f0f0;
    position: relative;

    // 周末背景
    .weekend-bg {
      position: absolute;
      top: 0;
      bottom: 0;
      background: #f0f9eb;
      z-index: 0;
    }
  }

  .gantt-bar {
    position: absolute;
    top: 8px;
    height: 26px;
    background: rgba(0, 102, 204, 0.15);
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    z-index: 1;
    border: 1px solid rgba(0, 102, 204, 0.3);
    transition: all 0.15s;

    &:hover {
      transform: scaleY(1.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s;
    }

    .bar-label {
      position: absolute;
      top: 50%;
      left: 8px;
      transform: translateY(-50%);
      font-size: 11px;
      color: #303133;
      white-space: nowrap;
      font-weight: 500;
    }
  }

  .today-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #F44336;
    z-index: 3;

    .today-marker {
      position: absolute;
      top: -22px;
      left: 50%;
      transform: translateX(-50%);
      background: #F44336;
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      white-space: nowrap;
    }
  }

  .empty-timeline {
    height: 42px;
  }
}

.legend {
  display: flex;
  gap: 20px;
  margin-top: 12px;
  font-size: 12px;
  color: #909399;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .legend-color {
    width: 16px;
    height: 12px;
    border-radius: 2px;
    border: 1px solid #e4e7ed;
  }
}

@media (max-width: 768px) {
  .info-bar {
    font-size: 11px;
    gap: 10px;
  }

  .header-actions {
    .el-button-group {
      margin-bottom: 4px;
    }
  }
}
</style>
