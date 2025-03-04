// src/services/llmProxy.js
import fetch from 'node-fetch';
import chalk from 'chalk';
import { getModelConfigById } from './modelConfigService.js';
import { selectAgent } from './agentSelector.js';

// 处理转发到LLM的请求
export async function proxyLLMRequest(modelId, requestData, res) {
  try {
    // 从用户消息中提取请求内容
    const userMessages = requestData.messages || [];
    const userRequestContent = userMessages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join('\n');
      
    // 尝试选择最合适的Agent
    const selectedAgent = await selectAgent(userRequestContent);
    
    // 获取模型配置
    let modelConfig;
    if (selectedAgent && selectedAgent.modelId) {
      // 如果Agent指定了模型，使用Agent指定的模型
      modelConfig = await getModelConfigById(selectedAgent.modelId);
      console.log(chalk.green(`使用Agent指定的模型: ${selectedAgent.modelId}`));
    } else {
      // 否则使用传入的modelId
      modelConfig = await getModelConfigById(modelId);
    }
    
    if (!modelConfig) {
      console.error(chalk.red(`找不到模型配置: ${modelId}`));
      return res.status(404).json({ error: 'Model configuration not found' });
    }
    
    // 处理请求参数
    let processedRequest = { ...requestData };
    
    // 如果选择了Agent，应用Agent的配置
    if (selectedAgent) {
      console.log(chalk.blue(`使用Agent: ${chalk.bold(selectedAgent.agentId)} 处理请求`));
      
      // 应用Agent的系统提示词
      if (selectedAgent.systemPrompt) {
        // 如果有系统消息，替换或添加
        if (processedRequest.messages.some(msg => msg.role === 'system')) {
          processedRequest.messages = processedRequest.messages.map(msg => {
            if (msg.role === 'system') {
              return { role: 'system', content: selectedAgent.systemPrompt };
            }
            return msg;
          });
        } else {
          // 添加系统消息
          processedRequest.messages.unshift({
            role: 'system',
            content: selectedAgent.systemPrompt
          });
        }
      }
      
      // 应用Agent的其他参数
      if (selectedAgent.temperature !== undefined) {
        processedRequest.temperature = selectedAgent.temperature;
      }
      
      if (selectedAgent.topP !== undefined) {
        processedRequest.top_p = selectedAgent.topP;
      }
      
      if (selectedAgent.maxTokens !== undefined && selectedAgent.maxTokens > 0) {
        processedRequest.max_tokens = selectedAgent.maxTokens;
      }
      
      // 如果Agent有自己的API密钥
      if (selectedAgent.apiKey) {
        modelConfig.apiKey = selectedAgent.apiKey;
      }
    } else {
      console.log(chalk.blue(`没有选择Agent，使用模型 ${chalk.bold(modelId)} 处理请求`));
      
      // 如果没有选择Agent，但模型有系统提示词
      if (modelConfig.prompt && processedRequest.messages) {
        // 如果第一条消息是系统消息，则修改它
        if (processedRequest.messages[0]?.role === 'system') {
          const originalContent = processedRequest.messages[0].content;
          processedRequest.messages[0].content = `${modelConfig.prompt}\n\n${originalContent}`;
        } else {
          // 否则，添加一条系统消息
          processedRequest.messages.unshift({
            role: 'system',
            content: modelConfig.prompt
          });
        }
      }
    }
    
    // 设置API调用参数
    const apiUrl = `${modelConfig.baseUrl}/chat/completions`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${modelConfig.apiKey}`
    };
    
    // 判断是否为流式请求
    const isStreamRequest = processedRequest.stream === true;
    
    if (isStreamRequest) {
      // 流式请求处理
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(processedRequest)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(chalk.red(`LLM API错误: ${response.status}, ${errorText}`));
        return res.status(response.status).json({ error: errorText });
      }
      
      // 设置响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // 将响应流传递给客户端
      response.body.pipe(res);
    } else {
      // 非流式请求处理
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(processedRequest)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(chalk.red(`LLM API错误: ${response.status}, ${errorText}`));
        return res.status(response.status).json({ error: errorText });
      }
      
      const data = await response.json();
      return res.json(data);
    }
  } catch (error) {
    console.error(chalk.red(`代理请求错误: ${error.message}`));
    return res.status(500).json({ error: error.message });
  }
}