/**
 * JWT工具函数
 * 用于生成和验证JWT令牌
 */

// 使用Web Crypto API实现JWT
const jwt = {
  async sign(payload, secret, options = {}) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = options.expiresIn ? parseInt(options.expiresIn) : 86400; // 默认24小时
    
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn
    };
    
    const base64Header = btoa(JSON.stringify(header));
    const base64Payload = btoa(JSON.stringify(tokenPayload));
    
    const encoder = new TextEncoder();
    const data = encoder.encode(`${base64Header}.${base64Payload}`);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      data
    );
    
    const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
    
    return `${base64Header}.${base64Payload}.${base64Signature}`;
  },
  
  async verify(token, secret) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const [base64Header, base64Payload, receivedSignature] = parts;
      
      // 解码并验证header
      const header = JSON.parse(atob(base64Header));
      if (header.alg !== 'HS256') {
        throw new Error('Unsupported algorithm');
      }
      
      // 验证签名
      const encoder = new TextEncoder();
      const data = encoder.encode(`${base64Header}.${base64Payload}`);
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );
      
      const signatureArray = Uint8Array.from(atob(receivedSignature), c => c.charCodeAt(0));
      
      const isValid = await crypto.subtle.verify(
        'HMAC',
        key,
        signatureArray,
        data
      );
      
      if (!isValid) {
        throw new Error('Invalid signature');
      }
      
      // 解码并验证payload
      const payload = JSON.parse(atob(base64Payload));
      
      // 验证过期时间
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error('Token has expired');
      }
      
      return payload;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }
};

export default jwt;