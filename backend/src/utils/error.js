/**
 * 错误处理工具函数
 */

class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();
  }
}

const errorHandler = (error) => {
  const statusCode = error.statusCode || 500;
  const errorCode = error.errorCode || 'INTERNAL_ERROR';
  const message = error.message || '服务器内部错误';

  return new Response(JSON.stringify({
    success: false,
    error: {
      code: errorCode,
      message,
      timestamp: error.timestamp || new Date().toISOString()
    }
  }), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
};

export { AppError, errorHandler };