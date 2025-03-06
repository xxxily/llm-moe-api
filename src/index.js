// src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { setupRoutes } from './routes.js';
import { apiAuthMiddleware } from './middleware/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfigsToEnv } from './services/systemConfigService.js';
import { initWebSocketServer } from './services/websocketService.js';

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// 获取__dirname (ESM模式下)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 中间件
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// 异步启动函数
async function startServer() {
  try {
    // 从数据库加载配置到环境变量（优先级高于.env文件）
    await loadConfigsToEnv();
    
    // 获取配置
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || 'localhost';
    const sessionSecret = process.env.SESSION_SECRET || 'default-session-secret';
    
    // 设置会话中间件
    app.use(session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 * 14 } // 14天
    }));

    // 添加API鉴权中间件 - 先处理API请求，避免与前端路由冲突
    app.use('/api', apiAuthMiddleware);
    app.use('/v1', apiAuthMiddleware);

    // 设置路由 - API路由应该在静态文件路由之前处理
    setupRoutes(app);

    // 设置静态文件目录
    app.use(express.static(path.join(__dirname, '../public')));

    // 添加对web构建目录的支持
    app.use(express.static(path.join(__dirname, '../web/dist'))); // 根目录直接访问web/dist

    // 所有未匹配到的路由都返回index.html（支持前端路由）
    app.get('*', (req, res) => {
      // 排除API路径
      if (req.path.startsWith('/api/') || req.path.startsWith('/v1/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      res.sendFile(path.join(__dirname, '../web/dist/index.html'));
    });

    // 设置EJS模板引擎
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '../views'));

    // 启动服务器
    const server = app.listen(port, host, () => {
      console.log(`LLM MOE API服务已启动，监听地址: ${host}:${port}`);
    });
    
    // 初始化WebSocket服务
    initWebSocketServer(server);
    
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();