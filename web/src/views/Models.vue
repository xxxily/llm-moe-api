<template>
  <div class="models-container">
    <div class="page-header">
      <div class="page-title">
        <h2>模型配置管理</h2>
        <div class="view-toggle">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="card">
              <el-icon><Grid /></el-icon>
            </el-radio-button>
            <el-radio-button label="table">
              <el-icon><List /></el-icon>
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>
      <div class="page-actions">
        <el-button type="primary" @click="handleAdd">添加模型</el-button>
        <el-button 
          type="danger" 
          :disabled="selectedModels.length === 0" 
          @click="handleBatchDelete"
        >批量删除</el-button>
      </div>
    </div>

    <!-- 表格视图 -->
    <div v-if="viewMode === 'table'">
      <el-table 
        :data="models" 
        style="width: 100%" 
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="modelId" label="模型ID" min-width="180" />
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="baseUrl" label="API地址" min-width="200" show-overflow-tooltip />
        <el-table-column label="优先级" width="100">
          <template #default="scope">
            <el-tag>{{ scope.row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="是否启用" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.isActive ? 'success' : 'danger'">
              {{ scope.row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="默认" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.isDefault" type="warning">默认</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="success" @click="handleCopy(scope.row)">复制</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(scope.row)"
              :disabled="scope.row.isDefault"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 卡片视图 -->
    <div v-else class="card-view">
      <el-row :gutter="20">
        <el-col 
          v-for="model in models" 
          :key="model.modelId" 
          :xs="24" 
          :sm="12" 
          :md="8" 
          :lg="6" 
          :xl="4"
          class="card-col"
        >
          <el-card class="model-card" :body-style="{ padding: '0px' }">
            <div class="card-header">
              <el-checkbox 
                v-model="model.selected" 
                @change="updateSelectedModels"
                :disabled="model.isDefault"
              ></el-checkbox>
              <span class="model-name" @click="toggleModelSelection(model)">{{ model.name }}</span>
              <el-tag v-if="model.isDefault" type="warning" size="small">默认</el-tag>
            </div>
            <div class="card-content">
              <p class="model-id"><strong>ID:</strong> {{ model.modelId }}</p>
              <p class="model-desc">{{ model.description }}</p>
              <div class="model-tags">
                <el-tag :type="model.isActive ? 'success' : 'danger'" size="small">
                  {{ model.isActive ? '启用' : '禁用' }}
                </el-tag>
                <el-tag size="small">优先级: {{ model.priority }}</el-tag>
              </div>
            </div>
            <div class="card-actions">
              <el-button size="small" @click="handleEdit(model)">编辑</el-button>
              <el-button size="small" type="success" @click="handleCopy(model)">复制</el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="handleDelete(model)"
                :disabled="model.isDefault"
              >删除</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 模型表单对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑模型' : '添加模型'"
      width="50%"
      :fullscreen="isMobile"
    >
      <el-form 
        :model="modelForm" 
        :rules="rules" 
        ref="modelFormRef" 
        label-width="100px"
      >
        <el-form-item label="模型ID" prop="modelId" :disabled="isEdit">
          <el-input v-model="modelForm.modelId" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="modelForm.name" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="modelForm.description" type="textarea" />
        </el-form-item>
        <el-form-item label="API地址" prop="baseUrl">
          <el-input v-model="modelForm.baseUrl" />
        </el-form-item>
        <el-form-item label="API密钥" prop="apiKey">
          <el-input v-model="modelForm.apiKey" show-password />
        </el-form-item>
        <el-form-item label="系统提示词" prop="prompt">
          <el-input v-model="modelForm.prompt" type="textarea" rows="4" />
        </el-form-item>
        <el-form-item label="能力描述" prop="capabilities">
          <el-select
            v-model="capabilitiesArray"
            multiple
            filterable
            allow-create
            default-first-option
            style="width: 100%"
            placeholder="请选择或输入模型能力"
          >
            <el-option
              v-for="item in capabilityOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input-number v-model="modelForm.priority" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="是否启用" prop="isActive">
          <el-switch v-model="modelForm.isActive" />
        </el-form-item>
        <el-form-item label="设为默认" prop="isDefault">
          <el-switch v-model="modelForm.isDefault" />
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
      <p>确定要删除模型 "{{ currentModel?.name }}" 吗？此操作不可恢复。</p>
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
      <p>确定要删除选中的 {{ selectedModels.length }} 个模型吗？此操作不可恢复。</p>
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Grid, List } from '@element-plus/icons-vue'
import { useWindowSize } from '@vueuse/core'
import { get, post, put, del } from '../utils/request.js'

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

const models = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const batchDeleteDialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const batchDeleting = ref(false)
const currentModel = ref(null)
const modelFormRef = ref(null)
const viewMode = ref('card') // 默认使用卡片视图
const selectedModels = ref([])

const capabilityOptions = [
  '复杂问题推理',
  '创意写作',
  '代码生成与评审',
  '深度分析',
  '日常对话',
  '简单问题解答',
  '信息查询',
  '基础创作',
  '深度内容理解与分析',
  '长文本处理',
  '学术写作',
  '多轮对话'
]

const modelForm = reactive({
  modelId: '',
  name: '',
  description: '',
  baseUrl: '',
  apiKey: '',
  prompt: '',
  capabilities: '',
  priority: 0,
  isActive: true,
  isDefault: false
})

const capabilitiesArray = computed({
  get: () => {
    try {
      return modelForm.capabilities ? JSON.parse(modelForm.capabilities) : []
    } catch (e) {
      return []
    }
  },
  set: (val) => {
    modelForm.capabilities = JSON.stringify(val)
  }
})

const rules = {
  modelId: [
    { required: true, message: '请输入模型ID', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9-]+$/, message: '模型ID只能包含字母、数字和连字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入描述', trigger: 'blur' }
  ],
  baseUrl: [
    { required: true, message: '请输入API地址', trigger: 'blur' },
    { pattern: /^https?:\/\//, message: 'API地址必须以http://或https://开头', trigger: 'blur' }
  ],
  apiKey: [
    { required: true, message: '请输入API密钥', trigger: 'blur' }
  ],
  // priority: [
  //   { required: true, message: '请输入优先级', trigger: 'blur' }
  // ]
}

onMounted(async () => {
  await fetchModels()
})

// 监听窗口大小变化，在移动端自动切换到卡片视图
watch(() => isMobile.value, (newVal) => {
  if (newVal && viewMode.value === 'table') {
    viewMode.value = 'card'
  }
})

const fetchModels = async () => {
  loading.value = true
  try {
    const response = await get('/api/models') // 这个API现在会返回所有模型，包括禁用的
    if (!response.ok) throw new Error('获取模型列表失败')
    const data = await response.json()
    // 为每个模型添加selected属性用于卡片视图的选择
    models.value = data.map(model => ({
      ...model,
      selected: false
    }))
  } catch (error) {
    ElMessage.error('获取模型列表失败')
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
  currentModel.value = row
  Object.keys(modelForm).forEach(key => {
    modelForm[key] = row[key]
  })
  dialogVisible.value = true
}

const handleDelete = (row) => {
  currentModel.value = row
  deleteDialogVisible.value = true
}

const resetForm = () => {
  if (modelFormRef.value) {
    modelFormRef.value.resetFields()
  }
  Object.assign(modelForm, {
    modelId: '',
    name: '',
    description: '',
    baseUrl: '',
    apiKey: '',
    prompt: '',
    capabilities: '[]',
    priority: 0,
    isActive: true,
    isDefault: false
  })
}

const submitForm = async () => {
  if (!modelFormRef.value) return
  
  await modelFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const url = isEdit.value 
          ? `/api/models/${modelForm.modelId}` 
          : '/api/models'
        
        const method = isEdit.value ? put : post
        const response = await method(url, modelForm)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '操作失败')
        }
        
        ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
        dialogVisible.value = false
        await fetchModels()
      } catch (error) {
        ElMessage.error(error.message || '操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const confirmDelete = async () => {
  if (!currentModel.value) return
  
  deleting.value = true
  try {
    // 添加查询参数permanent=true表示彻底删除
    const response = await del(`/api/models/${currentModel.value.modelId}?permanent=true`)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '删除失败')
    }
    
    ElMessage.success('删除成功')
    deleteDialogVisible.value = false
    await fetchModels()
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

// 表格视图的选择变化处理
const handleSelectionChange = (selection) => {
  selectedModels.value = selection
}

// 卡片视图的选择变化处理
const updateSelectedModels = () => {
  selectedModels.value = models.value.filter(model => model.selected)
}

// 添加新方法
const toggleModelSelection = (model) => {
  if (!model.isDefault) {
    model.selected = !model.selected
    updateSelectedModels()
  }
}

// 批量删除处理
const handleBatchDelete = () => {
  if (selectedModels.value.length === 0) return
  batchDeleteDialogVisible.value = true
}

// 确认批量删除
const confirmBatchDelete = async () => {
  if (selectedModels.value.length === 0) return
  
  batchDeleting.value = true
  try {
    const deletePromises = selectedModels.value.map(model => 
      // 添加查询参数permanent=true表示彻底删除
      del(`/api/models/${model.modelId}?permanent=true`).then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || `删除模型 ${model.name} 失败`)
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
    await fetchModels()
  } catch (error) {
    ElMessage.error(error.message || '批量删除失败')
  } finally {
    batchDeleting.value = false
  }
}

// 处理复制模型
const handleCopy = (row) => {
  isEdit.value = false
  resetForm()
  
  // 复制原模型的所有属性到表单
  Object.keys(modelForm).forEach(key => {
    if (key !== 'modelId' && key !== 'isDefault') {
      modelForm[key] = row[key]
    }
  })
  
  // 生成新的模型ID，格式为：原ID-copy-随机数
  const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  modelForm.modelId = `${row.modelId}-copy-${randomSuffix}`
  
  // 默认不设为默认模型
  modelForm.isDefault = false
  
  // 打开对话框
  dialogVisible.value = true
}
</script>

<style scoped>
.models-container {
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

.view-toggle .el-radio-button {
  transition: all 0.3s ease;
}

.view-toggle .el-radio-button:hover {
  transform: scale(1.05);
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

/* 卡片视图样式 */
.card-view {
  margin-top: 20px;
}

.card-col {
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.card-col:hover {
  transform: translateY(-5px);
}

.model-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: none;
}

.model-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #ebeef5;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
}

.model-name {
  flex: 1;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
  cursor: pointer;
}

.model-name:hover {
  color: #409EFF;
  text-decoration: underline;
}

.card-content {
  padding: 15px;
  flex: 1;
  background-color: #fff;
}

.model-id {
  font-size: 14px;
  color: #606266;
  margin-top: 0;
  padding: 4px 0;
}

.model-desc {
  font-size: 14px;
  color: #606266;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 42px;
  line-height: 21px;
  min-height: 42px;
  padding: 4px 0;
  border-bottom: 1px dashed #ebeef5;
}

.model-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.model-tags .el-tag {
  border-radius: 16px;
  padding: 0 10px;
  transition: all 0.3s ease;
}

.model-tags .el-tag:hover {
  transform: scale(1.05);
}

.card-actions {
  padding: 10px 15px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #ebeef5;
  background-color: #f9fafc;
}

.card-actions .el-button {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.card-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

:deep(.el-select__wrapper) {
  border-radius: 8px;
}

:deep(.el-select-dropdown__item) {
  transition: all 0.2s ease;
}

:deep(.el-select-dropdown__item.hover) {
  background-color: #ecf5ff;
}

:deep(.el-select-dropdown__item.selected) {
  background-color: #409EFF;
  color: #fff;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .models-container {
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