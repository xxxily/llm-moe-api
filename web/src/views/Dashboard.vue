<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <!-- 使用响应式栅格布局 -->
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8" class="dashboard-col">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>模型配置</span>
              <el-tag type="success">{{ stats.models }}</el-tag>
            </div>
          </template>
          <div class="card-content">
            <el-statistic title="活跃模型" :value="stats.activeModels" />
            <el-divider />
            <el-button type="primary" @click="$router.push('/models')">管理模型</el-button>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8" class="dashboard-col">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>Agent配置</span>
              <el-tag type="success">{{ stats.agents }}</el-tag>
            </div>
          </template>
          <div class="card-content">
            <el-statistic title="活跃Agent" :value="stats.activeAgents" />
            <el-divider />
            <el-button type="primary" @click="$router.push('/agents')">管理Agent</el-button>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8" class="dashboard-col">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>管理员账户</span>
              <el-tag type="success">{{ stats.admins }}</el-tag>
            </div>
          </template>
          <div class="card-content">
            <el-statistic title="最近登录" :value="stats.lastLogin" />
            <el-divider />
            <el-button type="primary" @click="$router.push('/admins')">管理账户</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>系统信息</span>
            </div>
          </template>
          <el-descriptions :column="descriptionColumns" border>
            <el-descriptions-item label="系统名称">LLM MOE API 智能选择系统</el-descriptions-item>
            <el-descriptions-item label="版本">{{ version }}</el-descriptions-item>
            <el-descriptions-item label="运行环境">Node.js</el-descriptions-item>
            <el-descriptions-item label="数据库">SQLite</el-descriptions-item>
            <el-descriptions-item label="默认模型">{{ defaultModel }}</el-descriptions-item>
            <el-descriptions-item label="默认Agent">{{ defaultAgent }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useWindowSize } from '@vueuse/core'
import { get } from '../utils/request.js'

const { width } = useWindowSize()

// 根据窗口宽度计算描述列表的列数
const descriptionColumns = computed(() => {
  if (width.value < 768) return 1
  if (width.value < 992) return 2
  return 3
})

const stats = ref({
  models: 0,
  activeModels: 0,
  agents: 0,
  activeAgents: 0,
  admins: 0,
  lastLogin: '-'
})

const version = ref('0.0.1')
const defaultModel = ref('-')
const defaultAgent = ref('-')
const loading = ref(false) // 添加loading变量

onMounted(async () => {
  await fetchStats()
})

const fetchStats = async () => {
  loading.value = true
  try {
    // 获取模型统计
    const modelsRes = await get('/api/models')
    if (modelsRes.ok) {
      const modelsData = await modelsRes.json()
      stats.value.models = modelsData.length
      stats.value.activeModels = modelsData.filter(m => m.isActive).length
    }

    // 获取Agent统计
    const agentsRes = await get('/api/agents')
    if (agentsRes.ok) {
      const agentsData = await agentsRes.json()
      stats.value.agents = agentsData.length
      stats.value.activeAgents = agentsData.filter(a => a.isActive).length
    }

    // 获取默认模型
    try {
      const defaultModelRes = await get('/api/models/default')
      if (defaultModelRes.ok) {
        const defaultModelData = await defaultModelRes.json()
        defaultModel.value = defaultModelData.name || defaultModelData.modelId || '-'
      }
    } catch (error) {
      defaultModel.value = '-'
      console.error('获取默认模型失败', error)
    }

    // 获取默认Agent
    try {
      const defaultAgentRes = await get('/api/agents/default')
      if (defaultAgentRes.ok) {
        const defaultAgentData = await defaultAgentRes.json()
        defaultAgent.value = defaultAgentData.name || defaultAgentData.agentId || '-'
      }
    } catch (error) {
      defaultAgent.value = '-'
      console.error('获取默认Agent失败', error)
    }

    // 获取请求统计
    try {
      const requestsRes = await get('/api/stats/requests')
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json()
        stats.value.totalRequests = requestsData.total || 0
        stats.value.todayRequests = requestsData.today || 0
      } else {
        // 如果API不存在，使用模拟数据
        stats.value.totalRequests = 0
        stats.value.todayRequests = 0
      }
    } catch (error) {
      // 如果API不存在，使用模拟数据
      stats.value.totalRequests = 0
      stats.value.todayRequests = 0
    }

    // 获取管理员统计
    try {
      const adminsRes = await get('/admin/stats')
      if (adminsRes.ok) {
        const adminStats = await adminsRes.json()
        stats.value.admins = adminStats.count || 1
        stats.value.lastLogin = adminStats.lastLogin || new Date().toLocaleString()
      } else {
        // 如果API不存在，使用模拟数据
        stats.value.admins = 1
        stats.value.lastLogin = new Date().toLocaleString()
      }
    } catch (error) {
      // 如果API不存在，使用模拟数据
      stats.value.admins = 1
      stats.value.lastLogin = new Date().toLocaleString()
    }
  } catch (error) {
    ElMessage.error('获取统计数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.dashboard-col {
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.dashboard-col:hover {
  transform: translateY(-5px);
}

.dashboard-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: none;
  height: 100%;
}

.dashboard-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

:deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(90deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.card-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

:deep(.el-statistic__head) {
  margin-bottom: 5px;
  color: #606266;
}

:deep(.el-statistic__content) {
  color: #303133;
  font-size: 28px;
  font-weight: 600;
}

:deep(.el-statistic__value) {
  background: linear-gradient(90deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 36px;
  font-weight: 700;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

:deep(.el-divider) {
  margin: 15px 0;
  width: 100%;
}

.card-content .el-button {
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  margin-top: 10px;
}

.card-content .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 响应式样式 */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 10px;
  }
  
  .dashboard-col {
    margin-bottom: 15px;
  }
  
  :deep(.el-card__header) {
    padding: 12px 15px;
  }
  
  .card-header span {
    font-size: 16px;
  }
  
  .card-content {
    padding: 15px;
  }
  
  :deep(.el-statistic__content) {
    font-size: 24px;
  }
  
  :deep(.el-statistic__value) {
    font-size: 30px;
  }
}
</style>