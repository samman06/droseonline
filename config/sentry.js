/**
 * Sentry Configuration for Error Tracking
 * 
 * Setup Instructions:
 * 1. Create a free account at https://sentry.io
 * 2. Create a new project for Node.js
 * 3. Get your DSN from Project Settings > Client Keys (DSN)
 * 4. Add SENTRY_DSN to your .env file
 * 5. Restart the server
 * 
 * Features:
 * - Automatic error tracking
 * - Performance monitoring
 * - Request breadcrumbs
 * - User context
 * - Environment tracking
 */

const Sentry = require('@sentry/node');

// Profiling is optional - only load if package is installed
let ProfilingIntegration;
try {
  ProfilingIntegration = require('@sentry/profiling-node').ProfilingIntegration;
} catch (e) {
  // Profiling package not installed, that's okay
  ProfilingIntegration = null;
}

/**
 * Initialize Sentry for backend error tracking
 * @param {Express} app - Express application instance
 */
function initSentry(app) {
  // Only initialize if DSN is provided
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.warn('⚠️  Sentry DSN not configured. Error tracking is disabled.');
    console.warn('   Add SENTRY_DSN to your .env file to enable error tracking.');
    return;
  }

  // Build integrations array
  const integrations = [
    // Enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    
    // Enable Express.js middleware tracing
    new Sentry.Integrations.Express({ app }),
  ];
  
  // Add profiling if available
  if (ProfilingIntegration) {
    integrations.push(new ProfilingIntegration());
  }
  
  Sentry.init({
    dsn: dsn,
    environment: process.env.NODE_ENV || 'development',
    
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // In production, you may want to lower this to reduce costs
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Set profilesSampleRate to profile 10% of transactions (only if profiling is available)
    profilesSampleRate: ProfilingIntegration ? (process.env.NODE_ENV === 'production' ? 0.1 : 1.0) : undefined,
    
    integrations: integrations,
    
    // Don't send PII (Personally Identifiable Information) by default
    beforeSend(event, hint) {
      // Remove sensitive data from request body
      if (event.request && event.request.data) {
        const sensitiveFields = ['password', 'token', 'secret', 'authorization'];
        sensitiveFields.forEach(field => {
          if (event.request.data[field]) {
            event.request.data[field] = '[Filtered]';
          }
        });
      }
      
      return event;
    },
  });

  console.log('✅ Sentry error tracking initialized');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Sample Rate: ${process.env.NODE_ENV === 'production' ? '10%' : '100%'}`);
}

/**
 * Get Sentry request handler middleware
 * Should be the first middleware in the app
 */
function getRequestHandler() {
  return Sentry.Handlers.requestHandler();
}

/**
 * Get Sentry tracing middleware
 * Should be after request handler
 */
function getTracingHandler() {
  return Sentry.Handlers.tracingHandler();
}

/**
 * Get Sentry error handler middleware
 * Should be after all routes but before other error handlers
 */
function getErrorHandler() {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status code >= 400
      if (error.status >= 400) {
        return true;
      }
      return true;
    },
  });
}

/**
 * Capture exception manually
 * @param {Error} error - Error to capture
 * @param {Object} context - Additional context
 */
function captureException(error, context = {}) {
  Sentry.captureException(error, {
    contexts: context,
  });
}

/**
 * Capture message manually
 * @param {string} message - Message to capture
 * @param {string} level - Severity level (info, warning, error)
 */
function captureMessage(message, level = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 * @param {Object} user - User object
 */
function setUser(user) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  
  Sentry.setUser({
    id: user._id || user.id,
    email: user.email,
    username: user.fullName || user.username,
    role: user.role,
  });
}

module.exports = {
  initSentry,
  getRequestHandler,
  getTracingHandler,
  getErrorHandler,
  captureException,
  captureMessage,
  setUser,
  Sentry,
};

