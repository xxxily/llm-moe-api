<template>
  <div class="system-logs">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>接口日志</span>
        </div>
      </template>
      <LogViewer />
    </el-card>
  </div>
</template>

<script setup>
import LogViewer from '../components/LogViewer.vue'
</script>

<style scoped>
.system-logs {
  padding: 20px;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.box-card {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: none;
}

.box-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(90deg, #409EFF, #9254de);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .system-logs {
    padding: 10px;
  }
  
  .page-header {
    padding: 12px;
  }
  
  .page-title h2 {
    font-size: 18px;
  }
}
</style>