/**
 * 卡密相关API路由
 */

import { Router } from 'itty-router';
import { requireAuth, requireAdmin, generateKamiCode } from '../utils/auth';
import Logger from '../utils/logger';

// CORS 配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, accept, Origin, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// 创建路由器，不设置基础路径
const router = Router();
const logger = new Logger();

// 获取卡密列表 (需要管理员权限)
router.get('/list', async (request, env) => {
  const authResponse = await requireAdmin(request, env);
  if (authResponse instanceof Response) return authResponse;

  try {
    // 从 URL 获取查询参数
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    
    // 获取所有卡密
    const list = await env.KAMI_KV.list({ prefix: 'kami:' });
    if (!list || !list.keys) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          total: 0,
          items: []
        }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // 获取所有卡密数据
    const kamiPromises = list.keys.map(key => env.KAMI_KV.get(key.name, { type: 'json' }));
    let kamis = await Promise.all(kamiPromises);
    
    // 过滤无效数据和状态过滤
    kamis = kamis.filter(kami => Boolean(kami) && (!status || kami.status === status));
    
    // 计算总数
    const total = kamis.length;
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedKamis = kamis.slice(startIndex, endIndex);
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        total,
        items: paginatedKamis
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    logger.error('获取卡密列表失败', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || '获取卡密列表失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// 获取卡密统计信息 (需要管理员权限)
router.get('/stats', async (request, env) => {
  const authResponse = await requireAdmin(request, env);
  if (authResponse instanceof Response) return authResponse;

  try {
    // 获取所有卡密
    const list = await env.KAMI_KV.list({ prefix: 'kami:' });
    if (!list || !list.keys) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          totalKami: 0,
          usedKami: 0,
          unusedKami: 0,
          totalRevenue: 0
        }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // 获取所有卡密数据
    const kamiPromises = list.keys.map(key => env.KAMI_KV.get(key.name, { type: 'json' }));
    const kamis = await Promise.all(kamiPromises);
    
    // 统计数据
    const filteredKamis = kamis.filter(Boolean);
    const stats = {
      totalKami: filteredKamis.length,
      usedKami: filteredKamis.filter(kami => kami.status === 'used').length,
      unusedKami: filteredKamis.filter(kami => kami.status !== 'used').length,
      totalRevenue: filteredKamis.reduce((sum, kami) => sum + (parseFloat(kami.value) || 0), 0)
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: stats
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    logger.error('获取卡密统计失败', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || '获取卡密统计失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// 获取最近生成的卡密
router.get('/recent', async (request, env) => {
  const authResponse = await requireAdmin(request, env);
  if (authResponse instanceof Response) return authResponse;

  try {
    // 从 URL 获取 limit 参数
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 5;
    
    // 获取所有卡密
    const list = await env.KAMI_KV.list({ prefix: 'kami:' });
    if (!list || !list.keys) {
      return new Response(JSON.stringify({
        success: true,
        data: []
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // 获取所有卡密数据
    const kamiPromises = list.keys.map(key => env.KAMI_KV.get(key.name, { type: 'json' }));
    const kamis = await Promise.all(kamiPromises);
    
    // 过滤并排序
    const validKamis = kamis
      .filter(Boolean)
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, limit);
    
    return new Response(JSON.stringify({
      success: true,
      data: validKamis
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    logger.error('获取最近卡密失败', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || '获取最近卡密失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// 生成卡密 (需要管理员权限)
router.post('/generate', async (request, env) => {
  const authResponse = await requireAdmin(request, env);
  if (authResponse instanceof Response) return authResponse;

  try {
    const { count = 1, days = 30 } = await request.json();
    const kamiList = [];

    for (let i = 0; i < count; i++) {
      const kami = generateKamiCode();
      const data = {
        code: kami,
        status: 'unused',
        days: parseInt(days),
        createdAt: Date.now(),
        usedAt: null,
        usedBy: null
      };
      await env.KAMI_KV.put(`kami:${kami}`, JSON.stringify(data));
      kamiList.push(data);
    }

    return new Response(JSON.stringify({
      success: true,
      data: kamiList
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    logger.error('生成卡密失败', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// 获取卡密使用趋势数据
router.get('/usage-trend', async (request, env) => {
  const authResponse = await requireAdmin(request, env);
  if (authResponse instanceof Response) return authResponse;

  try {
    // 获取日期范围参数
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 默认30天
    const end = endDate ? new Date(endDate) : new Date();
    
    // 获取所有卡密
    const list = await env.KAMI_KV.list({ prefix: 'kami:' });
    if (!list || !list.keys) {
      return new Response(JSON.stringify({
        success: true,
        data: []
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // 获取所有卡密数据
    const kamiPromises = list.keys.map(key => env.KAMI_KV.get(key.name, { type: 'json' }));
    const kamis = await Promise.all(kamiPromises);
    
    // 初始化日期范围内的每一天
    const usageData = [];
    const dateMap = new Map();
    
    // 生成日期范围
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, {
        date: dateStr,
        generated: 0,
        used: 0
      });
    }
    
    // 统计每天的生成和使用情况
    kamis.filter(Boolean).forEach(kami => {
      // 处理创建日期
      if (kami.createdAt) {
        const createdDate = new Date(kami.createdAt).toISOString().split('T')[0];
        if (dateMap.has(createdDate)) {
          const dayData = dateMap.get(createdDate);
          dayData.generated += 1;
          dateMap.set(createdDate, dayData);
        }
      }
      
      // 处理使用日期
      if (kami.status === 'used' && kami.usedAt) {
        const usedDate = new Date(kami.usedAt).toISOString().split('T')[0];
        if (dateMap.has(usedDate)) {
          const dayData = dateMap.get(usedDate);
          dayData.used += 1;
          dateMap.set(usedDate, dayData);
        }
      }
    });
    
    // 转换为前端需要的格式
    dateMap.forEach((value, key) => {
      usageData.push({
        date: key,
        type: '生成',
        value: value.generated
      });
      
      usageData.push({
        date: key,
        type: '使用',
        value: value.used
      });
    });
    
    // 按日期排序
    usageData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return new Response(JSON.stringify({
      success: true,
      data: usageData
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    logger.error('获取卡密使用趋势失败', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || '获取卡密使用趋势失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// 获取卡密类型分布数据
router.get('/type-distribution', async (request, env) => {
  const authResponse = await requireAdmin(request, env);
  if (authResponse instanceof Response) return authResponse;

  try {
    // 获取所有卡密
    const list = await env.KAMI_KV.list({ prefix: 'kami:' });
    if (!list || !list.keys) {
      return new Response(JSON.stringify({
        success: true,
        data: []
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // 获取所有卡密数据
    const kamiPromises = list.keys.map(key => env.KAMI_KV.get(key.name, { type: 'json' }));
    const kamis = await Promise.all(kamiPromises);
    
    // 统计各类型数量
    const typeCount = {};
    kamis.filter(Boolean).forEach(kami => {
      const type = kami.type || '标准';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    // 转换为前端需要的格式
    const typeData = Object.entries(typeCount).map(([type, value]) => ({
      type,
      value
    }));
    
    return new Response(JSON.stringify({
      success: true,
      data: typeData
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    logger.error('获取卡密类型分布失败', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || '获取卡密类型分布失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// 获取收入趋势数据
router.get('/revenue-trend', async (request, env) => {
  const authResponse = await requireAdmin(request, env);
  if (authResponse instanceof Response) return authResponse;

  try {
    // 获取所有卡密
    const list = await env.KAMI_KV.list({ prefix: 'kami:' });
    if (!list || !list.keys) {
      return new Response(JSON.stringify({
        success: true,
        data: []
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // 获取所有卡密数据
    const kamiPromises = list.keys.map(key => env.KAMI_KV.get(key.name, { type: 'json' }));
    const kamis = await Promise.all(kamiPromises);
    
    // 按月统计收入
    const monthlyRevenue = {};
    
    kamis.filter(Boolean).forEach(kami => {
      if (kami.status === 'used' && kami.usedAt) {
        const date = new Date(kami.usedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const value = parseFloat(kami.value) || 0;
        
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + value;
      }
    });
    
    // 获取最近12个月
    const revenueData = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      revenueData.unshift({
        month: monthKey,
        revenue: monthlyRevenue[monthKey] || 0
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: revenueData
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    logger.error('获取收入趋势数据失败', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || '获取收入趋势数据失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// 验证卡密
router.post('/verify', async (request, env) => {
  const authResponse = await requireAuth(request, env);
  if (authResponse instanceof Response) return authResponse;

  try {
    const { code } = await request.json();
    
    if (!code) {
      throw new Error('卡密不能为空');
    }
    
    const kamiData = await env.KAMI_KV.get(`kami:${code}`, { type: 'json' });
    
    if (!kamiData) {
      throw new Error('卡密不存在');
    }
    
    if (kamiData.status !== 'unused') {
      throw new Error('卡密已被使用');
    }
    
    if (new Date(kamiData.expiresAt) < new Date()) {
      throw new Error('卡密已过期');
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: kamiData
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    logger.error('验证卡密失败', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// 使用卡密
router.post('/use', async (request, env) => {
  const authResponse = await requireAuth(request, env);
  if (authResponse instanceof Response) return authResponse;
  const user = authResponse;

  try {
    const { code } = await request.json();
    const kamiKey = `kami:${code}`;
    const kamiData = await env.KAMI_KV.get(kamiKey, { type: 'json' });

    if (!kamiData) {
      return new Response(JSON.stringify({
        success: false,
        message: '卡密不存在'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (kamiData.status === 'used') {
      return new Response(JSON.stringify({
        success: false,
        message: '卡密已被使用'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 更新卡密状态
    kamiData.status = 'used';
    kamiData.usedAt = Date.now();
    kamiData.usedBy = user.sub;
    await env.KAMI_KV.put(kamiKey, JSON.stringify(kamiData));

    // 更新用户会员时间
    const userData = await env.USER_KV.get(user.sub, { type: 'json' });
    const currentTime = Date.now();
    const newExpireTime = Math.max(userData.expireTime || currentTime, currentTime) + (kamiData.days * 24 * 60 * 60 * 1000);
    userData.expireTime = newExpireTime;
    await env.USER_KV.put(user.sub, JSON.stringify(userData));

    return new Response(JSON.stringify({
      success: true,
      data: {
        expireTime: newExpireTime
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    logger.error('使用卡密失败', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// 添加 OPTIONS 请求处理
router.options('*', () => {
  return new Response(null, {
    headers: corsHeaders
  });
});

export default router;