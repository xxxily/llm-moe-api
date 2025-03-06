<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>页面未找到</h2>
      <p>抱歉，您访问的页面不存在或已被移除。</p>
      <router-link to="/" class="home-link">
        <el-button type="primary">返回首页</el-button>
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound'
}
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 500px;
  text-align: center;
}

.not-found-content {
  max-width: 500px;
  padding: 20px;
}

h1 {
  font-size: 120px;
  margin: 0;
  color: #409EFF;
  line-height: 1.2;
}

h2 {
  font-size: 32px;
  margin-top: 0;
  margin-bottom: 20px;
  color: #303133;
}

p {
  font-size: 18px;
  color: #606266;
  margin-bottom: 30px;
}

.home-link {
  text-decoration: none;
}
</style>