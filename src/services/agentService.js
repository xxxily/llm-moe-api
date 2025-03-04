import prisma from '../lib/db.js';

export async function getAllAgents(includeInactive = true) {
  const whereClause = includeInactive ? {} : { isActive: true };
  
  return prisma.agent.findMany({
    where: whereClause,
    include: {
      modelConfig: true
    },
    orderBy: {
      priority: 'desc'
    }
  });
}

export async function getAgentById(agentId) {
  return prisma.agent.findUnique({
    where: { agentId },
    include: { modelConfig: true }
  });
}

export async function getDefaultAgent() {
  // 首先尝试获取标记为默认且激活的Agent
  let defaultAgent = await prisma.agent.findFirst({
    where: {
      isDefault: true,
      isActive: true
    },
    include: {
      modelConfig: true
    }
  });
  
  // 如果没有找到默认且激活的Agent，则获取优先级最高且激活的Agent
  if (!defaultAgent) {
    defaultAgent = await prisma.agent.findFirst({
      where: {
        isActive: true
      },
      include: {
        modelConfig: true
      },
      orderBy: {
        priority: 'desc'
      }
    });
  }
  
  return defaultAgent;
}

export async function createAgent(agentData) {
  // 如果新Agent设置为默认，先将其他所有Agent的默认标志取消
  if (agentData.isDefault) {
    await prisma.agent.updateMany({
      where: { isDefault: true },
      data: { isDefault: false }
    });
  }

  return prisma.agent.create({
    data: agentData,
    include: { modelConfig: true }
  });
}

export async function updateAgent(agentId, agentData) {
  // 如果更新为默认，先将其他所有Agent的默认标志取消
  if (agentData.isDefault) {
    await prisma.agent.updateMany({
      where: {
        isDefault: true,
        agentId: { not: agentId }
      },
      data: { isDefault: false }
    });
  }

  return prisma.agent.update({
    where: { agentId },
    data: agentData,
    include: { modelConfig: true }
  });
}

export async function deleteAgent(agentId) {
  return prisma.agent.update({
    where: { agentId },
    data: { isActive: false }
  });
}