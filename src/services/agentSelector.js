import fetch from 'node-fetch';
import chalk from 'chalk';
import { getAllAgents, getDefaultAgent } from './agentService.js';

// 默认选择器模型配置
const defaultSelectorConfig = {
  modelId: process.env.SELECTOR_MODEL_ID || 'gpt-4',
  baseUrl: process.env.SELECTOR_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.SELECTOR_API_KEY
};

// 用于选择Agent的提示词模板
const AGENT_SELECTOR_PROMPT_TEMPLATE = `
你是一个智能Agent选择器。根据用户的请求，选择最合适的Agent进行回答。
以下是可用的Agent及其能力描述:

{{AGENT_DESCRIPTIONS}}

用户的请求是: "{{USER_REQUEST}}"

你的任务是选择一个最合适的Agent来处理这个请求。请只返回该Agent的agentId，无需解释。
`;

// 根据用户请求选择最合适的Agent
export async function selectAgent(userRequest) {
  try {
    // 只获取激活的Agent
    const agents = await getAllAgents(false);
    
    if (agents.length === 0) {
      console.log(chalk.yellow('没有可用的Agent配置，返回null'));
      return null;
    }
    
    if (agents.length === 1) {
      console.log(chalk.green(`只有一个Agent可用，使用Agent: ${agents[0].agentId}`));
      return agents[0];
    }
    
    // 构建Agent描述
    const agentDescriptions = agents.map(agent => {
      return `agentId: ${agent.agentId}
名称: ${agent.name}
描述: ${agent.description}
能力: ${agent.capabilities}
${agent.modelId ? `使用模型: ${agent.modelId}` : ''}
---`;
    }).join('\n');
    
    // 构建请求提示词
    const prompt = AGENT_SELECTOR_PROMPT_TEMPLATE
      .replace('{{AGENT_DESCRIPTIONS}}', agentDescriptions)
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
      throw new Error(`Agent选择器API响应错误: ${response.status}`);
    }
    
    const data = await response.json();
    const selectedAgentId = data.choices[0].message.content.trim();
    
    // 验证选择的Agent是否存在
    const selectedAgent = agents.find(a => a.agentId === selectedAgentId);
    if (!selectedAgent) {
      // 获取默认Agent或优先级最高的Agent
      const defaultAgent = await getDefaultAgent();
      if (defaultAgent) {
        console.log(chalk.yellow(`选择器返回了无效的Agent ID: ${selectedAgentId}，使用默认或优先级最高的Agent: ${defaultAgent.agentId}`));
        return defaultAgent;
      }
      return null;
    }
    
    console.log(chalk.green(`Agent选择器选择了Agent: ${selectedAgentId}`));
    return selectedAgent;
  } catch (error) {
    console.error(chalk.red(`Agent选择器错误: ${error.message}`));
    
    try {
      // 获取默认Agent或优先级最高的Agent
      const defaultAgent = await getDefaultAgent();
      if (defaultAgent) {
        console.log(chalk.yellow(`发生错误，使用默认或优先级最高的Agent: ${defaultAgent.agentId}`));
        return defaultAgent;
      }
    } catch (innerError) {
      console.error(chalk.red(`获取默认Agent失败: ${innerError.message}`));
    }
    
    return null;
  }
}