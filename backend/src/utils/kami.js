import { v4 as uuidv4 } from 'uuid';

export class KamiGenerator {
  constructor() {
    this.prefix = 'KAMI';
    this.separator = '-';
  }

  generate(length = 16) {
    // 生成基础随机字符串
    const randomBytes = uuidv4().replace(/-/g, '').toUpperCase();
    
    // 将卡密分成4个部分
    const parts = [];
    for (let i = 0; i < 16; i += 4) {
      parts.push(randomBytes.substring(i, i + 4));
    }
    
    // 组合成最终的卡密格式：KAMI-XXXX-XXXX-XXXX-XXXX
    return `${this.prefix}${this.separator}${parts.join(this.separator)}`;
  }

  validate(kami) {
    // 验证卡密格式
    const pattern = new RegExp(`^${this.prefix}${this.separator}[A-Z0-9]{4}${this.separator}[A-Z0-9]{4}${this.separator}[A-Z0-9]{4}${this.separator}[A-Z0-9]{4}$`);
    return pattern.test(kami);
  }
}

// 创建一个默认实例
const defaultGenerator = new KamiGenerator();
export default defaultGenerator; 