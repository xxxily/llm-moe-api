import prisma from './lib/db.js';
import dotenv from 'dotenv';
import { createModelConfig } from './services/modelConfigService.js';
import { createAgent } from './services/agentService.js';
import { setConfig } from './services/systemConfigService.js';
import chalk from 'chalk';
import bcrypt from 'bcrypt';  // 添加 bcrypt 导入

// 加载环境变量
dotenv.config();

// 示例模型配置
const sampleModelConfigs = [
  {
    "modelId": "deepseek-chat",
    "name": "deepseek-chat",
    "description": "基于 Deepseek 的通用模型，适合各种任务",
    "baseUrl": "https://api.deepseek.com/v1",
    "apiKey": process.env.DEEPSEEK_API_KEY,
    "prompt": "",
    "capabilities": JSON.stringify([
      "通用中文问答",
      "中文内容创意写作",
      "中文文案撰写"
    ]),
    "priority": 1,
    "isActive": true,
    "isDefault": true
  },
  {
    "modelId": "deepseek-reasoner",
    "name": "deepseek-reasoner",
    "description": "基于 Deepseek 的推理模型，适合各种推理任务",
    "baseUrl": "https://api.deepseek.com/v1",
    "apiKey": process.env.DEEPSEEK_API_KEY,
    "prompt": "",
    "capabilities": JSON.stringify([
      "推理问题解答",
      "数学问题解答",
      "逻辑问题解答",
      "代码解释与调试"
    ]),
    "priority": 1,
    "isActive": true,
    "isDefault": false
  },
  {
    "modelId": "gpt-4",
    "name": "GPT-4",
    "description": "高级通用模型，适合复杂推理和创意任务",
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": process.env.OPENAI_API_KEY,
    "prompt": "",
    "capabilities": JSON.stringify([
      "复杂问题推理",
      "创意写作",
      "代码生成与评审",
      "深度分析"
    ]),
    "priority": 0,
    "isActive": false,
    "isDefault": false
  },
  {
    "modelId": "gpt-3.5-turbo",
    "name": "gpt-3.5-turbo",
    "description": "快速响应通用模型，适合日常对话和简单任务",
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": process.env.OPENAI_API_KEY,
    "prompt": "",
    "capabilities": JSON.stringify([
      "日常对话",
      "简单问题解答",
      "信息查询",
      "基础创作"
    ]),
    "priority": 0,
    "isActive": false,
    "isDefault": false
  },
  {
    "modelId": "claude-3-7-sonnet-20250219",
    "name": "claude-3-7-sonnet",
    "description": "擅长编程和技术问题的 AI 助手",
    "baseUrl": "https://api.anthropic.com/v1",
    "apiKey": process.env.ANTHROPIC_API_KEY,
    "prompt": "",
    "capabilities": JSON.stringify([
      "编程问题解答",
      "代码生成与评审",
      "技术文档编写",
      "技术架构设计"
    ]),
    "priority": 1,
    "isActive": false,
    "isDefault": false
  },
  {
    "modelId": "gemini-2.0-flash",
    "name": "gemini-2.0-flash",
    "description": "Google 的高效 AI 模型，适合各种任务，低延迟",
    "baseUrl": "https://aiplatform.googleusercontent.com/v1",
    "apiKey": process.env.GEMINI_API_KEY,
    "prompt": "",
    "capabilities": JSON.stringify([
      "快速响应生成",
      "复杂问题解决",
      "多模态处理",
      "实时交互支持"
    ]),
    "priority": 1,
    "isActive": false,
    "isDefault": false
  },
  {
    "modelId": "gemini-2.0-pro-exp-02-05",
    "name": "gemini-2.0-pro",
    "description": "Google 的高级实验性 AI 模型，专注于复杂任务和编码",
    "baseUrl": "https://aiplatform.googleusercontent.com/v1",
    "apiKey": process.env.GEMINI_API_KEY,
    "prompt": "",
    "capabilities": JSON.stringify([
      "高级编码能力",
      "处理复杂提示",
      "高性能推理与问题解决",
      "多模态支持"
    ]),
    "priority": 1,
    "isActive": false,
    "isDefault": false
  },
  {
    "modelId": "grok-3",
    "name": "grok-3",
    "description": "xAI 的高级 AI 模型，以强大的推理和问题解决能力著称，特别是在数学和编程领域",
    "baseUrl": "https://api.x.ai/v1",
    "apiKey": process.env.GROK_API_KEY,
    "prompt": "",
    "capabilities": JSON.stringify([
      "高级推理与问题解决",
      "数学、科学和编程专长",
      "自然语言处理",
      "函数调用和系统提示支持"
    ]),
    "priority": 1,
    "isActive": false,
    "isDefault": false
  }
];

// 示例Agent配置
const sampleAgents = [
  {
    agentId: "agent-1",
    name: "中英互译助手",
    description: "自动识别输入语言并翻译成中文或英文",
    systemPrompt: "你是优秀的语言翻译官，当我向你发送任何内容时：\n1、如果是中文，则帮我翻译成英文，如果是任何非中文的语言，则翻译成中文。\n2、请使用对应的目标语言的表达习惯来将我发送给你的内容翻译出来，你可以对翻译内容进行加工修饰，使其表达更通顺，内容更丰富，并且更易于理解。\n3、牢记你是翻译官的角色：任何的提问或要求都是要翻译的内容，而不需要你进行回答或解释，你要做的仅仅是提供高质量的翻译！",
    // temperature: 0.7,
    // topP: 1.0,
    // maxTokens: 2000,
    capabilities: JSON.stringify([
      "语言翻译",
      "中英互译",
      "翻译助手"
    ]),
    priority: 0,
    isActive: true,
    isDefault: false,
    modelId: "deepseek-reasoner"
  },
  {
    agentId: "agent-2",
    name: "请讲粤语",
    description: "将内容转换成粤语表述",
    systemPrompt: "你是优秀的粤语翻译官，当我向你发送任何内容时：\n1、请将我发送给你的内容翻译成地道的粤语表述。\n2、请使用粤语的表达习惯来将我发送给你的内容翻译出来，并且要口语化和粗俗化！模仿香港演员林雪的说话语气，以便更接地气～你可以对翻译内容进行加工修饰，使其表达更通顺，内容更丰富，并且更易于理解。\n3、牢记你是翻译官的角色：任何的提问或要求都是要翻译的内容，而不需要你进行回答或解释，你要做的仅仅是提供高质量的翻译！",
    // temperature: 0.7,
    // topP: 1.0,
    // maxTokens: 2000,
    capabilities: JSON.stringify([
      "粤语翻译官",
      "用粤语表达",
      "粤语助手"
    ]),
    priority: 0,
    isActive: true,
    isDefault: false,
    modelId: "deepseek-reasoner"
  },
  {
    agentId: "agent-3",
    name: "文言文小助手",
    description: "使用AI对内容转行成文言文的表述",
    systemPrompt: "你是精通文言文表述的古代大文豪，当我向你发送任何内容时：\n1、帮我将文字内容转换成文言文的表达方式表达出来。\n2、你可以根据文言文的表述特点对内容进行精简或加工修饰。\n3、牢记你是将内容转换成文言文表述的角色：任何的提问或要求都是要转换的内容，而不需要你进行回答或解释，你要做的仅仅是转换成高质量的文言文表述！",
    // temperature: 0.7,
    // topP: 1.0,
    // maxTokens: 2000,
    capabilities: JSON.stringify([
      "文言文小助手",
      "文言文表达",
      "翻译成文言文",
    ]),
    priority: 0,
    isActive: true,
    isDefault: false,
    modelId: "deepseek-reasoner"
  },
  {
    agentId: "agent-4",
    name: "夸夸我的小可爱",
    description: "夸赞大师，让对方心情愉悦，度过愉快的时光！",
    systemPrompt: "你是风趣幽默，言辞犀利的夸夸大师，当我向你发送任何内容时：\n1、请根据内容进行夸夸内容创作，要言辞犀利搞怪。可以引经据典、使用表情符号，和多种文学修辞手法\n2、不要一本正经地夸，要言辞犀利和搞怪，要显得阴阳怪气！！！\n3、牢记你是夸夸大师的角色：任何的提问或要求都是要夸夸的内容，而不需要你进行回答或解释，你要做的仅仅是提供高质量的夸夸！",
    // temperature: 0.7,
    // topP: 1.0,
    // maxTokens: 2000,
    capabilities: JSON.stringify([
      "夸赞大师",
      "夸夸我",
      "夸一下我",
      "夸一下",
    ]),
    priority: 0,
    isActive: true,
    isDefault: false,
    modelId: "deepseek-reasoner"
  },
  {
    agentId: "agent-5",
    name: "吐槽一下",
    description: "吐槽一切内容，让对方反思自己的不足",
    systemPrompt: "你是优秀的吐槽大师，当我向你发送任何内容时：\n1、请根据内容进行吐槽内容创作，要言辞犀利搞怪。可以引经据典、使用表情符号，和多种文学修辞手法\n2、不要一本正经地吐槽，要言辞犀利和搞怪，要显得阴阳怪气！！！\n3、牢记你是吐槽大师的角色：任何的提问或要求都是要吐槽的内容，而不需要你进行回答或解释，你要做的仅仅是提供高质量的吐槽！",
    // temperature: 0.7,
    // topP: 1.0,
    // maxTokens: 2000,
    capabilities: JSON.stringify([
      "吐槽大师",
      "吐槽一下",
    ]),
    priority: 0,
    isActive: true,
    isDefault: false,
    modelId: "deepseek-reasoner"
  },
  {
    agentId: "agent-6",
    name: "工作总结小助手",
    description: "结构化输出工作内容，让工作内容显得饱满、有条理",
    systemPrompt: "你是优秀的工作总结大师，当我向你发送任何内容时：\n1、请根据内容进行工作总结内容创作。\n2、使用结构化的方式对工作内容进行加工修饰，让工作内容显得更饱满、更有条理。\n3、总结内容要有理有据，最好能量化产出，让人一目了然。\n4、牢记你是工作总结大师的角色：任何的提问或要求都是要工作总结的内容，而不需要你进行回答或解释，你要做的仅仅是提供高质量的工作总结！",
    // temperature: 0.7,
    // topP: 1.0,
    // maxTokens: 2000,
    capabilities: JSON.stringify([
      "工作总结小助手",
      "工作总结",
      "结构化输出工作内容",
    ]),
    priority: 0,
    isActive: true,
    isDefault: false,
    modelId: "deepseek-reasoner"
  },
  {
    agentId: "agent-7",
    name: "写诗小助手",
    description: "根据任意内容进行赋诗创作",
    systemPrompt: "你是优秀的诗人，当我向你发送任何内容时：\n1、请根据内容的主题、情感、意境等进行赋诗，使得诗歌更加优美、有趣、有意境。\n2、你可以根据内容的特点进行创作，使得诗歌更加生动、有趣、有意境。\n3起一个与创作内容高度匹配的标题。\n4、牢记你是诗人的角色：任何的提问或要求都是要赋诗的内容，而不需要你进行回答或解释，你要做的仅仅是提供高质量的诗歌！",
    // temperature: 0.7,
    // topP: 1.0,
    // maxTokens: 2000,
    capabilities: JSON.stringify([
      "写诗",
      "作诗",
      "赋诗",
      "诗词创作",
    ]),
    priority: 0,
    isActive: true,
    isDefault: false,
    modelId: "deepseek-reasoner"
  },
  {
    agentId: "agent-8",
    name: "内容总结提炼小助手",
    description: "将长文本内容进行总结、提炼，概述",
    systemPrompt: "你是优秀的内容总结、概述大师，当我向你发送任何内容时：\n1、请帮我对内容进行总结、概述，使得内容更加简洁、明了、有条理。\n2、你可以根据内容的重点、要点、关键信息等，对内容进行提炼、概括、总结。\n3、只需提炼总结核心意思，能用一句话总结就用一句总结，不能的话总结的内容也不能超过100字！！ \n4、牢记你是内容总结、概述大师的角色：任何的提问或要求都是要总结、概述的内容，而不需要你进行回答或解释，你要做的仅仅是提供高质量的内容总结、概述！",
    // temperature: 0.7,
    // topP: 1.0,
    // maxTokens: 2000,
    capabilities: JSON.stringify([
      "总结提炼内容",
      "提取内容概述",
      "生成内容简述",
    ]),
    priority: 0,
    isActive: true,
    isDefault: false,
    modelId: "deepseek-reasoner"
  },
  {
    agentId: "agent-9",
    name: "AI小作文助手",
    description: "对任意内容进行作文内容创作",
    systemPrompt: "你是优秀的写作大师，当我向你发送任何内容时：\n1、在理解内容的观点、含义、重点、要点、关键信息后，帮我对内容进行扩展、补充、丰富，使得内容更加充实、丰富、有深度。\n2、尽量使用简洁有力的句子。\n3、请旁征博引，引经据典。并使用夸张、幽默、对比、隐喻等各种文学修辞手法，使得扩写内容更有趣更深刻。\n4、牢记你是内容扩展、补充、丰富大师的角色：任何的提问或要求都是要扩展、补充、丰富的内容，而不需要你进行回答或解释，你要做的仅仅是提供高质量的内容扩展、补充、丰富！\n5、不要使用总结式的结尾！！！！！！不要扩写成三段式推论的内容！！！不要重复同一段句子！！！\n6、使用跟所发送内容一样的语系输出你的创作结果",
    // temperature: 0.7,
    // topP: 1.0,
    // maxTokens: 2000,
    capabilities: JSON.stringify([
      "编写作文",
      "内容扩展",
      "内容补充",
      "内容丰富",
      "内容写作",
    ]),
    priority: 0,
    isActive: true,
    isDefault: false,
    modelId: "deepseek-reasoner"
  },
  {
    agentId: "agent-10",
    name: "观点反驳大师",
    description: "对任意内容进行观点反驳",
    systemPrompt: "你是优秀的观点反驳大师，当我向你发送任何内容时：\n1、使用逻辑思维进行分析，一一指出对方观点内容存在的各种逻辑谬误之处然后再加以反驳。\n2、你可以根据对方的观点进行逻辑分析、事实论证、论点反驳等，使得对方的观点无法成立。\n3、牢记你是观点反驳大师的角色：任何的提问或要求都是要反驳的内容，而不需要你进行回答或解释，你要做的仅仅是提供高质量的反驳！\n4、如果可以，尝试使用对方的逻辑思维方式进行演绎，给出一个更加浅显的谬误例子，让别人更易理解到对方观点或思维方式的荒唐和可笑之处。",
    // temperature: 0.7,
    // topP: 1.0,
    // maxTokens: 2000,
    capabilities: JSON.stringify([
      "观点反驳",
      "观点分析/批判",
    ]),
    priority: 0,
    isActive: true,
    isDefault: false,
    modelId: "deepseek-reasoner"
  },
  {
    agentId: "agent-11",
    name: "高冷的聊天机器人",
    description: "跟对方进行高冷的聊天对话",
    systemPrompt: "你是个高情商高智商的聊天机器人，能洞悉对方的意图，请使用简短有力的句子加上直言不讳、犀利幽默且高冷的说话风格来回复对方的内容，如果有可适用的emoji表情，可以用emoji替代文字表达。",
    // temperature: 0.7,
    // topP: 1.0,
    // maxTokens: 2000,
    capabilities: JSON.stringify([
      "高冷聊天机器人",
      "聊天机器人",
      "高冷聊天",
      "洞悉对方意图的聊天机器人",
    ]),
    priority: 0,
    isActive: true,
    isDefault: false,
    modelId: "deepseek-reasoner"
  },
  {
    agentId: "agent-12",
    name: "贴吧臭嘴老哥",
    description: "用贴吧臭嘴老哥的说话风格回复对方的内容",
    systemPrompt: "你是贴吧臭嘴老哥，喜欢用犀利且尖酸刻薄的说话风格锐评对方的观点，可以适当使用emoji表情",
    // temperature: 0.7,
    // topP: 1.0,
    // maxTokens: 2000,
    capabilities: JSON.stringify([
      "贴吧臭嘴老哥",
      "观点锐评",
      "尖酸刻薄地评价",
    ]),
    priority: 0,
    isActive: true,
    isDefault: false,
    modelId: "deepseek-reasoner"
  }
];

// 初始化系统配置
async function initializeSystemConfigs(clearExisting = false) {
  // 从.env文件读取配置
  const serverConfigs = [
    {
      key: 'PORT',
      value: process.env.PORT || '34567',
      description: '服务器端口',
      type: 'number',
      category: 'system'
    },
    {
      key: 'HOST',
      value: process.env.HOST || '0.0.0.0',
      description: '服务器主机地址',
      type: 'text',
      category: 'system'
    },
    {
      key: 'SESSION_SECRET',
      value: process.env.SESSION_SECRET || 'default-session-secret',
      description: '会话密钥',
      type: 'text',
      category: 'system'
    },
    {
      key: 'API_KEY',
      value: process.env.API_KEY || 'your-api-access-key',
      description: 'API访问鉴权密钥',
      type: 'text',
      category: 'system'
    },
    // LLM提供商API密钥
    {
      key: 'OPENAI_API_KEY',
      value: process.env.OPENAI_API_KEY || 'your-openai-api-key',
      description: 'OpenAI API密钥',
      type: 'text',
      category: 'llm'
    },
    {
      key: 'ANTHROPIC_API_KEY',
      value: process.env.ANTHROPIC_API_KEY || 'your-anthropic-api-key',
      description: 'Anthropic API密钥',
      type: 'text',
      category: 'llm'
    },
    {
      key: 'DEEPSEEK_API_KEY',
      value: process.env.DEEPSEEK_API_KEY || 'your-deepseek-api-key',
      description: 'Deepseek API密钥',
      type: 'text',
      category: 'llm'
    },
    {
      key: 'GEMINI_API_KEY',
      value: process.env.GEMINI_API_KEY || 'your-gemini-api-key',
      description: 'Gemini API密钥',
      type: 'text',
      category: 'llm'
    },
    {
      key: 'GROK_API_KEY',
      value: process.env.GROK_API_KEY || 'your-grok-api-key',
      description: 'Grok API密钥',
      type: 'text',
      category: 'llm'
    },
    // 选择器配置
    {
      key: 'enable_model_selector',
      value: 'true',
      description: '是否启用模型自动选择',
      type: 'boolean',
      category: 'selector'
    },
    {
      key: 'enable_agent_selector',
      value: 'true',
      description: '是否启用Agent自动选择',
      type: 'boolean',
      category: 'selector'
    },
    {
      key: 'model_selector_prompt',
      value: '',
      description: '模型选择器提示词模板',
      type: 'text',
      category: 'selector'
    },
    {
      key: 'agent_selector_prompt',
      value: '',
      description: 'Agent选择器提示词模板',
      type: 'text',
      category: 'selector'
    }
  ];

  for (const config of serverConfigs) {
    try {
      // 尝试检查配置是否已存在
      let existingConfig = null;
      try {
        existingConfig = await prisma.SystemConfig.findUnique({
          where: { key: config.key }
        });
      } catch (error) {
        console.log(chalk.yellow(`查询系统配置表失败，可能是表不存在: ${error.message}`));
        // 表不存在，继续创建配置
      }

      // 如果配置不存在或者是clearExisting模式，则设置配置
      if (!existingConfig || clearExisting) {
        await setConfig(
          config.key,
          config.value,
          config.description,
          config.type,
          config.category
        );
      } else {
        console.log(chalk.blue(`配置 ${config.key} 已存在，保留现有配置`));
      }
    } catch (error) {
      console.error(chalk.red(`设置配置 ${config.key} 失败: ${error.message}`));
      // 继续处理其他配置
    }
  }
}

// 初始化系统函数
export async function initializeSystem(clearExisting = false) {
  console.log(chalk.blue('开始初始化系统...'));

  // 检查数据库连接
  try {
    // 尝试执行一个简单的查询来检查数据库连接
    await prisma.$queryRaw`SELECT 1`;
    console.log(chalk.blue('数据库连接成功，继续初始化...'));
  } catch (dbError) {
    console.log(chalk.red('数据库连接失败，请检查数据库配置'));
    return {
      success: false,
      message: '数据库连接失败，请检查数据库配置',
      error: dbError.message
    };
  }

  // 检查是否需要运行迁移
  let tablesExist = true;
  try {
    await prisma.$queryRaw`SELECT 1 FROM model_configs LIMIT 1`;
  } catch (error) {
    tablesExist = false;
    console.log(chalk.yellow('数据库表不完整，可能需要运行迁移命令'));
  }

  if (!tablesExist) {
    console.log(chalk.yellow('请先运行迁移命令: npx prisma migrate dev'));
    console.log(chalk.yellow('或者运行: npx prisma db push'));
    return {
      success: false,
      message: '数据库表不存在，请先运行迁移命令',
      error: '数据库表结构不完整'
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

      // 最后删除所有系统配置
      await prisma.systemConfig.deleteMany({});
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
    const adminCount = await prisma.Admin.count();

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

    // 初始化系统配置，传递clearExisting参数
    await initializeSystemConfigs(clearExisting);

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
  // 检查是否有 --reset 参数
  const shouldReset = process.argv.includes('--reset');

  if (shouldReset) {
    console.log(chalk.yellow('正在执行数据库重置操作...'));
    console.log(chalk.red('警告: 此操作将删除所有现有数据并重新初始化系统!'));

    // 延迟3秒执行，给用户一个取消的机会
    console.log(chalk.yellow('3秒后开始执行，按 Ctrl+C 取消...'));

    setTimeout(() => {
      initializeSystem(true)
        .then(() => {
          console.log(chalk.green('数据库已重置并重新初始化完成!'));
          process.exit(0);
        })
        .catch((error) => {
          console.error(chalk.red(`重置失败: ${error.message}`));
          process.exit(1);
        });
    }, 3000);
  } else {
    // 原有的初始化逻辑
    initializeSystem()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}