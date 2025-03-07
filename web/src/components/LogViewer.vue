<template>
  <div class="log-viewer">
    <div class="log-header">
      <h3>服务器日志</h3>
      <div class="log-controls">
        <el-switch
          v-model="autoRefresh"
          active-text="自动刷新"
          inactive-text="手动刷新"
        />
        <el-button type="primary" size="small" @click="fetchLogs" :loading="loading">
          刷新
        </el-button>
        <el-button type="danger" size="small" @click="clearLogs">
          清空
        </el-button>
      </div>
    </div>
    <div class="log-container" ref="logContainer">
      <div v-if="logs.length === 0" class="no-logs">
        暂无日志
      </div>
      <div v-for="(log, index) in logs" :key="index" class="log-entry">
        <div class="log-timestamp">{{ formatTime(log.timestamp) }}</div>
        <div class="log-message" v-html="formatLogMessage(log.message)"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { get } from '../utils/request'

const logs = ref([])
const loading = ref(false)
const autoRefresh = ref(true)
const logContainer = ref(null)
let refreshInterval = null
const ws = ref(null)
const wsConnected = ref(false)

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

// 格式化日志消息，添加颜色
const formatLogMessage = (message) => {
  // 替换控制台颜色代码为HTML样式
  let formattedMessage = message
    .replace(/\[(\d+)m/g, '') // 移除ANSI颜色代码
  
  // 为不同类型的日志添加颜色
  if (message.includes('[请求]')) {
    formattedMessage = `<span style="color: #409EFF">${formattedMessage}</span>`
  } else if (message.includes('[响应]')) {
    formattedMessage = `<span style="color: #67C23A">${formattedMessage}</span>`
  } else if (message.includes('[错误]') || message.includes('error')) {
    formattedMessage = `<span style="color: #F56C6C">${formattedMessage}</span>`
  } else if (message.includes('[警告]') || message.includes('warning')) {
    formattedMessage = `<span style="color: #E6A23C">${formattedMessage}</span>`
  }
  
  return formattedMessage
}

// 滚动到底部
const scrollToBottom = () => {
  setTimeout(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  }, 100)
}

// 获取日志
const fetchLogs = async () => {
  if (loading.value || wsConnected.value) return
  
  loading.value = true
  try {
    const response = await get('/api/logs?limit=200')
    
    if (!response.ok) {
      throw new Error('获取日志失败')
    }
    
    const data = await response.json()
    logs.value = data
    
    scrollToBottom()
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

// 清空日志显示
const clearLogs = () => {
  logs.value = []
}

// 设置自动刷新
watch(autoRefresh, (newVal) => {
  if (newVal && !wsConnected.value) {
    refreshInterval = setInterval(fetchLogs, 5000) // 每5秒刷新一次
  } else if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

// 连接WebSocket
const connectWebSocket = () => {
  // 根据当前URL构建WebSocket URL
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  ws.value = new WebSocket(wsUrl);
  
  ws.value.onopen = () => {
    console.log('WebSocket连接已建立');
    wsConnected.value = true;
    
    // WebSocket连接成功后，清除轮询
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  };
  
  ws.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'log') {
        // 添加新日志
        logs.value.push({
          timestamp: data.timestamp,
          message: data.message
        });
        
        // 保持日志数量在合理范围内
        if (logs.value.length > 1000) {
          logs.value = logs.value.slice(-1000);
        }
        
        scrollToBottom();
      }
    } catch (error) {
      console.error('解析WebSocket消息失败:', error);
    }
  };
  
  ws.value.onclose = () => {
    console.log('WebSocket连接已关闭');
    wsConnected.value = false;
    
    // WebSocket关闭后，如果开启了自动刷新，则恢复轮询
    if (autoRefresh.value) {
      refreshInterval = setInterval(fetchLogs, 5000);
    }
    
    // 尝试重新连接
    setTimeout(connectWebSocket, 5000);
  };
  
  ws.value.onerror = (error) => {
    console.error('WebSocket错误:', error);
    wsConnected.value = false;
    
    // WebSocket出错后，如果开启了自动刷新，则恢复轮询
    if (autoRefresh.value && !refreshInterval) {
      refreshInterval = setInterval(fetchLogs, 5000);
    }
  };
};

onMounted(() => {
  // 初始加载日志
  fetchLogs();
  
  // 连接WebSocket
  connectWebSocket();
  
  // 如果WebSocket未连接成功且开启了自动刷新，则使用轮询
  if (autoRefresh.value && !wsConnected.value) {
    refreshInterval = setInterval(fetchLogs, 5000);
  }
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  // 关闭WebSocket连接
  if (ws.value) {
    ws.value.close();
  }
});
</script>

<style scoped>
.log-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #dcdfe6;
  background-color: #f5f7fa;
}

.log-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.log-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5;
  height: 400px;
  min-height: 300px;
}

.log-entry {
  display: flex;
  margin-bottom: 4px;
  word-break: break-all;
}

.log-timestamp {
  color: #888;
  margin-right: 10px;
  white-space: nowrap;
}

.log-message {
  flex: 1;
}

.no-logs {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #909399;
  min-height: 300px;
}
</style>