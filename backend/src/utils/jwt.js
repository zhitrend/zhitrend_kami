/**
 * JWT工具函数
 * 用于生成和验证JWT令牌
 */

import { SignJWT, jwtVerify } from 'jose';

class JWT {
  constructor(secret) {
    this.secret = new TextEncoder().encode(secret || 'default_secret_key');
  }

  async sign(payload, options = {}) {
    try {
      // 确保payload是对象
      const data = typeof payload === 'object' ? payload : { sub: payload };
      
      const token = await new SignJWT(data)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(options.expiresIn || '24h')
        .sign(this.secret);
      
      return token;
    } catch (error) {
      console.error('JWT签名错误:', error);
      throw new Error('生成令牌失败');
    }
  }

  async verify(token) {
    try {
      if (!token) throw new Error('令牌不能为空');
      
      const { payload } = await jwtVerify(token, this.secret);
      return payload;
    } catch (error) {
      console.error('JWT验证错误:', error);
      throw new Error('无效的令牌');
    }
  }
}

export default JWT;