import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Layout from '../views/Layout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'models',
        name: 'Models',
        component: () => import('../views/Models.vue')
      },
      {
        path: 'agents',
        name: 'Agents',
        component: () => import('../views/Agents.vue')
      },
      {
        path: 'admins',
        name: 'Admins',
        component: () => import('../views/Admins.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 如果目标路由不需要认证，直接放行
  if (!to.meta.requiresAuth) {
    next()
    return
  }
  
  // 检查是否有token
  const token = localStorage.getItem('api_token')
  
  try {
    // 构建请求头
    const headers = {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
    
    // 如果有token，添加到请求头
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch('/admin/status', {
      headers,
      credentials: 'same-origin' // 确保发送cookies
    })
    
    if (response.ok) {
      const data = await response.json()
      
      if (data.loggedIn) {
        // 已登录，允许访问
        next()
      } else {
        // 未登录，重定向到登录页
        next('/login')
      }
    } else {
      console.error('服务器响应错误:', response.status, response.statusText)
      next('/login')
    }
  } catch (error) {
    console.error('检查认证状态时出错:', error)
    next('/login')
  }
})

export default router