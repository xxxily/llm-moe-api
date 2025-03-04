import fetch from 'node-fetch';
import chalk from 'chalk';
import { getAllModelConfigs, getDefaultModelConfig } from './modelConfigService.js';

// 默认选择器模型配置
const defaultSelectorConfig = {
  modelId: process.env.DEFAULT_MODEL_ID,
  baseUrl: process.env.DEFAULT_BASE_URL,
  apiKey: process.env.DEFAULT_API_KEY
};

// 用于选择模型的提示词模板
const DEFAULT_PROMPT_TEMPLATE = `
你是一个智能模型选择器。根据用户的请求，选择最合适的AI模型进行回答。
以下是可用的模型及其能力描述:

{{MODEL_DESCRIPTIONS}}

用户的请求是: "{{USER_REQUEST}}"

你的任务是选择一个最合适的模型来处理这个请求。请只返回该模型的modelId，无需解释。
`;

// 根据用户请求选择最合适的模型
export async function selectModel(userRequest) {
  try {
    // 只获取激活的模型配置
    const modelConfigs = await getAllModelConfigs(false);
    
    if (modelConfigs.length === 0) {
      console.log(chalk.yellow('没有可用的模型配置，使用默认选择器模型'));
      return defaultSelectorConfig.modelId;
    }

    if (modelConfigs.length === 1) {
      console.log(chalk.green(`只有一个模型可用，使用模型: ${modelConfigs[0].modelId}`));
      return modelConfigs[0].modelId;
    }

    // 构建模型描述
    const modelDescriptions = modelConfigs.map(model => {
      return `modelId: ${model.modelId}
名称: ${model.name}
描述: ${model.description}
能力: ${model.capabilities}
---`;
    }).join('\n');

    // 构建请求提示词
    const prompt = SELECTOR_PROMPT_TEMPLATE
      .replace('{{MODEL_DESCRIPTIONS}}', modelDescriptions)
      .replace('{{USER_REQUEST}}', userRequest);

    // 调用选择器模型
    const response = await fetch(`${defaultSelectorConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${defaultSelectorConfig.apiKey}`
      },
      body: JSON.stringify({
        model: defaultSelectorConfig.modelId,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userRequest }
        ],
        temperature: 0.3,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      throw new Error(`选择器API响应错误: ${response.status}`);
    }

    const data = await response.json();
    const selectedModelId = data.choices[0].message.content.trim();

    // 验证选择的模型是否存在
    const selectedModel = modelConfigs.find(m => m.modelId === selectedModelId);
    if (!selectedModel) {
      // 获取默认模型或优先级最高的模型
      const defaultModel = await getDefaultModelConfig();
      if (defaultModel) {
        console.log(chalk.yellow(`选择器返回了无效的模型ID: ${selectedModelId}，使用默认模型: ${defaultModel.modelId}`));
        return defaultModel.modelId;
      } else {
        console.log(chalk.yellow(`选择器返回了无效的模型ID: ${selectedModelId}，使用优先级最高的模型: ${modelConfigs[0].modelId}`));
        return modelConfigs[0].modelId;
      }
    }

    console.log(chalk.green(`模型选择器选择了模型: ${selectedModelId}`));
    return selectedModelId;
  } catch (error) {
    console.error(chalk.red(`模型选择器错误: ${error.message}`));

    // 获取默认模型或优先级最高的模型
    const defaultModel = await getDefaultModelConfig();
    if (defaultModel) {
      console.log(chalk.yellow(`发生错误，使用默认模型: ${defaultModel.modelId}`));
      return defaultModel.modelId;
    }

    // 如果没有默认模型，则获取所有模型并按优先级排序
    const modelConfigs = await getAllModelConfigs();
    if (modelConfigs.length > 0) {
      console.log(chalk.yellow(`没有默认模型，使用优先级最高的模型: ${modelConfigs[0].modelId}`));
      return modelConfigs[0].modelId;
    }

    console.log(chalk.yellow('没有可用的模型配置，使用默认选择器模型'));
    return defaultSelectorConfig.modelId;
  }
}