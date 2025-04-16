/**
 * 日志记录工具函数
 */

class Logger {
  constructor(env) {
    this.env = env;
  }

  info(message, data = {}) {
    this.log('INFO', message, data);
  }

  error(message, error = {}) {
    const errorInfo = error instanceof Error ? 
      { message: error.message, stack: error.stack } : 
      { error };
    
    this.log('ERROR', message, errorInfo);
  }

  warn(message, data = {}) {
    this.log('WARN', message, data);
  }

  debug(message, data = {}) {
    this.log('DEBUG', message, data);
  }

  log(level, message, data = {}) {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level,
        message,
        data
      };

      console.log(JSON.stringify(logEntry));
    } catch (e) {
      console.error('日志记录失败:', e);
    }
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