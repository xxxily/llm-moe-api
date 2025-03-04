import prisma from './lib/db.js';
import dotenv from 'dotenv';
import { createModelConfig } from './services/modelConfigService.js';
import { createAgent } from './services/agentService.js';
import chalk from 'chalk';
import bcrypt from 'bcrypt';  // 添加 bcrypt 导入

// 加载环境变量
dotenv.config();

// 示例模型配置
const sampleModelConfigs = [
  {
    modelId: "gpt-4",
    name: "GPT-4",
    description: '高级通用模型，适合复杂推理和创意任务',
    baseUrl: process.env.DEFAULT_BASE_URL || "https://api.openai.com/v1",
    apiKey: process.env.DEFAULT_API_KEY || process.env.OPENAI_API_KEY,
    prompt: "你是一个由OpenAI开发的AI助手。你擅长复杂推理和创意任务。",
    capabilities: JSON.stringify([
      "复杂问题推理",
      "创意写作",
      "代码生成与评审",
      "深度分析"
    ]),
    priority: 10,
    isActive: true,
    isDefault: true
  },
  {
    modelId: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: '快速响应通用模型，适合日常对话和简单任务',
    baseUrl: process.env.DEFAULT_BASE_URL || "https://api.openai.com/v1",
    apiKey: process.env.DEFAULT_API_KEY || process.env.OPENAI_API_KEY,
    prompt: "你是一个由OpenAI开发的AI助手。你擅长简洁高效地回答问题。",
    capabilities: JSON.stringify([
      "日常对话",
      "简单问题解答",
      "信息查询",
      "基础创作"
    ]),
    priority: 5,
    isActive: true,
    isDefault: false
  },
  {
    modelId: "claude-3-opus",
    name: "Claude 3 Opus",
    description: '高级理解模型，适合长文本分析和学术任务',
    baseUrl: "https://api.anthropic.com/v1",
    apiKey: process.env.ANTHROPIC_API_KEY,
    prompt: "你是Claude，一个由Anthropic开发的有用、无害且诚实的AI助手。你擅长理解和分析复杂内容。",
    capabilities: JSON.stringify([
      "深度内容理解与分析",
      "长文本处理",
      "学术写作",
      "多轮对话"
    ]),
    priority: 8,
    isActive: true,
    isDefault: false
  }
];

// 示例Agent配置
const sampleAgents = [
  {
    agentId: "general-assistant",
    name: "通用助手",
    description: "适合日常对话和一般问题的通用AI助手",
    systemPrompt: "你是一个友好、有帮助的AI助手。你的目标是提供有用、安全和诚实的回答。",
    temperature: 0.7,
    topP: 1.0,
    maxTokens: 2000,
    capabilities: JSON.stringify([
      "日常对话",
      "一般问题解答",
      "信息查询"
    ]),
    priority: 5,
    isActive: true,
    isDefault: true,
    modelId: "gpt-3.5-turbo"
  },
  {
    agentId: "code-expert",
    name: "代码专家",
    description: "专注于编程和技术问题的AI助手",
    systemPrompt: "你是一个专业的编程助手。你擅长解决编程问题、代码审查和软件开发相关问题。请提供清晰、准确的技术解答，并在适当时提供代码示例。",
    temperature: 0.3,
    topP: 1.0,
    maxTokens: 4000,
    capabilities: JSON.stringify([
      "代码生成",
      "代码审查",
      "编程问题解答",
      "技术文档编写"
    ]),
    priority: 8,
    isActive: true,
    isDefault: false,
    modelId: "gpt-4"
  },
  {
    agentId: "creative-writer",
    name: "创意写手",
    description: "专注于创意写作和内容创作的AI助手",
    systemPrompt: "你是一个富有创造力的AI写作助手。你擅长创意写作、故事创作、内容生成等任务。请提供有创意、引人入胜的内容。",
    temperature: 0.9,
    topP: 1.0,
    maxTokens: 3000,
    capabilities: JSON.stringify([
      "创意写作",
      "故事创作",
      "内容生成",
      "文案撰写"
    ]),
    priority: 7,
    isActive: true,
    isDefault: false,
    modelId: "claude-3-opus"
  }
];

// 初始化系统函数
export async function initializeSystem(clearExisting = false) {
  console.log(chalk.blue('开始初始化系统...'));

  // Check if database tables exist by attempting a simple query
  try {
    await prisma.$queryRaw`SELECT 1 FROM model_configs LIMIT 1`;
    console.log(chalk.blue('数据库表已存在，继续初始化...'));
  } catch (dbError) {
    console.log(chalk.yellow('数据库表不存在，请先运行迁移命令: npx prisma migrate dev'));
    console.log(chalk.yellow('或者运行: npx prisma db push'));
    return {
      success: false,
      message: '数据库表不存在，请先运行迁移命令',
      error: dbError.message
    };
  }

  try {
    // 如果需要清空现有配置
    if (clearExisting) {
      console.log(chalk.yellow('正在清空现有配置...'));
      // 先删除所有Agent (因为Agent依赖于ModelConfig)
      await prisma.agent.deleteMany({});
      // 再删除所有ModelConfig
      await prisma.modelConfig.deleteMany({});
      // 删除所有管理员账号（如果需要）
      // await prisma.admin.deleteMany({});
    }

    // 获取现有的模型配置和Agent
    const existingModels = await prisma.modelConfig.findMany();
    const existingAgents = await prisma.agent.findMany();

    // 创建或更新模型配置
    for (const config of sampleModelConfigs) {
      const existingModel = existingModels.find(m => m.modelId === config.modelId);

      if (existingModel) {
        console.log(chalk.yellow(`更新现有模型配置: ${config.modelId}`));
        await prisma.modelConfig.update({
          where: { modelId: config.modelId },
          data: config
        });
      } else {
        console.log(chalk.green(`创建新模型配置: ${config.modelId}`));
        await createModelConfig(config);
      }
    }

    // 创建或更新Agent配置
    for (const agent of sampleAgents) {
      const existingAgent = existingAgents.find(a => a.agentId === agent.agentId);

      if (existingAgent) {
        console.log(chalk.yellow(`更新现有Agent配置: ${agent.agentId}`));
        await prisma.agent.update({
          where: { agentId: agent.agentId },
          data: agent
        });
      } else {
        console.log(chalk.green(`创建新Agent配置: ${agent.agentId}`));
        await createAgent(agent);
      }
    }

    // 检查并创建默认管理员账号
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    // 检查是否已存在管理员账号
    const adminCount = await prisma.admin.count();
    
    if (adminCount === 0) {
      console.log(chalk.green(`创建默认管理员账号: ${adminUsername}`));
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await prisma.admin.create({
        data: {
          username: adminUsername,
          password: hashedPassword
        }
      });
    } else {
      console.log(chalk.blue('管理员账号已存在，跳过创建默认管理员'));
    }

    console.log(chalk.green('系统初始化完成!'));
    return { success: true, message: '系统初始化完成' };
  } catch (error) {
    console.error(chalk.red(`初始化失败: ${error.message}`));
    console.error(error);
    throw error;
  }
}

// 如果直接运行此文件，则执行初始化
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeSystem()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}