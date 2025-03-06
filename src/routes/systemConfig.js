import express from 'express';
import { 
  getConfig, 
  setConfig, 
  getCategoryConfigs, 
  getAllConfigs,
  batchSetConfigs,
  initializeDefaultConfigs
} from '../services/systemConfigService.js';
import { adminAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 获取所有配置
router.get('/configs', adminAuthMiddleware, async (req, res) => {
  try {
    const { category } = req.query;
    let configs;
    
    if (category) {
      configs = await getCategoryConfigs(category);
    } else {
      configs = await getAllConfigs();
    }
    
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个配置
router.get('/configs/:key', adminAuthMiddleware, async (req, res) => {
  try {
    const { key } = req.params;
    const config = await getConfig(key);
    
    if (config === null) {
      return res.status(404).json({ error: '配置项不存在' });
    }
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新配置
router.put('/configs/:key', adminAuthMiddleware, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description, type, category } = req.body;
    
    // 如果提供了完整的配置信息，则更新所有字段
    if (description !== undefined && type !== undefined && category !== undefined) {
      const config = await setConfig(key, value, description, type, category);
      return res.json(config);
    }
    
    // 否则只更新值
    const config = await setConfig(key, value);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 批量更新配置
router.post('/configs/batch', adminAuthMiddleware, async (req, res) => {
  try {
    const { configs } = req.body;
    
    if (!Array.isArray(configs)) {
      return res.status(400).json({ error: '请提供配置数组' });
    }
    
    const updatedConfigs = await batchSetConfigs(configs);
    res.json(updatedConfigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 初始化默认配置
router.post('/configs/initialize', adminAuthMiddleware, async (req, res) => {
  try {
    const configs = await initializeDefaultConfigs();
    res.json({ success: true, message: '默认配置初始化成功', count: configs.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;