/**
 * 认证与授权工具函数
 * 包含JWT验证和卡密生成功能
 */

import { AppError } from './error';
import { v4 as uuidv4 } from 'uuid';
import Logger from './logger';

const logger = new Logger();

// CORS 配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, accept, Origin, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

/**
 * 验证JWT令牌中间件
 * @param {Request} request - 请求对象
 * @param {Object} env - 环境变量
 */
export const verifyToken = async (request, env) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('未提供有效的认证令牌');
  }

  const token = authHeader.split(' ')[1];
  const jwt = new JWT(env.JWT_SECRET);
  
  try {
    const payload = await jwt.verify(token);
    return payload;
  } catch (error) {
    throw new Error('无效的认证令牌');
  }
};

/**
 * 用于进行用户认证和权限控制的工具模块
 */
export async function requireAuth(request, env) {
  // 获取Authorization头
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      success: false,
      message: '未授权访问'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  // 提取token
  const token = authHeader.replace('Bearer ', '');
  
  try {
    // 验证token
    const { default: JWT } = await import('./jwt');
    const jwt = new JWT(env.JWT_SECRET);
    const payload = await jwt.verify(token);
    
    // 返回用户信息
    return payload;
  } catch (error) {
    logger.error('Token验证失败', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Token无效或已过期'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * 验证管理员权限
 * @param {Request} request 请求对象
 * @param {Object} env 环境变量
 * @returns {Object|Response} 验证通过返回用户信息，否则返回错误响应
 */
export async function requireAdmin(request, env) {
  try {
    // 先验证用户是否已登录
    const authResult = await requireAuth(request, env);
    
    // 如果返回的是Response对象，说明验证失败
    if (authResult instanceof Response) {
      return authResult;
    }
    
    // 验证是否为管理员
    if (authResult.role !== 'admin') {
      return new Response(JSON.stringify({
        success: false,
        message: '需要管理员权限'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // 验证通过，返回用户信息
    return authResult;
  } catch (error) {
    logger.error('管理员权限验证失败', error);
    return new Response(JSON.stringify({
      success: false,
      message: '权限验证失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * 生成唯一的卡密码
 * @returns {string} - 生成的卡密
 */
export function generateKamiCode() {
  // 使用UUID生成基础随机字符串，并移除连字符
  const uuid = uuidv4().replace(/-/g, '');
  // 转为大写并返回一个16位的字符串
  return uuid.substring(0, 16).toUpperCase();
}

// 默认导出
export default {
  requireAuth,
  requireAdmin,
  generateKamiCode
};
