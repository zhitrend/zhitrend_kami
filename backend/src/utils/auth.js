/**
 * 认证工具函数
 * 用于验证JWT令牌和用户权限
 */

import jwt from './jwt';

/**
 * 验证JWT令牌
 * @param {string} token - JWT令牌
 * @param {string} secret - 密钥
 * @returns {object} - 解码后的payload
 */
const verifyToken = async (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error(`认证失败: ${error.message}`);
  }
};

/**
 * 验证用户角色
 * @param {object} user - 用户对象
 * @param {string[]} roles - 允许的角色列表
 * @returns {boolean} - 是否有权限
 */
const checkRole = (user, roles) => {
  if (!user || !user.role) {
    return false;
  }
  return roles.includes(user.role);
};

/**
 * 生成随机卡密码
 * @returns {string} - 随机卡密码
 */
const generateKamiCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    // 每4个字符添加一个分隔符
    if (i % 4 === 3 && i < 15) {
      result += '-';
    }
  }
  return result;
};

export { verifyToken, checkRole, generateKamiCode };