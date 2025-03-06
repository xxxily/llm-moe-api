<template>
  <div class="system-config-container">
    <div class="page-header">
      <div class="page-title">
        <h2>系统配置</h2>
      </div>
    </div>

    <!-- 配置分类选择 -->
    <div class="category-tabs">
      <el-tabs v-model="activeCategory" @tab-click="handleCategoryChange">
        <el-tab-pane label="选择器配置" name="selector"></el-tab-pane>
        <el-tab-pane label="系统配置" name="system"></el-tab-pane>
        <el-tab-pane label="LLM提供商配置" name="llm"></el-tab-pane>
        <el-tab-pane label="Agent配置" name="agent"></el-tab-pane>
      </el-tabs>
    </div>

    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>{{ getCategoryTitle() }}</span>
          <el-button type="primary" @click="handleSave" :loading="saving">
            保存更改
          </el-button>
        </div>
      </template>

      <div v-loading="loading">
        <el-form label-width="200px">
          <!-- 动态渲染配置项 -->
          <div v-for="config in configItems" :key="config.key">
            <!-- 布尔类型配置 -->
            <el-form-item :label="config.description">
              <el-switch 
                v-if="config.type === 'boolean'"
                v-model="configs[config.key]"
                :active-value="true"
                :inactive-value="false"
              />
              
              <!-- 文本类型配置 -->
              <el-input
                v-else-if="config.type === 'text'"
                v-model="configs[config.key]"
                :type="config.key.includes('prompt') || config.key.includes('SECRET') ? 'textarea' : 'text'"
                :rows="config.key.includes('prompt') ? 6 : 1"
                :placeholder="`请输入${config.description}`"
                :show-password="config.key.includes('KEY') || config.key.includes('SECRET')"
              />
              
              <!-- 数字类型配置 -->
              <el-input-number
                v-else-if="config.type === 'number'"
                v-model="configs[config.key]"
                :min="0"
                controls-position="right"
              />
              
              <!-- JSON类型配置 -->
              <el-input
                v-else-if="config.type === 'json'"
                v-model="configs[config.key]"
                type="textarea"
                :rows="6"
                :placeholder="`请输入JSON格式的${config.description}`"
              />
            </el-form-item>
          </div>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { get, put } from '../utils/request'

const loading = ref(false)
const saving = ref(false)
const activeCategory = ref('selector')
const configItems = ref([])

// 配置数据
const configs = reactive({})

// 获取当前分类标题
const getCategoryTitle = () => {
  switch (activeCategory.value) {
    case 'selector': return '选择器配置';
    case 'agent': return 'Agent配置';
    case 'system': return '系统配置';
    case 'llm': return 'LLM提供商API密钥';
    default: return '配置';
  }
}

// 处理分类切换
const handleCategoryChange = () => {
  fetchConfigs()
}

// 获取配置
const fetchConfigs = async () => {
  loading.value = true
  try {
    const response = await get(`/api/configs?category=${activeCategory.value}`)
    if (!response.ok) throw new Error('获取配置失败')
    const data = await response.json()
    
    // 保存配置项定义
    configItems.value = data
    
    // 重置配置值对象
    Object.keys(configs).forEach(key => {
      delete configs[key]
    })
    
    // 更新配置值
    data.forEach(config => {
      if (config.type === 'boolean') {
        configs[config.key] = config.value === 'true'
      } else if (config.type === 'number') {
        configs[config.key] = Number(config.value)
      } else if (config.type === 'json') {
        try {
          configs[config.key] = config.value
        } catch {
          configs[config.key] = config.value
        }
      } else {
        configs[config.key] = config.value
      }
    })
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

// 保存配置
const handleSave = async () => {
  saving.value = true
  try {
    const savePromises = Object.entries(configs).map(([key, value]) => {
      // 对JSON类型进行特殊处理
      const configItem = configItems.value.find(item => item.key === key)
      let valueToSave = value
      
      if (configItem && configItem.type === 'json') {
        try {
          // 验证JSON格式是否正确
          JSON.parse(value)
        } catch (e) {
          throw new Error(`${key} 的JSON格式不正确`)
        }
      }
      
      return put(`/api/configs/${key}`, { value: String(valueToSave) })
    })
    
    await Promise.all(savePromises)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchConfigs()
})
</script>

<style scoped>
.system-config-container {
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

.category-tabs {
  margin-bottom: 20px;
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

.config-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: none;
}

.config-card:hover {
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

/* 响应式样式 */
@media (max-width: 768px) {
  .system-config-container {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
  }
}
</style>