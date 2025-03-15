/**
 * 初始化管理员账号
 */

import bcrypt from 'bcryptjs';

const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123',
  role: 'admin'
};

async function initializeAdmin(env) {
  try {
    // 检查是否已存在管理员账号
    const adminExists = await env.KAMI_KV.get('user:admin');
    if (adminExists) {
      console.log('管理员账号已存在，跳过初始化');
      return;
    }

    // 对密码进行加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, salt);

    // 创建管理员账号
    const admin = {
      id: 'admin',
      username: DEFAULT_ADMIN.username,
      passwordHash: hashedPassword,
      role: DEFAULT_ADMIN.role,
      createdAt: new Date().toISOString()
    };

    // 存储到KV中
    await env.KAMI_KV.put('user:admin', JSON.stringify(admin));
    console.log('管理员账号初始化成功');

    return admin;
  } catch (error) {
    console.error('初始化管理员账号失败:', error);
    throw error;
  }
}

export { DEFAULT_ADMIN, initializeAdmin };