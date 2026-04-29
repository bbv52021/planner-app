<template>
  <div class="calendar-view">
    <div class="page-header">
      <h2>📆 日历视图</h2>
      <div class="header-actions">
        <el-button-group>
          <el-button @click="navigate(-1)">◀</el-button>
          <el-button @click="goToday">今天</el-button>
          <el-button @click="navigate(1)">▶</el-button>
        </el-button-group>
        <el-button-group>
          <el-button :type="view === 'month' ? 'primary' : ''" @click="view = 'month'">月</el-button>
          <el-button :type="view === 'year' ? 'primary' : ''" @click="view = 'year'">年</el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 月视图 -->
    <div v-if="view === 'month'" class="card">
      <div class="calendar-header">
        <h3>{{ currentMonth }}</h3>
      </div>
      <div class="calendar-grid">
        <div class="weekday-header">
          <div v-for="w in weekdays" :key="w" class="weekday-cell" :class="{ weekend: w === '日' || w === '六' }">{{ w }}</div>
        </div>
        <div class="calendar-body">
          <div v-for="(day, idx) in calendarDays" :key="idx" class="calendar-day" :class="{
            otherMonth: !day.currentMonth,
            today: day.isToday,
            weekend: day.isWeekend
          }" @click="selectDay(day)">
            <div class="day-number">{{ day.day }}</div>
            <div class="day-projects" v-if="day.projects.length">
              <div v-for="p in day.projects.slice(0, 3)" :key="p.id" class="day-project-dot" :style="{ background: p.color }" :title="p.name"></div>
              <span v-if="day.projects.length > 3" class="more-tag">+{{ day.projects.length - 3 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 年视图 -->
    <div v-if="view === 'year'" class="year-view">
      <div class="calendar-header">
        <h3>{{ currentYear }}年</h3>
      </div>
      <div class="year-grid">
        <div v-for="m in 12" :key="m" class="month-card card" @click="goToMonth(m)">
          <h4>{{ m }}月</h4>
          <div class="month-stats">
            <span class="stat-count">{{ getMonthStats(m) }}</span>
            <span class="stat-label">个项目</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 日期详情弹窗 -->
    <el-dialog v-model="showDayDetail" :title="selectedDayStr" width="500px">
      <div v-if="dayProjects.length">
        <div v-for="p in dayProjects" :key="p.id" class="day-detail-item">
          <span class="color-dot" :style="{ background: p.color }"></span>
          <div class="detail-info">
            <strong>{{ p.name }}</strong>
            <p>{{ p.detail || '无描述' }}</p>
            <div class="detail-meta">
              <span>进度: {{ p.progress }}%</span>
              <span>{{ statusText(p.status) }}</span>
            </div>
          </div>
        </div>
      </div>
      <el-empty v-else description="当日无项目" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useProjectStore } from '../stores/project'
import dayjs from 'dayjs'

const projectStore = useProjectStore()
const view = ref('month')
const currentDate = ref(dayjs())
const projects = ref([])
const showDayDetail = ref(false)
const selectedDayStr = ref('')
const dayProjects = ref([])

const weekdays = ['一', '二', '三', '四', '五', '六', '日']

const currentMonth = computed(() => currentDate.value.format('YYYY年MM月'))
const currentYear = computed(() => currentDate.value.year())

const calendarDays = computed(() => {
  const start = currentDate.value.startOf('month')
  const end = currentDate.value.endOf('month')
  // 周一开始
  let startDay = start.day() - 1
  if (startDay < 0) startDay = 6

  const days = []
  const calendarStart = start.subtract(startDay, 'day')

  for (let i = 0; i < 42; i++) {
    const d = calendarStart.add(i, 'day')
    const dateStr = d.format('YYYY-MM-DD')
    const dayProjects = projects.value.filter(p => {
      const pStart = dayjs(p.start_date)
      const pEnd = p.end_date ? dayjs(p.end_date) : null
      return d.isAfter(pStart, 'day') || d.isSame(pStart, 'day') &&
        (!pEnd || d.isBefore(pEnd, 'day') || d.isSame(pEnd, 'day'))
    })

    days.push({
      day: d.date(),
      date: dateStr,
      currentMonth: d.month() === currentDate.value.month(),
      isToday: d.isSame(dayjs(), 'day'),
      isWeekend: d.day() === 0 || d.day() === 6,
      projects: dayProjects
    })
  }
  return days
})

function statusText(status) {
  return ['未开始', '进行中', '已完成'][status] || ''
}

function getMonthStats(month) {
  return projects.value.filter(p => {
    const m = dayjs(p.start_date).month() + 1
    return m === month
  }).length
}

function navigate(dir) {
  if (view.value === 'month') {
    currentDate.value = currentDate.value.add(dir, 'month')
  } else {
    currentDate.value = currentDate.value.add(dir, 'year')
  }
}

function goToday() {
  currentDate.value = dayjs()
}

function goToMonth(month) {
  currentDate.value = currentDate.value.month(month - 1).startOf('month')
  view.value = 'month'
}

function selectDay(day) {
  selectedDayStr.value = day.date
  dayProjects.value = day.projects
  showDayDetail.value = true
}

async function loadData() {
  try {
    const start = view.value === 'year'
      ? currentDate.value.startOf('year').format('YYYY-MM-DD')
      : currentDate.value.startOf('month').subtract(7, 'day').format('YYYY-MM-DD')
    const end = view.value === 'year'
      ? currentDate.value.endOf('year').format('YYYY-MM-DD')
      : currentDate.value.endOf('month').add(7, 'day').format('YYYY-MM-DD')
    const data = await projectStore.fetchGanttData(start, end)
    projects.value = data
  } catch (err) {
    console.error('加载日历数据失败:', err)
  }
}

onMounted(loadData)
watch(currentDate, loadData)
watch(view, loadData)
</script>

<style scoped lang="scss">
.calendar-header {
  text-align: center;
  margin-bottom: 16px;

  h3 { font-size: 18px; font-weight: 600; }
}

.calendar-grid {
  .weekday-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);

    .weekday-cell {
      text-align: center;
      padding: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #606266;

      &.weekend { color: #F44336; }
    }
  }

  .calendar-body {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }

  .calendar-day {
    min-height: 80px;
    border: 1px solid #f0f0f0;
    padding: 4px;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: #f5f7fa; }

    &.otherMonth { background: #fafafa; }
    &.otherMonth .day-number { color: #c0c4cc; }

    &.today {
      background: #e6f0ff;
      .day-number {
        background: var(--primary-color);
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    &.weekend { background: #fef9f0; }

    .day-number {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .day-projects {
      display: flex;
      flex-wrap: wrap;
      gap: 2px;

      .day-project-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .more-tag {
        font-size: 10px;
        color: #909399;
      }
    }
  }
}

.year-view {
  .year-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }

  .month-card {
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    h4 { font-size: 16px; margin-bottom: 8px; color: var(--primary-color); }

    .month-stats {
      .stat-count { font-size: 24px; font-weight: 700; }
      .stat-label { font-size: 12px; color: #909399; }
    }
  }
}

.day-detail-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child { border-bottom: none; }

  .color-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-top: 6px;
    flex-shrink: 0;
  }

  .detail-info {
    flex: 1;

    strong { font-size: 14px; }
    p { font-size: 12px; color: #909399; margin: 4px 0; }
    .detail-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: #606266;
    }
  }
}

@media (max-width: 768px) {
  .calendar-day { min-height: 50px; }
}
</style>
