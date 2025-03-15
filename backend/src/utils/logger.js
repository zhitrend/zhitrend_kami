/**
 * 日志记录工具函数
 */

const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

class Logger {
  constructor(env) {
    this.env = env;
  }

  async log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };

    // 存储日志到KV存储
    const logKey = `log:${timestamp}`;
    await this.env.KAMI_KV.put(logKey, JSON.stringify(logEntry));

    // 如果是错误日志，保存更长时间
    if (level === LOG_LEVELS.ERROR) {
      const errorKey = `error:${timestamp}`;
      await this.env.KAMI_KV.put(errorKey, JSON.stringify(logEntry), {
        expirationTtl: 7 * 24 * 60 * 60 // 保存7天
      });
    }

    // 开发环境下在控制台输出日志
    if (this.env.ENVIRONMENT === 'development') {
      console.log(`[${level.toUpperCase()}] ${message}`, data);
    }
  }

  debug(message, data) {
    return this.log(LOG_LEVELS.DEBUG, message, data);
  }

  info(message, data) {
    return this.log(LOG_LEVELS.INFO, message, data);
  }

  warn(message, data) {
    return this.log(LOG_LEVELS.WARN, message, data);
  }

  error(message, data) {
    return this.log(LOG_LEVELS.ERROR, message, data);
  }

  async getErrorLogs(limit = 50) {
    const errors = [];
    const errorList = await this.env.KAMI_KV.list({ prefix: 'error:' });
    
    for (const key of errorList.keys.slice(-limit)) {
      const error = await this.env.KAMI_KV.get(key.name, { type: 'json' });
      if (error) errors.push(error);
    }

    return errors;
  }
}

export default Logger;