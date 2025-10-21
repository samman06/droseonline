// Global Error Handling Middleware
// Provides consistent error responses and logging

/**
 * Custom Application Error Class
 * Extends Error with additional properties for better error handling
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors automatically
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation Error Handler
 * Formats Joi validation errors into user-friendly messages
 */
const handleValidationError = (error) => {
  const errors = error.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message.replace(/"/g, '')
  }));
  
  return {
    message: 'Validation failed',
    errors: errors,
    userMessage: 'Please check your input and try again.'
  };
};

/**
 * MongoDB Error Handler
 * Handles common MongoDB errors (duplicate key, cast error, etc.)
 */
const handleMongoError = (error) => {
  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return {
      message: `Duplicate ${field}`,
      userMessage: `This ${field} already exists. Please use a different one.`,
      statusCode: 409
    };
  }
  
  // Cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return {
      message: 'Invalid ID format',
      userMessage: 'The requested resource could not be found.',
      statusCode: 400
    };
  }
  
  // Validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    return {
      message: 'Validation failed',
      errors: errors,
      userMessage: 'Please check your input and try again.',
      statusCode: 422
    };
  }
  
  return null;
};

/**
 * JWT Error Handler
 * Handles JWT token errors
 */
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return {
      message: 'Invalid token',
      userMessage: 'Your session is invalid. Please log in again.',
      statusCode: 401
    };
  }
  
  if (error.name === 'TokenExpiredError') {
    return {
      message: 'Token expired',
      userMessage: 'Your session has expired. Please log in again.',
      statusCode: 401
    };
  }
  
  return null;
};

/**
 * Development Error Response
 * Returns detailed error information for debugging
 */
const sendErrorDev = (error, res) => {
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message,
      userMessage: error.userMessage || error.message,
      statusCode: error.statusCode,
      stack: error.stack,
      timestamp: error.timestamp,
      ...(error.errors && { errors: error.errors })
    }
  });
};

/**
 * Production Error Response
 * Returns minimal error information to client
 */
const sendErrorProd = (error, res) => {
  // Operational, trusted error: send message to client
  if (error.isOperational) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.userMessage || error.message,
      ...(error.errors && { errors: error.errors })
    });
  } else {
    // Programming or unknown error: don't leak error details
    console.error('ERROR 💥:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Our team has been notified.',
      userMessage: 'An unexpected error occurred. Please try again later.'
    });
  }
};

/**
 * Main Error Handler Middleware
 * Catches all errors and sends appropriate responses
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.isOperational = err.isOperational !== undefined ? err.isOperational : false;
  
  // Log error for monitoring
  console.error('Error Handler:', {
    url: req.originalUrl,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle specific error types
  
  // Joi validation error
  if (err.isJoi) {
    const validationError = handleValidationError(err);
    error.message = validationError.message;
    error.userMessage = validationError.userMessage;
    error.errors = validationError.errors;
    error.statusCode = 422;
    error.isOperational = true;
  }
  
  // MongoDB errors
  const mongoError = handleMongoError(err);
  if (mongoError) {
    error.message = mongoError.message;
    error.userMessage = mongoError.userMessage;
    error.errors = mongoError.errors;
    error.statusCode = mongoError.statusCode;
    error.isOperational = true;
  }
  
  // JWT errors
  const jwtError = handleJWTError(err);
  if (jwtError) {
    error.message = jwtError.message;
    error.userMessage = jwtError.userMessage;
    error.statusCode = jwtError.statusCode;
    error.isOperational = true;
  }

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

/**
 * 404 Not Found Handler
 * Catches requests to undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    404,
    true
  );
  error.userMessage = 'The requested resource was not found.';
  next(error);
};

/**
 * Request Logger Middleware
 * Logs all incoming requests for monitoring
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

module.exports = {
  AppError,
  asyncHandler,
  errorHandler,
  notFoundHandler,
  requestLogger
};

