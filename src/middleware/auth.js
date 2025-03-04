// src/middleware/auth.js
import dotenv from 'dotenv';
import prisma from '../lib/db.js';
import { validateAdmin } from '../services/adminService.js';

// 加载环境变量
dotenv.config();

// API访问鉴权中间件
export function apiAuthMiddleware(req, res, next) {
  const apiKey = process.env.API_KEY;

  // 如果没有设置API_KEY，则不进行鉴权
  if (!apiKey) {
    return next();
  }

  // 获取请求头中的Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing API key in Authorization header' });
  }

  // 验证API密钥格式 (Bearer sk-xxx 或 Bearer xxx)
  const match = authHeader.match(/^Bearer\s+(?:sk-)?(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: 'Invalid Authorization header format' });
  }

  const providedKey = match[1];

  // 验证API密钥
  if (providedKey !== apiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
}

// 管理后台鉴权中间件 - 支持session和API token两种方式
export function adminAuthMiddleware(req, res, next) {
  // 1. 检查用户是否已登录（session认证）
  if (req.session && req.session.adminLoggedIn) {
    return next();
  }

  // 2. 检查是否有API token认证（适用于API请求）
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(?:sk-)?(.+)$/i);
    if (match) {
      const providedKey = match[1];
      const apiKey = process.env.API_KEY;
      
      // 如果API key匹配，允许访问
      if (providedKey === apiKey) {
        return next();
      }
    }
  }

  // 3. 根据请求类型返回不同的响应
  // 如果是API请求，返回401 JSON响应
  if (req.path.startsWith('/api/') || req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // 否则重定向到登录页
  res.redirect('/login');
}