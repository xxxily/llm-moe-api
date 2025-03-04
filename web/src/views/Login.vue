<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="login-header">
          <h2 class="login-title">LLM MOE API 管理系统</h2>
        </div>
      </template>
      
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="用户名">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="密码">
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" block>
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名长度不能小于3个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await fetch('/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(loginForm)
        })
        
        const data = await response.json()
        
        if (data.success) {
          // 保存token到localStorage
          if (data.token) {
            localStorage.setItem('api_token', data.token)
          }
          
          ElMessage.success('登录成功')
          // 使用 replace 而不是 push，防止用户登录后点击返回按钮回到登录页
          router.replace('/')
        } else {
          ElMessage.error(data.message || '登录失败')
        }
      } catch (error) {
        console.error('登录错误:', error)
        ElMessage.error('登录失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow: hidden;
  position: relative;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(64, 158, 255, 0.05) 0%, transparent 20%),
    radial-gradient(circle at 90% 30%, rgba(103, 194, 58, 0.05) 0%, transparent 20%),
    radial-gradient(circle at 50% 80%, rgba(144, 147, 153, 0.05) 0%, transparent 20%);
  z-index: 0;
}

.login-card {
  width: 400px;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  z-index: 1;
  animation: fadeInUp 0.8s ease-out;
  overflow: hidden;
  border: none;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  padding: 20px 0;
  /* background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
  border-bottom: 1px solid #ebeef5; */
}

.login-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  background: linear-gradient(90deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% auto;
  animation: textShine 3s ease-in-out infinite alternate;
  position: relative;
}

.login-title::after {
  content: attr(data-text);
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background: linear-gradient(90deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.3;
  filter: blur(8px);
  animation: textGlow 3s ease-in-out infinite alternate;
}

@keyframes textShine {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

@keyframes textGlow {
  0% {
    filter: blur(8px);
    opacity: 0.3;
    transform: scale(1);
  }
  100% {
    filter: blur(4px);
    opacity: 0.6;
    transform: scale(1.03);
  }
}

.login-form {
  padding: 30px;
}

.login-form .el-form-item {
  margin-bottom: 25px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409EFF inset, 0 4px 12px rgba(0, 0, 0, 0.1);
}

.login-button {
  width: 100%;
  border-radius: 8px;
  padding: 12px 0;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  background: linear-gradient(90deg, #409EFF, #53a8ff);
  border: none;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.login-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.login-footer {
  text-align: center;
  padding: 15px 0;
  color: #909399;
  font-size: 14px;
  border-top: 1px solid #ebeef5;
  background-color: #f9fafc;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .login-card {
    width: 90%;
    max-width: 400px;
  }
  
  .login-header {
    padding: 20px 0;
  }
  
  .login-title {
    font-size: 20px;
  }
  
  .login-form {
    padding: 20px;
  }
}
</style>