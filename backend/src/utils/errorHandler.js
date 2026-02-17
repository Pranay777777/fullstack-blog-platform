class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Operational errors (known errors)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // SQLite unique constraint error
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || 
      (err.message && err.message.includes('UNIQUE constraint failed'))) {
    const field = err.message.split('.')[1] || 'field';
    error = new AppError(`Duplicate value for ${field}`, 400);
    return res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
    return res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
    return res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
  }

  // Default to 500 server error
  console.error('ERROR 💥:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};

module.exports = { AppError, errorHandler };
