import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../utils/api'

export const useProjectStore = defineStore('projects', () => {
  const projects = ref([])
  const categories = ref([])
  const currentProject = ref(null)
  const dailyLogs = ref([])
  const dailyPlans = ref([])
  const stats = ref(null)

  // ===== 分类 =====
  async function fetchCategories() {
    const data = await api.get('/categories')
    categories.value = data.categories || []
  }

  async function createCategory(name, color, icon) {
    const data = await api.post('/categories', { name, color, icon })
    categories.value.push(data.category)
    return data.category
  }

  async function updateCategory(id, updates) {
    await api.put(`/categories/${id}`, updates)
    await fetchCategories()
  }

  async function deleteCategory(id) {
    await api.delete(`/categories/${id}`)
    categories.value = categories.value.filter(c => c.id !== id)
  }

  // ===== 项目 =====
  async function fetchProjects(params = {}) {
    const query = new URLSearchParams(params).toString()
    const data = await api.get(`/projects${query ? '?' + query : ''}`)
    projects.value = data.projects || []
    return data
  }

  async function fetchProject(id) {
    const data = await api.get(`/projects/${id}`)
    currentProject.value = data.project
    dailyLogs.value = data.logs || []
    return data
  }

  async function createProject(project) {
    const data = await api.post('/projects', project)
    projects.value.unshift(data.project)
    return data.project
  }

  async function updateProject(id, updates) {
    const data = await api.put(`/projects/${id}`, updates)
    const idx = projects.value.findIndex(p => p.id === id)
    if (idx !== -1) projects.value[idx] = data.project
    return data.project
  }

  async function deleteProject(id) {
    await api.delete(`/projects/${id}`)
    projects.value = projects.value.filter(p => p.id !== id)
  }

  // ===== 甘特图 =====
  async function fetchGanttData(startDate, endDate) {
    const data = await api.get(`/projects/gantt?start_date=${startDate}&end_date=${endDate}`)
    return data.projects || []
  }

  // ===== 统计 =====
  async function fetchStats() {
    const data = await api.get('/projects/stats')
    stats.value = data
    return data
  }

  // ===== 每日日志 =====
  async function fetchDailyLogs(date) {
    const data = await api.get(`/daily-logs?date=${date}`)
    dailyLogs.value = data.logs || []
    return data.logs
  }

  async function saveDailyLog(log) {
    await api.post('/daily-logs', log)
  }

  // ===== 每日计划 =====
  async function fetchDailyPlans(date) {
    const data = await api.get(`/daily-plans?date=${date}`)
    dailyPlans.value = data.plans || []
    return data.plans
  }

  async function createDailyPlan(plan) {
    const data = await api.post('/daily-plans', plan)
    dailyPlans.value.push(data.plan)
    return data.plan
  }

  async function updateDailyPlan(id, updates) {
    await api.put(`/daily-plans/${id}`, updates)
    const idx = dailyPlans.value.findIndex(p => p.id === id)
    if (idx !== -1) Object.assign(dailyPlans.value[idx], updates)
  }

  async function deleteDailyPlan(id) {
    await api.delete(`/daily-plans/${id}`)
    dailyPlans.value = dailyPlans.value.filter(p => p.id !== id)
  }

  return {
    projects, categories, currentProject, dailyLogs, dailyPlans, stats,
    fetchCategories, createCategory, updateCategory, deleteCategory,
    fetchProjects, fetchProject, createProject, updateProject, deleteProject,
    fetchGanttData, fetchStats,
    fetchDailyLogs, saveDailyLog,
    fetchDailyPlans, createDailyPlan, updateDailyPlan, deleteDailyPlan
  }
})
