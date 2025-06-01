/**
 * 卡密系统后端入口文件
 * 基于Cloudflare Workers的API服务
 */

import { Router } from 'itty-router';
import { verifyToken, generateKamiCode } from './utils/auth';
import { errorHandler, AppError } from './utils/error';
import Logger from './utils/logger';
import { initializeAdmin, DEFAULT_ADMIN } from './utils/initAdmin';
import kamiRouter from './routes/kami';

// 创建路由器
const router = Router();

// CORS 配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, accept, Origin, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// 处理 OPTIONS 请求
function handleOptions(request) {
  if (request.headers.get('Origin') !== null) {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': request.headers.get('Origin'),
      },
      status: 204,
    });
  }
  return new Response(null, {
    headers: corsHeaders,
    status: 204,
  });
}

// 添加 CORS 头到响应
function addCorsHeaders(response) {
  const headers = new Headers(response.headers || {});
  const origin = headers.get('Origin') || '*';
  
  Object.keys(corsHeaders).forEach((key) => {
    if (key === 'Access-Control-Allow-Origin') {
      headers.set(key, origin);
    } else {
      headers.set(key, corsHeaders[key]);
    }
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// 请求频率限制中间件
const rateLimits = new Map();
const rateLimit = async (request) => {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const windowMs = 60000; // 1分钟窗口期
  const maxRequests = 60; // 每个窗口期最大请求数

  const userRateLimit = rateLimits.get(ip) || {
    requests: [],
    blocked: false,
    blockedUntil: 0
  };

  // 检查是否在封禁期
  if (userRateLimit.blocked && now < userRateLimit.blockedUntil) {
    throw new Error('请求过于频繁，请稍后再试');
  }

  // 清理过期的请求记录
  userRateLimit.requests = userRateLimit.requests.filter(time => now - time < windowMs);

  // 检查请求频率
  if (userRateLimit.requests.length >= maxRequests) {
    userRateLimit.blocked = true;
    userRateLimit.blockedUntil = now + 300000; // 封禁5分钟
    rateLimits.set(ip, userRateLimit);
    throw new Error('请求过于频繁，请稍后再试');
  }

  // 记录新的请求
  userRateLimit.requests.push(now);
  rateLimits.set(ip, userRateLimit);
};

// 添加根路由处理
router.get('/', () => {
  return new Response(JSON.stringify({
    success: true,
    message: '卡密系统API服务正在运行'
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
});

// 处理OPTIONS请求
router.options('*', handleOptions);

// 注册卡密路由
router.all('/api/kami/*', async (request, env, ctx) => {
  // 修改请求路径，移除 /api/kami 前缀
  const url = new URL(request.url);
  const pathname = url.pathname.replace('/api/kami', '');
  
  // 创建新的请求对象，而不是修改原有对象
  const newRequest = new Request(new URL(pathname, url.origin), request);
  
  // 处理路由请求
  const response = await kamiRouter.handle(newRequest, env, ctx);
  
  // 确保响应包含 CORS 头
  return addCorsHeaders(response);
});

// 公共API路由
router.post('/api/auth/login', async (request, env) => {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({
        success: false,
        message: '用户名和密码不能为空'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 从KV存储中获取用户信息
    const userKey = `user:${username}`;
    const userData = await env.KAMI_KV.get(userKey, { type: 'json' });
    
    if (!userData) {
      return new Response(JSON.stringify({
        success: false,
        message: '用户不存在'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 验证密码
    const bcrypt = await import('bcryptjs');
    const passwordMatch = await bcrypt.compare(password, userData.passwordHash);

    if (!passwordMatch) {
      return new Response(JSON.stringify({
        success: false,
        message: '密码错误'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 生成JWT令牌
    const { default: JWT } = await import('./utils/jwt');
    const jwt = new JWT(env.JWT_SECRET);
    const token = await jwt.sign({
      id: userData.id,
      username: userData.username,
      role: userData.role
    });

    return new Response(JSON.stringify({
      success: true,
      token,
      user: {
        id: userData.id,
        username: userData.username,
        role: userData.role
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// 注册路由
router.post('/api/auth/register', async (request, env) => {
  try {
    const { username, password, email } = await request.json();
    
    // 检查用户是否已存在
    const userKey = `user:${username}`;
    const existingUser = await env.KAMI_KV.get(userKey);
    
    if (existingUser) {
      return new Response(JSON.stringify({
        success: false,
        message: '用户名已存在'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // 生成用户ID和密码哈希
    const { v4: uuidv4 } = await import('uuid');
    const bcrypt = await import('bcryptjs');
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 创建用户对象
    const newUser = {
      id: userId,
      username,
      email,
      passwordHash,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    
    // 存储用户数据
    await env.KAMI_KV.put(userKey, JSON.stringify(newUser));
    
    return new Response(JSON.stringify({
      success: true,
      message: '注册成功',
      user: {
        id: userId,
        username,
        role: 'user'
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// 卡密验证API
router.post('/api/verify', async (request, env) => {
    debugger
    console.log("------", request);
    
  try {
    const { code, password } = await request.json();
    
    // 从KV存储中获取卡密信息
    const kamiKey = `kami:${code}`;
    const kamiData = await env.KAMI_KV.get(kamiKey, { type: 'json' });
    
    if (!kamiData) {
      return new Response(JSON.stringify({ success: false, message: '卡密不存在或已失效' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // 验证密码（如果提供了密码且卡密有密码字段）
    if (password && kamiData.password && password !== kamiData.password) {
      return new Response(JSON.stringify({ success: false, message: '卡密密码错误' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // 检查卡密状态
    if (kamiData.status === 'used') {
      return new Response(JSON.stringify({ success: false, message: '卡密已被使用' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // 更新卡密状态
    kamiData.status = 'used';
    kamiData.usedAt = new Date().toISOString();
    await env.KAMI_KV.put(kamiKey, JSON.stringify(kamiData));
    
    return new Response(JSON.stringify({
      success: true,
      message: '卡密验证成功',
      data: {
        code: kamiData.code,
        type: kamiData.type,
        value: kamiData.value,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// 初始化管理员账号
router.get('/api/init', async (request, env) => {
  try {
    // 检查是否已经初始化
    const adminKey = 'user:admin';
    const existingAdmin = await env.KAMI_KV.get(adminKey);
    
    if (existingAdmin) {
      return new Response(JSON.stringify({
        success: false,
        message: '管理员账号已存在'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 生成管理员账号
    const bcrypt = await import('bcryptjs');
    const { v4: uuidv4 } = await import('uuid');
    
    const adminData = {
      id: uuidv4(),
      username: 'admin',
      passwordHash: await bcrypt.hash('admin123', 10),
      email: 'admin@example.com',
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    // 存储管理员账号
    await env.KAMI_KV.put(adminKey, JSON.stringify(adminData));

    return new Response(JSON.stringify({
      success: true,
      message: '管理员账号初始化成功',
      defaultCredentials: {
        username: 'admin',
        password: 'admin123'
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '管理员账号初始化失败: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// 主处理函数
export default {
  async fetch(request, env, ctx) {
    try {
      // 处理 OPTIONS 请求
      if (request.method === 'OPTIONS') {
        return handleOptions(request);
      }

      // 应用请求频率限制
      await rateLimit(request);

      // 处理路由请求
      const response = await router.handle(request, env, ctx);
      
      // 确保所有响应都添加 CORS 头
      return addCorsHeaders(response);
    } catch (error) {
      // 错误处理
      const errorResponse = new Response(JSON.stringify({
        success: false,
        message: error.message
      }), {
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' }
      });
      
      // 确保错误响应也添加 CORS 头
      return addCorsHeaders(errorResponse);
    }
  }
};