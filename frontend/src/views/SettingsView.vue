<template>
  <div class="settings-view">
    <div class="page-header">
      <h2>⚙️ 设置</h2>
    </div>

    <el-row :gutter="20">
      <!-- 个人信息 -->
      <el-col :xs="24" :md="12">
        <div class="card">
          <h3>👤 个人信息</h3>
          <el-form label-width="80px" style="margin-top: 16px;">
            <el-form-item label="用户名">
              <el-input :model-value="authStore.user?.username" disabled />
            </el-form-item>
            <el-form-item label="昵称">
              <el-input v-model="nickname" placeholder="输入昵称" />
            </el-form-item>
            <el-button type="primary" @click="updateProfile" :loading="saving">保存</el-button>
          </el-form>
        </div>

        <div class="card" style="margin-top: 20px;">
          <h3>🔒 修改密码</h3>
          <el-form label-width="80px" style="margin-top: 16px;">
            <el-form-item label="旧密码">
              <el-input v-model="passwordForm.oldPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="passwordForm.newPassword" type="password" show-password />
            </el-form-item>
            <el-button type="primary" @click="changePassword" :loading="changingPwd">修改密码</el-button>
          </el-form>
        </div>
      </el-col>

      <!-- 分类管理 -->
      <el-col :xs="24" :md="12">
        <div class="card">
          <div class="card-header">
            <h3>📁 分类管理</h3>
            <el-button type="primary" size="small" @click="showCatDialog = true">+ 新建</el-button>
          </div>
          <div class="category-list">
            <div v-for="cat in projectStore.categories" :key="cat.id" class="category-item">
              <span class="cat-icon">{{ cat.icon }}</span>
              <span class="cat-color" :style="{ background: cat.color }"></span>
              <span class="cat-name">{{ cat.name }}</span>
              <el-icon class="cat-delete" @click="removeCategory(cat.id)"><Delete /></el-icon>
            </div>
            <el-empty v-if="!projectStore.categories.length" description="暂无分类" :image-size="60" />
          </div>
        </div>

        <!-- 关于 -->
        <div class="card" style="margin-top: 20px;">
          <h3>ℹ️ 关于</h3>
          <div class="about-info" style="margin-top: 16px;">
            <p><strong>工作生活备忘录</strong> v1.0.0</p>
            <p>项目计划管理 · 进度跟踪 · 甘特图</p>
            <p style="margin-top: 12px; color: #909399; font-size: 12px;">
              支持群晖Docker部署 · PWA移动端访问
            </p>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 新建分类对话框 -->
    <el-dialog v-model="showCatDialog" title="新建分类" width="350px">
      <el-form :model="catForm" label-width="60px">
        <el-form-item label="名称">
          <el-input v-model="catForm.name" placeholder="分类名称" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="catForm.icon" placeholder="如：📁 💼 🏠" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="catForm.color" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCatDialog = false">取消</el-button>
        <el-button type="primary" @click="addCategory" :disabled="!catForm.name">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useProjectStore } from '../stores/project'
import api from '../utils/api'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const projectStore = useProjectStore()
const nickname = ref(authStore.user?.nickname || '')
const saving = ref(false)
const changingPwd = ref(false)
const showCatDialog = ref(false)

const passwordForm = ref({ oldPassword: '', newPassword: '' })
const catForm = ref({ name: '', icon: '📁', color: '#0066CC' })

async function updateProfile() {
  saving.value = true
  try {
    await api.put('/auth/me', { nickname: nickname.value })
    authStore.user.nickname = nickname.value
    ElMessage.success('保存成功')
  } catch (err) {
    ElMessage.error(err.error || '保存失败')
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword) {
    ElMessage.warning('请输入旧密码和新密码')
    return
  }
  changingPwd.value = true
  try {
    await api.put('/auth/password', passwordForm.value)
    ElMessage.success('密码修改成功')
    passwordForm.value = { oldPassword: '', newPassword: '' }
  } catch (err) {
    ElMessage.error(err.error || '修改失败')
  } finally {
    changingPwd.value = false
  }
}

async function addCategory() {
  try {
    await projectStore.createCategory(catForm.value.name, catForm.value.color, catForm.value.icon)
    ElMessage.success('分类已创建')
    showCatDialog.value = false
    catForm.value = { name: '', icon: '📁', color: '#0066CC' }
  } catch (err) {
    ElMessage.error(err.error || '创建失败')
  }
}

async function removeCategory(id) {
  try {
    await projectStore.deleteCategory(id)
    ElMessage.success('分类已删除')
  } catch (err) {
    ElMessage.error(err.error || '删除失败')
  }
}

onMounted(() => {
  projectStore.fetchCategories()
})
</script>

<style scoped lang="scss">
.card {
  h3 {
    font-size: 16px;
    font-weight: 600;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 { font-size: 16px; font-weight: 600; }
}

.category-list {
  .category-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child { border-bottom: none; }

    .cat-icon { font-size: 18px; }
    .cat-color { width: 12px; height: 12px; border-radius: 3px; }
    .cat-name { flex: 1; font-size: 14px; }

    .cat-delete {
      color: #c0c4cc;
      cursor: pointer;
      &:hover { color: #F44336; }
    }
  }
}

.about-info {
  p {
    font-size: 14px;
    color: #606266;
    line-height: 1.8;
  }
}
</style>
