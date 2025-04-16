/**
 * 错误处理工具函数
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (error, request, env) => {
  console.error('Error:', error);
  
  const statusCode = error.statusCode || 500;
  const message = error.message || '服务器内部错误';
  const code = error.code || 'INTERNAL_SERVER_ERROR';
  
  return new Response(JSON.stringify({
    success: false,
    error: {
      code,
      message,
      ...(env.ENVIRONMENT === 'development' && { stack: error.stack })
    }
  }), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
};

export { AppError, errorHandler };