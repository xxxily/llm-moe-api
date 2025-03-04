// src/services/modelConfigService.js
import prisma from '../lib/db.js';

export async function getAllModelConfigs(includeInactive = true) {
  const whereClause = includeInactive ? {} : { isActive: true };
  
  return prisma.modelConfig.findMany({
    where: whereClause,
    orderBy: {
      priority: 'desc'
    }
  });
}

export async function getModelConfigById(modelId) {
  return prisma.modelConfig.findUnique({
    where: { modelId }
  });
}

export async function getDefaultModelConfig() {
  // 首先尝试获取标记为默认且激活的模型
  let defaultModel = await prisma.modelConfig.findFirst({
    where: {
      isDefault: true,
      isActive: true
    }
  });
  
  // 如果没有找到默认且激活的模型，则获取优先级最高且激活的模型
  if (!defaultModel) {
    defaultModel = await prisma.modelConfig.findFirst({
      where: {
        isActive: true
      },
      orderBy: {
        priority: 'desc'
      }
    });
  }
  
  return defaultModel;
}

export async function createModelConfig(configData) {
  // 如果新模型设置为默认，先将其他所有模型的默认标志取消
  if (configData.isDefault) {
    await prisma.modelConfig.updateMany({
      where: { isDefault: true },
      data: { isDefault: false }
    });
  }
  
  return prisma.modelConfig.create({
    data: configData
  });
}

export async function updateModelConfig(modelId, configData) {
  // 如果更新为默认，先将其他所有模型的默认标志取消
  if (configData.isDefault) {
    await prisma.modelConfig.updateMany({
      where: { 
        isDefault: true,
        modelId: { not: modelId }
      },
      data: { isDefault: false }
    });
  }
  
  return prisma.modelConfig.update({
    where: { modelId },
    data: configData
  });
}

export async function deleteModelConfig(modelId) {
  return prisma.modelConfig.update({
    where: { modelId },
    data: { isActive: false }
  });
}

export async function modelConfigExists(modelId) {
  const count = await prisma.modelConfig.count({
    where: { modelId }
  });
  return count > 0;
}