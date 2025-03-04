<template>
  <div class="agents-container">
    <div class="page-header">
      <div class="page-title">
        <h2>Agent配置管理</h2>
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
        <el-button type="primary" @click="handleAdd">添加Agent</el-button>
        <el-button 
          type="danger" 
          :disabled="selectedAgents.length === 0" 
          @click="handleBatchDelete"
        >批量删除</el-button>
      </div>
    </div>

    <!-- 表格视图 -->
    <div v-if="viewMode === 'table'">
      <el-table 
        :data="agents" 
        style="width: 100%" 
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="agentId" label="Agent ID" min-width="180" />
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="modelId" label="使用模型" min-width="150">
          <template #default="scope">
            <el-tag v-if="scope.row.modelId">{{ scope.row.modelId }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="100">
          <template #default="scope">
            <el-tag>{{ scope.row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
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
          v-for="agent in agents" 
          :key="agent.agentId" 
          :xs="24" 
          :sm="12" 
          :md="8" 
          :lg="6" 
          :xl="4"
          class="card-col"
        >
          <el-card class="agent-card" :body-style="{ padding: '0px' }">
            <div class="card-header">
              <el-checkbox 
                v-model="agent.selected" 
                @change="updateSelectedAgents"
                :disabled="agent.isDefault"
              ></el-checkbox>
              <span class="agent-name" @click="toggleAgentSelection(agent)" :class="{ 'clickable': !agent.isDefault }">
                {{ agent.name }}
              </span>
              <el-tag v-if="agent.isDefault" type="warning" size="small">默认</el-tag>
            </div>
            <div class="card-content">
              <p class="agent-id"><strong>ID:</strong> {{ agent.agentId }}</p>
              <p class="agent-desc">{{ agent.description }}</p>
              <p class="agent-model"><strong>模型:</strong> {{ agent.modelId || '-' }}</p>
              <div class="agent-tags">
                <el-tag :type="agent.isActive ? 'success' : 'danger'" size="small">
                  {{ agent.isActive ? '启用' : '禁用' }}
                </el-tag>
                <el-tag size="small">优先级: {{ agent.priority }}</el-tag>
              </div>
            </div>
            <div class="card-actions">
              <el-button size="small" @click="handleEdit(agent)">编辑</el-button>
              <el-button size="small" type="success" @click="handleCopy(agent)">复制</el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="handleDelete(agent)"
                :disabled="agent.isDefault"
              >删除</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Agent表单对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑Agent' : '添加Agent'"
      width="50%"
      :fullscreen="isMobile"
    >
      <el-form 
        :model="agentForm" 
        :rules="rules" 
        ref="agentFormRef" 
        label-width="100px"
      >
        <el-form-item label="Agent ID" prop="agentId" :disabled="isEdit">
          <el-input v-model="agentForm.agentId" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="agentForm.name" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="agentForm.description" type="textarea" />
        </el-form-item>
        <el-form-item label="系统提示词" prop="systemPrompt">
          <el-input v-model="agentForm.systemPrompt" type="textarea" rows="4" />
        </el-form-item>
        <el-form-item label="使用模型" prop="modelId">
          <el-select v-model="agentForm.modelId" placeholder="请选择模型" style="width: 100%">
            <el-option
              v-for="model in models"
              :key="model.modelId"
              :label="model.name"
              :value="model.modelId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="温度" prop="temperature">
          <el-slider v-model="agentForm.temperature" :min="0" :max="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="Top P" prop="topP">
          <el-slider v-model="agentForm.topP" :min="0" :max="1" :step="0.01" />
        </el-form-item>
        <el-form-item label="最大Token" prop="maxTokens">
          <el-input-number v-model="agentForm.maxTokens" :min="100" :max="16000" :step="100" />
        </el-form-item>
        <el-form-item label="能力描述" prop="capabilities">
          <el-select
            v-model="capabilitiesArray"
            multiple
            filterable
            allow-create
            default-first-option
            style="width: 100%"
            placeholder="请选择或输入Agent能力"
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
          <el-input-number v-model="agentForm.priority" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="API密钥" prop="apiKey">
          <el-input v-model="agentForm.apiKey" show-password placeholder="留空则使用模型配置的API密钥" />
        </el-form-item>
        <el-form-item label="是否启用" prop="isActive">
          <el-switch v-model="agentForm.isActive" />
        </el-form-item>
        <el-form-item label="设为默认" prop="isDefault">
          <el-switch v-model="agentForm.isDefault" />
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
      <p>确定要删除Agent "{{ currentAgent?.name }}" 吗？此操作不可恢复。</p>
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
      <p>确定要删除选中的 {{ selectedAgents.length }} 个Agent吗？此操作不可恢复。</p>
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

const agents = ref([])
const models = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const batchDeleteDialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const batchDeleting = ref(false)
const currentAgent = ref(null)
const agentFormRef = ref(null)
const viewMode = ref('card') // 默认使用卡片视图
const selectedAgents = ref([])

const capabilityOptions = [
  '日常对话',
  '一般问题解答',
  '信息查询',
  '代码生成',
  '代码审查',
  '编程问题解答',
  '技术文档编写',
  '创意写作',
  '故事创作',
  '内容生成',
  '文案撰写'
]

const agentForm = reactive({
  agentId: '',
  name: '',
  description: '',
  systemPrompt: '',
  modelId: '',
  temperature: 0.7,
  topP: 1.0,
  maxTokens: 2000,
  capabilities: '',
  priority: 0,
  apiKey: '',
  isActive: true,
  isDefault: false
})

const capabilitiesArray = computed({
  get: () => {
    try {
      return agentForm.capabilities ? JSON.parse(agentForm.capabilities) : []
    } catch (e) {
      return []
    }
  },
  set: (val) => {
    agentForm.capabilities = JSON.stringify(val)
  }
})

const rules = {
  agentId: [
    { required: true, message: '请输入Agent ID', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9-]+$/, message: 'Agent ID只能包含字母、数字和连字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入描述', trigger: 'blur' }
  ],
  // 移除必填规则
  modelId: [],
  temperature: [],
  topP: [],
  priority: []
}

onMounted(async () => {
  await Promise.all([fetchAgents(), fetchModels()])
})

// 监听窗口大小变化，在移动端自动切换到卡片视图
watch(() => isMobile.value, (newVal) => {
  if (newVal && viewMode.value === 'table') {
    viewMode.value = 'card'
  }
})

const fetchAgents = async () => {
  loading.value = true
  try {
    const response = await get('/api/agents') // 这个API现在会返回所有Agent，包括禁用的
    if (!response.ok) throw new Error('获取Agent列表失败')
    const data = await response.json()
    // 为每个Agent添加selected属性用于卡片视图的选择
    agents.value = data.map(agent => ({
      ...agent,
      selected: false
    }))
  } catch (error) {
    ElMessage.error('获取Agent列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchModels = async () => {
  try {
    const response = await get('/api/models')
    if (!response.ok) throw new Error('获取模型列表失败')
    const data = await response.json()
    models.value = data.map(model => ({
      modelId: model.modelId,
      name: `${model.name} (${model.modelId})`
    }))
  } catch (error) {
    ElMessage.error('获取模型列表失败')
    console.error(error)
  }
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentAgent.value = row
  Object.keys(agentForm).forEach(key => {
    agentForm[key] = row[key]
  })
  dialogVisible.value = true
}

const handleDelete = (row) => {
  currentAgent.value = row
  deleteDialogVisible.value = true
}

const resetForm = () => {
  if (agentFormRef.value) {
    agentFormRef.value.resetFields()
  }
  Object.assign(agentForm, {
    agentId: '',
    name: '',
    description: '',
    systemPrompt: '',
    modelId: '',
    temperature: 0.7,
    topP: 1.0,
    maxTokens: 2000,
    capabilities: '[]',
    priority: 0,
    apiKey: '',
    isActive: true,
    isDefault: false
  })
}

// 修改提交表单
const submitForm = async () => {
  if (!agentFormRef.value) return
  
  await agentFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const url = isEdit.value 
          ? `/api/agents/${agentForm.agentId}` 
          : '/api/agents'
        
        const method = isEdit.value ? put : post
        const response = await method(url, agentForm)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '操作失败')
        }
        
        ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
        dialogVisible.value = false
        await fetchAgents()
      } catch (error) {
        ElMessage.error(error.message || '操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

// 修改删除确认
const confirmDelete = async () => {
  if (!currentAgent.value) return
  
  deleting.value = true
  try {
    // 添加查询参数permanent=true表示彻底删除
    const response = await del(`/api/agents/${currentAgent.value.agentId}?permanent=true`)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '删除失败')
    }
    
    ElMessage.success('删除成功')
    deleteDialogVisible.value = false
    await fetchAgents()
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

// 表格视图的选择变化处理
const handleSelectionChange = (selection) => {
  selectedAgents.value = selection
}

// 卡片视图的选择变化处理
const updateSelectedAgents = () => {
  selectedAgents.value = agents.value.filter(agent => agent.selected)
}

// 点击agent名称切换选择状态
const toggleAgentSelection = (agent) => {
  if (!agent.isDefault) {
    agent.selected = !agent.selected
    updateSelectedAgents()
  }
}

// 批量删除处理
const handleBatchDelete = () => {
  if (selectedAgents.value.length === 0) return
  batchDeleteDialogVisible.value = true
}

// 确认批量删除
const confirmBatchDelete = async () => {
  if (selectedAgents.value.length === 0) return
  
  batchDeleting.value = true
  try {
    // 使用del函数而不是直接使用fetch，保持一致性
    const deletePromises = selectedAgents.value.map(agent => 
      // 添加查询参数permanent=true表示彻底删除
      del(`/api/agents/${agent.agentId}?permanent=true`).then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || `删除Agent ${agent.name} 失败`)
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
    await fetchAgents()
  } catch (error) {
    ElMessage.error(error.message || '批量删除失败')
  } finally {
    batchDeleting.value = false
  }
}

// 添加复制功能处理函数
const handleCopy = (row) => {
  isEdit.value = false
  resetForm()
  
  // 复制原始Agent的所有属性
  Object.keys(agentForm).forEach(key => {
    // 对于agentId特殊处理，确保唯一性
    if (key === 'agentId') {
      agentForm[key] = `${row[key]}-copy`
    } 
    // 对于isDefault特殊处理，复制的Agent不应该默认为默认Agent
    else if (key === 'isDefault') {
      agentForm[key] = false
    }
    // 其他属性直接复制
    else {
      agentForm[key] = row[key]
    }
  })
  
  // 打开对话框
  dialogVisible.value = true
}
</script>

<style scoped>
.agents-container {
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
  background: linear-gradient(90deg, #409EFF, #67C23A);
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

.agent-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 220px; /* 设置最小高度确保卡片一致 */
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: none;
}

.agent-card:hover {
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

.agent-name {
  flex: 1;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  color: #409EFF;
  text-decoration: underline;
}

.card-content {
  padding: 15px;
  flex: 1;
  background-color: #fff;
}

.agent-id {
  font-size: 14px;
  color: #606266;
  margin-top: 0;
  padding: 4px 0;
}

.agent-desc {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 限制为2行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 42px; /* 确保即使内容不足也有2行高度 */
  line-height: 21px; /* 行高设置 */
  padding: 4px 0;
  border-bottom: 1px dashed #ebeef5;
}

.agent-model {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
  padding: 4px 0;
}

.agent-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.agent-tags .el-tag {
  border-radius: 16px;
  padding: 0 10px;
  transition: all 0.3s ease;
}

.agent-tags .el-tag:hover {
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
  background: linear-gradient(90deg, #409EFF, #67C23A);
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

:deep(.el-slider__runway) {
  margin: 16px 0;
}

:deep(.el-slider__bar) {
  background-color: #409EFF;
}

:deep(.el-slider__button) {
  border: 2px solid #409EFF;
  transition: transform 0.3s ease;
}

:deep(.el-slider__button:hover) {
  transform: scale(1.2);
}

/* 响应式样式 */
@media (max-width: 768px) {
  .agents-container {
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