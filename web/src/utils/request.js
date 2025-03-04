/**
 * 封装fetch请求，自动添加认证信息
 */

// 创建请求函数
export async function request(url, options = {}) {
  // 获取存储的token
  const token = localStorage.getItem('api_token');
  
  // 准备headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // 如果有token，添加到Authorization头
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // 合并选项
  const requestOptions = {
    ...options,
    headers
  };
  
  // 发送请求
  const response = await fetch(url, requestOptions);
  
  // 处理401错误（未授权），可能是token过期
  if (response.status === 401) {
    // 清除token
    localStorage.removeItem('api_token');
    
    // 如果不是登录页面，重定向到登录页
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
      return null;
    }
  }
  
  return response;
}

// 便捷方法
export const get = (url, options = {}) => request(url, { ...options, method: 'GET' });
export const post = (url, data, options = {}) => request(url, { ...options, method: 'POST', body: JSON.stringify(data) });
export const put = (url, data, options = {}) => request(url, { ...options, method: 'PUT', body: JSON.stringify(data) });
export const del = (url, options = {}) => request(url, { ...options, method: 'DELETE' });