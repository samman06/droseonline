const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// CORS configuration - must be BEFORE other middleware
// Simplified to allow all origins in development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable CSP to allow iframe embedding
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api', limiter);

// Body parsing middleware
// Skip JSON parsing for multipart/form-data (file uploads)
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
    return next(); // Skip JSON parsing for file uploads
  }
  express.json({ limit: '10mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Import error handling middleware
const { errorHandler, notFoundHandler, requestLogger } = require('./middleware/errorHandler');

// Request logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/academic-years', require('./routes/academicYears'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/accounting', require('./routes/accounting'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Drose Online Educational System is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler - must come before error handler
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Drose Online Backend Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/health`);
});
