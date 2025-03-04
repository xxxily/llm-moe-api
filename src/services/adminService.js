// src/services/adminService.js
import prisma from '../lib/db.js';
import bcrypt from 'bcrypt';

// 创建管理员
export async function createAdmin(username, password) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.admin.create({
    data: {
      username,
      password: hashedPassword
    }
  });
}

// 验证管理员登录
export async function validateAdmin(username, password) {
  const admin = await prisma.admin.findUnique({
    where: { username }
  });

  if (!admin) {
    return false;
  }

  return bcrypt.compare(password, admin.password);
}

// 检查管理员是否存在
export async function adminExists(username) {
  const count = await prisma.admin.count({
    where: { username }
  });
  return count > 0;
}