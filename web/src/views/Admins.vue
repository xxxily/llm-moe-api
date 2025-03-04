<template>
  <div class="admins-container">
    <div class="page-header">
      <div class="page-title">
        <h2>管理员账户管理</h2>
      </div>
      <div class="page-actions">
        <el-button type="primary" @click="handleAdd">添加管理员</el-button>
        <el-button 
          type="danger" 
          :disabled="selectedAdmins.length === 0" 
          @click="handleBatchDelete"
        >批量删除</el-button>
      </div>
    </div>

    <el-table 
      :data="admins" 
      style="width: 100%" 
      v-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" min-width="180" />
      <el-table-column prop="createdAt" label="创建时间" min-width="180">
        <template #default="scope">
          {{ new Date(scope.row.createdAt).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" min-width="180">
        <template #default="scope">
          {{ new Date(scope.row.updatedAt).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="200">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">修改密码</el-button>
          <el-button 
            size="small" 
            type="danger" 
            @click="handleDelete(scope.row)"
            :disabled="admins.length <= 1 || scope.row.username === currentUsername"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 管理员表单对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '修改密码' : '添加管理员'"
      width="40%"
      :fullscreen="isMobile"
    >
      <el-form 
        :model="adminForm" 
        :rules="rules" 
        ref="adminFormRef" 
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username" :disabled="isEdit">
          <el-input v-model="adminForm.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="adminForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="adminForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="30%"
    >
      <p>确定要删除管理员 "{{ currentAdmin?.username }}" 吗？此操作不可恢复。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete" :loading="deleting">
            确认删除
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量删除确认对话框 -->
    <el-dialog
      v-model="batchDeleteDialogVisible"
      title="确认批量删除"
      width="30%"
    >
      <p>确定要删除选中的 {{ selectedAdmins.length }} 个管理员吗？此操作不可恢复。</p>
      <p class="warning-text" v-if="hasCurrentUserInSelection">
        <el-icon><Warning /></el-icon> 注意：当前登录的账户不会被删除
      </p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDeleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmBatchDelete" :loading="batchDeleting">
            确认删除
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'
import { useWindowSize } from '@vueuse/core'
import { get, post, put, del } from '../utils/request.js'

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

const admins = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const batchDeleteDialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const batchDeleting = ref(false)
const currentAdmin = ref(null)
const adminFormRef = ref(null)
const currentUsername = ref('')
const selectedAdmins = ref([])

const hasCurrentUserInSelection = computed(() => {
  return selectedAdmins.value.some(admin => admin.username === currentUsername.value)
})

const adminForm = reactive({
  id: null,
  username: '',
  password: '',
  confirmPassword: ''
})

const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else if (value.length < 6) {
    callback(new Error('密码长度不能小于6位'))
  } else {
    if (adminForm.confirmPassword !== '') {
      adminFormRef.value.validateField('confirmPassword')
    }
    callback()
  }
}

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== adminForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { validator: validatePass, trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validatePass2, trigger: 'blur' }
  ]
}

onMounted(async () => {
  await fetchAdmins()
  // 获取当前登录用户名
  try {
    const response = await get('/admin/status')
    if (response.ok) {
      const data = await response.json()
      currentUsername.value = data.username
    }
  } catch (error) {
    console.error('获取当前用户信息失败:', error)
  }
})

// 修改获取管理员列表
const fetchAdmins = async () => {
  loading.value = true
  try {
    const response = await get('/api/admins')
    if (!response.ok) throw new Error('获取管理员列表失败')
    admins.value = await response.json()
  } catch (error) {
    ElMessage.error('获取管理员列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentAdmin.value = row
  adminForm.id = row.id
  adminForm.username = row.username
  adminForm.password = ''
  adminForm.confirmPassword = ''
  dialogVisible.value = true
}

const handleDelete = (row) => {
  currentAdmin.value = row
  deleteDialogVisible.value = true
}

const resetForm = () => {
  if (adminFormRef.value) {
    adminFormRef.value.resetFields()
  }
  Object.assign(adminForm, {
    id: null,
    username: '',
    password: '',
    confirmPassword: ''
  })
}

const submitForm = async () => {
  if (!adminFormRef.value) return
  
  await adminFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        let response;
        
        if (isEdit.value) {
          // 修改密码使用PUT方法
          response = await put(`/api/admins/${adminForm.id}`, {
            password: adminForm.password
          });
        } else {
          // 添加管理员使用POST方法
          response = await post('/api/admins', {
            username: adminForm.username,
            password: adminForm.password
          });
        }
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '操作失败')
        }
        
        ElMessage.success(isEdit.value ? '密码修改成功' : '添加管理员成功')
        dialogVisible.value = false
        await fetchAdmins()
      } catch (error) {
        ElMessage.error(error.message || '操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const confirmDelete = async () => {
  if (!currentAdmin.value) return
  
  deleting.value = true
  try {
    const response = await del(`/api/admins/${currentAdmin.value.id}`)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '删除失败')
    }
    
    ElMessage.success('删除成功')
    deleteDialogVisible.value = false
    await fetchAdmins()
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

// 表格选择变化处理
const handleSelectionChange = (selection) => {
  selectedAdmins.value = selection
}

// 批量删除处理
const handleBatchDelete = () => {
  if (selectedAdmins.value.length === 0) return
  batchDeleteDialogVisible.value = true
}

// 确认批量删除
const confirmBatchDelete = async () => {
  if (selectedAdmins.value.length === 0) return
  
  // 过滤掉当前登录用户和系统中唯一的管理员（如果只有一个）
  const adminsToDelete = selectedAdmins.value.filter(admin => 
    admin.username !== currentUsername.value && 
    (admins.value.length > 1)
  )
  
  if (adminsToDelete.length === 0) {
    ElMessage.warning('没有可删除的管理员')
    batchDeleteDialogVisible.value = false
    return
  }
  
  batchDeleting.value = true
  try {
    // 创建一个包含所有删除请求的Promise数组
    const deletePromises = adminsToDelete.map(admin => 
      del(`/api/admins/${admin.id}`).then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || `删除管理员 ${admin.username} 失败`)
          })
        }
        return true
      })
    )
    
    // 使用Promise.allSettled确保所有请求都被处理，无论成功或失败
    const results = await Promise.allSettled(deletePromises)
    
    // 计算成功和失败的数量
    const succeeded = results.filter(r => r.status === 'fulfilled').length
    const failed = results.length - succeeded
    
    if (failed > 0) {
      ElMessage.warning(`删除完成: ${succeeded} 成功, ${failed} 失败`)
    } else {
      ElMessage.success('批量删除成功')
    }
    
    batchDeleteDialogVisible.value = false
    await fetchAdmins()
  } catch (error) {
    ElMessage.error(error.message || '批量删除失败')
  } finally {
    batchDeleting.value = false
  }
}
</script>

<style scoped>
.admins-container {
  padding: 20px;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
  padding: 15px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.page-header:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.page-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.page-title h2 {
  margin: 0;
  background: linear-gradient(90deg, #409EFF, #9254de);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 600;
}

.page-actions {
  display: flex;
  gap: 10px;
}

.page-actions .el-button {
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.page-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

/* 表格样式优化 */
.el-table {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.el-table th {
  background-color: #f5f7fa !important;
}

.el-table--striped .el-table__body tr.el-table__row--striped td {
  background-color: #fafafa;
}

.el-table .el-table__row {
  transition: all 0.3s ease;
}

.el-table .el-table__row:hover > td {
  background-color: #ecf5ff !important;
}

/* 对话框样式 */
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
  padding: 20px;
  margin: 0;
}

:deep(.el-dialog__title) {
  font-weight: 600;
  background: linear-gradient(90deg, #409EFF, #9254de);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

:deep(.el-dialog__body) {
  padding: 30px 20px;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #ebeef5;
  padding: 15px 20px;
  background-color: #f9fafc;
}

/* 表单样式 */
:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__wrapper) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__wrapper:hover) {
  box-shadow: 0 0 0 1px #409EFF inset;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .admins-container {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
  }
  
  .page-actions {
    width: 100%;
    justify-content: space-between;
    margin-top: 10px;
  }
  
  .el-table {
    width: 100%;
    overflow-x: auto;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
}
</style>