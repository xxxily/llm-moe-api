// src/middleware/loggerMiddleware.js
import chalk from 'chalk';
import { broadcastLog } from '../services/websocketService.js';

// 创建一个存储最近日志的数组，用于前端获取
const recentLogs = [];
const MAX_LOGS = 1000; // 最多保存1000条日志

// 添加日志到内存中
function addLog(log) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    message: log
  };
  
  recentLogs.push(logEntry);
  
  // 如果日志超过最大数量，删除最旧的
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.shift();
  }
  
  // 同时打印到控制台
  console.log(log);
  
  // 通过WebSocket广播日志
  broadcastLog(log);
}

// 获取最近的日志
export function getRecentLogs(limit = 100) {
  return recentLogs.slice(-limit);
}

// API请求日志中间件
export function apiLoggerMiddleware(req, res, next) {
  const startTime = Date.now();
  const { method, path, body, headers } = req;
  
  // 记录请求信息
  const requestLog = `${chalk.blue('[请求]')} ${chalk.green(method)} ${chalk.yellow(path)}`;
  addLog(requestLog);
  
  // 记录请求体，但排除敏感信息
  const sanitizedBody = { ...body };
  if (sanitizedBody.apiKey) sanitizedBody.apiKey = '***';
  if (sanitizedBody.password) sanitizedBody.password = '***';
  if (headers.authorization) headers.authorization = headers.authorization.replace(/Bearer\s+(.{4}).*/, 'Bearer $1***');
  
  addLog(`${chalk.blue('[请求体]')} ${JSON.stringify(sanitizedBody, null, 2)}`);
  
  // 捕获响应
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;
  
  // 重写send方法
  res.send = function(body) {
    const responseTime = Date.now() - startTime;
    addLog(`${chalk.magenta('[响应]')} ${chalk.green(method)} ${chalk.yellow(path)} ${chalk.cyan(`${responseTime}ms`)} ${chalk.blue('状态:')} ${res.statusCode}`);
    
    // 对于非流式响应，记录响应体
    if (typeof body === 'string' && body.length < 1000) {
      addLog(`${chalk.magenta('[响应体]')} ${body}`);
    } else if (typeof body === 'object') {
      addLog(`${chalk.magenta('[响应体]')} ${JSON.stringify(body, null, 2)}`);
    }
    
    return originalSend.apply(res, arguments);
  };
  
  // 重写json方法
  res.json = function(body) {
    const responseTime = Date.now() - startTime;
    addLog(`${chalk.magenta('[响应]')} ${chalk.green(method)} ${chalk.yellow(path)} ${chalk.cyan(`${responseTime}ms`)} ${chalk.blue('状态:')} ${res.statusCode}`);
    
    // 记录响应体
    if (body && Object.keys(body).length < 20) {
      addLog(`${chalk.magenta('[响应体JSON]')} ${JSON.stringify(body, null, 2)}`);
    } else {
      addLog(`${chalk.magenta('[响应体JSON]')} 数据过大，不完全显示`);
    }
    
    return originalJson.apply(res, arguments);
  };
  
  // 对于流式响应，记录开始和结束
  res.end = function() {
    if (res.headersSent && res.getHeader('Content-Type') === 'text/event-stream') {
      const responseTime = Date.now() - startTime;
      addLog(`${chalk.magenta('[流式响应结束]')} ${chalk.green(method)} ${chalk.yellow(path)} ${chalk.cyan(`${responseTime}ms`)}`);
    }
    return originalEnd.apply(res, arguments);
  };
  
  next();
}