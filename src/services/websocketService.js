// src/services/websocketService.js
import { WebSocketServer } from 'ws';
import chalk from 'chalk';

let wss = null;
const clients = new Set();

// 初始化WebSocket服务
export function initWebSocketServer(server) {
  wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws) => {
    console.log(chalk.green('WebSocket客户端已连接'));
    
    // 添加到客户端集合
    clients.add(ws);
    
    // 发送欢迎消息
    ws.send(JSON.stringify({
      type: 'info',
      message: '已连接到日志服务器'
    }));
    
    // 处理连接关闭
    ws.on('close', () => {
      console.log(chalk.yellow('WebSocket客户端已断开'));
      clients.delete(ws);
    });
    
    // 处理错误
    ws.on('error', (error) => {
      console.error(chalk.red('WebSocket错误:'), error);
      clients.delete(ws);
    });
  });
  
  console.log(chalk.green('WebSocket服务器已启动'));
  return wss;
}

// 广播日志消息给所有连接的客户端
export function broadcastLog(log) {
  if (!wss) return;
  
  const message = JSON.stringify({
    type: 'log',
    timestamp: new Date().toISOString(),
    message: log
  });
  
  for (const client of clients) {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  }
}