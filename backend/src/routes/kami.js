/**
 * 卡密相关API路由
 */

import { Router } from 'itty-router';
import { verifyToken } from '../utils/auth';

const router = Router({ base: '/api/kami' });

// 获取卡密列表
router.get('/list', verifyToken, async (request, env) => {
  try {
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // 获取所有卡密的key列表
    const kamiKeys = await env.KAMI_KV.list({ prefix: 'kami:' });
    const total = kamiKeys.keys.length;
    
    // 分页获取卡密数据
    const kamiPromises = kamiKeys.keys
      .slice(offset, offset + limit)
      .map(key => env.KAMI_KV.get(key.name, { type: 'json' }));
    
    const kamis = await Promise.all(kamiPromises);
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        items: kamis.filter(Boolean),
        total,
        page,
        limit
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// 获取卡密统计信息
router.get('/stats', verifyToken, async (request, env) => {
  try {
    const kamiKeys = await env.KAMI_KV.list({ prefix: 'kami:' });
    const kamiPromises = kamiKeys.keys.map(key => env.KAMI_KV.get(key.name, { type: 'json' }));
    const kamis = await Promise.all(kamiPromises);
    
    const stats = {
      totalKami: kamis.length,
      usedKami: kamis.filter(kami => kami && kami.status === 'used').length,
      unusedKami: kamis.filter(kami => kami && kami.status === 'unused').length,
      totalRevenue: kamis.reduce((sum, kami) => sum + (kami ? parseFloat(kami.value) || 0 : 0), 0)
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: stats
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// 获取最近生成的卡密
router.get('/recent', verifyToken, async (request, env) => {
  try {
    const limit = 5; // 最近5条记录
    const kamiKeys = await env.KAMI_KV.list({ prefix: 'kami:', limit });
    const kamiPromises = kamiKeys.keys.map(key => env.KAMI_KV.get(key.name, { type: 'json' }));
    const kamis = await Promise.all(kamiPromises);
    
    return new Response(JSON.stringify({
      success: true,
      data: kamis.filter(Boolean)
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

export default router;