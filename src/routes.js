// src/routes.js
import bcrypt from 'bcrypt';
import prisma from './lib/db.js';
import { selectModel } from './services/modelSelector.js';
import { proxyLLMRequest } from './services/llmProxy.js';
import { adminAuthMiddleware } from './middleware/auth.js';
import { validateAdmin } from './services/adminService.js';

import {
  getAllModelConfigs,
  getModelConfigById,
  getDefaultModelConfig,
  createModelConfig,
  updateModelConfig,
  deleteModelConfig
} from './services/modelConfigService.js';

import {
  getAllAgents,
  getAgentById,
  getDefaultAgent,
  createAgent,
  updateAgent,
  deleteAgent
} from './services/agentService.js';

export function setupRoutes(app) {
  // OpenAI兼容API
  app.post('/v1/chat/completions', async (req, res) => {
    try {
      // 从用户消息中提取请求内容
      const userMessages = req.body.messages || [];
      const userRequestContent = userMessages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join('\n');

      // 选择适合的模型
      const selectedModelId = await selectModel(userRequestContent);

      // 转发请求到选择的模型
      await proxyLLMRequest(selectedModelId, req.body, res);
    } catch (error) {
      console.error(`API请求错误: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  // 模型配置管理API
  app.get('/api/models', async (req, res) => {
    try {
      // 管理后台API应返回所有模型，包括禁用的
      const models = await getAllModelConfigs(true);
      res.json(models);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 添加一个新的API端点，专门用于获取激活的模型（供前端用户使用）
  app.get('/api/active-models', async (req, res) => {
    try {
      const models = await getAllModelConfigs(false); // 只返回激活的模型
      res.json(models);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 获取默认模型
  app.get('/api/models/default', async (req, res) => {
    try {
      const defaultModel = await getDefaultModelConfig();
      if (!defaultModel) {
        // return res.status(404).json({ error: '未找到默认模型' });
        return res.json({ modelId: '-', name: '未设置默认模型' });
      }
      res.json(defaultModel);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/models/:modelId', async (req, res) => {
    try {
      const model = await getModelConfigById(req.params.modelId);
      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }
      res.json(model);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/models', async (req, res) => {
    try {
      const newModel = await createModelConfig(req.body);
      res.status(201).json(newModel);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/models/:modelId', async (req, res) => {
    try {
      const updatedModel = await updateModelConfig(req.params.modelId, req.body);
      res.json(updatedModel);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/models/:modelId', async (req, res) => {
    try {
      // 检查是否要彻底删除
      const permanent = req.query.permanent === 'true';
      
      if (permanent) {
        // 彻底删除模型
        await prisma.modelConfig.delete({
          where: { modelId: req.params.modelId }
        });
      } else {
        // 软删除（标记为非活动）
        await deleteModelConfig(req.params.modelId);
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Agent配置管理API
  app.get('/api/agents', async (req, res) => {
    try {
      // 管理后台API应返回所有Agent，包括禁用的
      const agents = await getAllAgents(true);
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 添加一个新的API端点，专门用于获取激活的Agent（供前端用户使用）
  app.get('/api/active-agents', async (req, res) => {
    try {
      const agents = await getAllAgents(false); // 只返回激活的Agent
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 获取默认Agent
  app.get('/api/agents/default', async (req, res) => {
    try {
      const defaultAgent = await getDefaultAgent();
      if (!defaultAgent) {
        // return res.status(404).json({ error: '未找到默认Agent' });
        return res.json({ agentId: '-', name: '未设置默认Agent' });
      }
      res.json(defaultAgent);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/agents/:agentId', async (req, res) => {
    try {
      const agent = await getAgentById(req.params.agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      res.json(agent);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/agents', async (req, res) => {
    try {
      const newAgent = await createAgent(req.body);
      res.status(201).json(newAgent);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/agents/:agentId', async (req, res) => {
    try {
      const updatedAgent = await updateAgent(req.params.agentId, req.body);
      res.json(updatedAgent);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/agents/:agentId', async (req, res) => {
    try {
      // 检查是否要彻底删除
      const permanent = req.query.permanent === 'true';
      
      if (permanent) {
        // 彻底删除Agent
        await prisma.agent.delete({
          where: { agentId: req.params.agentId }
        });
      } else {
        // 软删除（标记为非活动）
        await deleteAgent(req.params.agentId);
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 管理员登录API
  app.post('/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const isValid = await validateAdmin(username, password);
      
      if (isValid) {
        // 设置会话
        req.session.adminLoggedIn = true;
        req.session.adminUsername = username;
        
        // 生成API token并返回给客户端
        const token = process.env.API_KEY || 'default-api-key';
        
        res.json({ 
          success: true, 
          message: '登录成功',
          token: token  // 返回token给客户端
        });
      } else {
        res.status(401).json({ success: false, message: '用户名或密码错误' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 管理员登出API
  app.post('/admin/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: '登出失败' });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true, message: '登出成功' });
    });
  });

  // 管理员状态检查API
  app.get('/admin/status', (req, res) => {
    if (req.session && req.session.adminLoggedIn) {
      res.json({ 
        loggedIn: true, 
        username: req.session.adminUsername 
      });
    } else {
      res.json({ loggedIn: false });
    }
  });

  // 系统初始化API (需要管理员权限)
  app.post('/api/system/setup', adminAuthMiddleware, async (req, res) => {
    try {
      // 这里可以调用setup.js中的初始化函数
      // 需要传入req.body中的参数，如是否清空现有配置等
      const { clearExisting = false } = req.body;
      
      // 导入并调用setup.js中的初始化函数
      const { initializeSystem } = await import('./setup.js');
      await initializeSystem(clearExisting);
      
      res.json({ success: true, message: '系统初始化成功' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 管理员管理API
  app.get('/api/admins', adminAuthMiddleware, async (req, res) => {
    try {
      const admins = await prisma.admin.findMany({
        select: {
          id: true,
          username: true,
          createdAt: true,
          updatedAt: true
        }
      });
      res.json(admins);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admins', adminAuthMiddleware, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // 检查用户名是否已存在
      const existingAdmin = await prisma.admin.findUnique({
        where: { username }
      });
      
      if (existingAdmin) {
        return res.status(400).json({ error: '用户名已存在' });
      }
      
      // 创建新管理员
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = await prisma.admin.create({
        data: {
          username,
          password: hashedPassword
        }
      });
      
      res.status(201).json({
        id: newAdmin.id,
        username: newAdmin.username,
        createdAt: newAdmin.createdAt,
        updatedAt: newAdmin.updatedAt
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/admins/:id', adminAuthMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;
      
      // 更新管理员密码
      const hashedPassword = await bcrypt.hash(password, 10);
      const updatedAdmin = await prisma.admin.update({
        where: { id: parseInt(id) },
        data: { password: hashedPassword }
      });
      
      res.json({
        id: updatedAdmin.id,
        username: updatedAdmin.username,
        createdAt: updatedAdmin.createdAt,
        updatedAt: updatedAdmin.updatedAt
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/admins/:id', adminAuthMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      
      // 检查是否是最后一个管理员
      const adminCount = await prisma.admin.count();
      if (adminCount <= 1) {
        return res.status(400).json({ error: '不能删除最后一个管理员账户' });
      }
      
      // 删除管理员
      await prisma.admin.delete({
        where: { id: parseInt(id) }
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}