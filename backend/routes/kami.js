import { Router } from 'express';
const router = Router();

// 卡密验证路由
router.post('/verify', async (req, res) => {
  try {
    const { code } = req.body;
    
    // 1. 查询卡密
    const kami = await KamiModel.findOne({ code });
    if (!kami) {
      return res.status(404).json({
        success: false,
        message: '卡密不存在'
      });
    }

    // 2. 检查卡密状态
    if (kami.status === 'used') {
      return res.status(400).json({
        success: false,
        message: '卡密已被使用'
      });
    }

    if (kami.status === 'expired') {
      return res.status(400).json({
        success: false,
        message: '卡密已过期'
      });
    }

    // 3. 更新卡密状态
    kami.status = 'used';
    kami.usedAt = new Date();
    await kami.save();

    // 4. 返回成功响应
    res.json({
      success: true,
      data: {
        code: kami.code,
        days: kami.days,
        createdAt: kami.createdAt,
        usedAt: kami.usedAt
      }
    });

  } catch (error) {
    console.error('验证卡密出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

export default router;