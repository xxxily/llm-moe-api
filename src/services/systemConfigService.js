import prisma from '../lib/db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 获取项目根目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const envPath = path.join(rootDir, '.env');

// 需要同步到.env文件的配置键
const ENV_SYNC_KEYS = [
  'PORT', 'HOST', 'SESSION_SECRET', 'API_KEY',
  'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'DEEPSEEK_API_KEY', 
  'GEMINI_API_KEY', 'GROK_API_KEY'
];

// 获取单个配置
export async function getConfig(key) {
  const config = await prisma.SystemConfig.findUnique({
    where: { key }
  });
  
  return config;
}

// 获取指定分类的所有配置
export async function getCategoryConfigs(category) {
  const configs = await prisma.SystemConfig.findMany({
    where: { category }
  });
  
  return configs;
}

// 获取所有配置
export async function getAllConfigs() {
  const configs = await prisma.SystemConfig.findMany();
  return configs;
}

// 设置配置
export async function setConfig(key, value, description, type, category) {
  // 如果只提供了key和value，则只更新value
  if (!description && !type && !category) {
    const config = await prisma.SystemConfig.update({
      where: { key },
      data: { value }
    });
    
    // 如果是需要同步到.env的配置，则更新.env文件
    if (ENV_SYNC_KEYS.includes(key)) {
      await updateEnvFile(key, value);
    }
    
    return config;
  }
  
  // 否则创建或更新完整配置
  const config = await prisma.SystemConfig.upsert({
    where: { key },
    update: {
      value,
      description: description || '',
      type: type || 'text',
      category: category || 'system'
    },
    create: {
      key,
      value,
      description: description || '',
      type: type || 'text',
      category: category || 'system'
    }
  });
  
  // 如果是需要同步到.env的配置，则更新.env文件
  if (ENV_SYNC_KEYS.includes(key)) {
    await updateEnvFile(key, value);
  }
  
  return config;
}

// 批量设置配置
export async function batchSetConfigs(configs) {
  const results = [];
  
  for (const config of configs) {
    const result = await setConfig(
      config.key,
      config.value,
      config.description,
      config.type,
      config.category
    );
    
    results.push(result);
  }
  
  return results;
}

// 初始化默认配置
export async function initializeDefaultConfigs() {
  // 这个函数在setup.js中已经实现
  return [];
}

// 更新.env文件
async function updateEnvFile(key, value) {
  try {
    // 读取.env文件
    const envContent = await fs.readFile(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    // 查找并更新指定的键值
    let updated = false;
    const newLines = envLines.map(line => {
      // 匹配键名（考虑可能的注释）
      const keyRegex = new RegExp(`^${key}=`);
      if (keyRegex.test(line.trim())) {
        updated = true;
        // 保留可能的行尾注释
        const commentMatch = line.match(/#.*$/);
        const comment = commentMatch ? commentMatch[0] : '';
        return `${key}="${value}"${comment ? ' ' + comment : ''}`;
      }
      return line;
    });
    
    // 如果没有找到键，则添加到文件末尾
    if (!updated) {
      newLines.push(`${key}="${value}"`);
    }
    
    // 写回.env文件
    await fs.writeFile(envPath, newLines.join('\n'));
    
    // 重新加载环境变量
    dotenv.config();
    
    return true;
  } catch (error) {
    console.error(`更新.env文件失败: ${error.message}`);
    return false;
  }
}

// 从数据库加载配置到环境变量
export async function loadConfigsToEnv() {
  try {
    // 获取所有需要同步的配置
    const configs = await prisma.SystemConfig.findMany({
      where: {
        key: {
          in: ENV_SYNC_KEYS
        }
      }
    });
    
    // 将配置加载到环境变量
    for (const config of configs) {
      process.env[config.key] = config.value;
    }
    
    return true;
  } catch (error) {
    console.error(`从数据库加载配置失败: ${error.message}`);
    return false;
  }
}

// 解析配置值
export function parseConfigValue(config) {
  switch (config.type) {
    case 'boolean':
      return config.value.toLowerCase() === 'true';
    case 'number':
      return Number(config.value);
    case 'json':
      try {
        return JSON.parse(config.value);
      } catch {
        return null;
      }
    default:
      return config.value;
  }
}