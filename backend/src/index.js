/**
 * 卡密系统后端入口文件
 * 基于Cloudflare Workers的API服务
 */

import { Router } from 'itty-router';
import { verifyToken, generateKamiCode } from './utils/auth';
import { errorHandler, AppError } from './utils/error';
import Logger from './utils/logger';
import { initializeAdmin, DEFAULT_ADMIN } from './utils/initAdmin';

// 创建路由器
const router = Router();

// 初始化管理员账号
router.get('/api/init', async (request, env) => {
  try {
    const admin = await initializeAdmin(env);
    return new Response(JSON.stringify({
      success: true,
      message: '管理员账号初始化成功',
      defaultCredentials: {
        username: DEFAULT_ADMIN.username,
        password: DEFAULT_ADMIN.password
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '管理员账号初始化失败: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// 跨域处理中间件
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// 处理OPTIONS请求的中间件
const handleOptions = (request) => {
  return new Response(null, {
    headers: corsHeaders,
    status: 204,
  });
};

// 添加CORS头的中间件
const addCorsHeaders = (response) => {
  const newHeaders = new Headers(response.headers);
  Object.keys(corsHeaders).forEach(key => {
    newHeaders.set(key, corsHeaders[key]);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};

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
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

// 处理OPTIONS请求
router.options('*', handleOptions);

// 公共API路由
router.post('/auth/login', async (request, env) => {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, message: '用户名和密码不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 从KV存储中获取用户信息
    const userKey = `user:${username}`;
    const userData = await env.KAMI_KV.get(userKey, { type: 'json' });
    
    if (!userData) {
      return new Response(JSON.stringify({ success: false, message: '用户不存在' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // 验证密码
    const bcrypt = await import('bcryptjs');
    const passwordMatch = await bcrypt.compare(password, userData.passwordHash);
    
    if (!passwordMatch) {
      return new Response(JSON.stringify({ success: false, message: '密码错误' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // 生成JWT令牌
    const { default: jwt } = await import('./utils/jwt');
    const token = await jwt.sign(
      { id: userData.id, username: userData.username, role: userData.role },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return new Response(JSON.stringify({
      success: true,
      token,
      user: {
        id: userData.id,
        username: userData.username,
        role: userData.role,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('登录失败:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

router.post('/auth/register', async (request, env) => {
  try {
    const { username, password, email } = await request.json();
    
    // 检查用户是否已存在
    const userKey = `user:${username}`;
    const existingUser = await env.KAMI_KV.get(userKey);
    
    if (existingUser) {
      return new Response(JSON.stringify({ success: false, message: '用户名已存在' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
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
      role: 'user', // 默认角色
      createdAt: new Date().toISOString(),
    };


    
    // 存储用户数据
    await env.KAMI_KV.put(userKey, JSON.stringify(newUser));
    await env.KAMI_KV.put(`userId:${userId}`, username);
    
    return new Response(JSON.stringify({
      success: true,
      message: '注册成功',
      user: {
        id: userId,
        username,
        role: 'user',
      },
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// 卡密验证API
router.post('/verify', async (request, env) => {
  try {
    const { code } = await request.json();
    
    // 从KV存储中获取卡密信息
    const kamiKey = `kami:${code}`;
    const kamiData = await env.KAMI_KV.get(kamiKey, { type: 'json' });
    
    if (!kamiData) {
      return new Response(JSON.stringify({ success: false, message: '卡密不存在或已失效' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // 检查卡密状态
    if (kamiData.status === 'used') {
      return new Response(JSON.stringify({ success: false, message: '卡密已被使用' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// 导出处理函数
export default {
  fetch: async (request, env) => {
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    try {
      await rateLimit(request);
      const response = await router.handle(request, env);
      return addCorsHeaders(response || new Response('Not Found', { status: 404 }));
    } catch (error) {
      const errorResponse = errorHandler(error);
      return addCorsHeaders(errorResponse);
    }
  }
};