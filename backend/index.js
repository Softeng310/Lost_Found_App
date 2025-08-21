const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

const app = express();

// Security: hide that we're using Express
app.disable('x-powered-by');

// Server configuration - load from environment or use sensible defaults
const SERVER_CONFIG = {
  PORT: process.env.PORT || 5876,
  NODE_ENV: process.env.NODE_ENV || 'development',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3000', 'https://your-frontend-domain.com'],
  FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL || 'https://lost-no-more-3b0d6-default-rtdb.firebaseio.com',
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || 'lost-no-more-3b0d6.appspot.com'
};

// CORS configuration - control which domains can access our API
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in our allowed list
    if (SERVER_CONFIG.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and auth headers
  optionsSuccessStatus: 200 // Some legacy browsers need this
};

// Middleware setup
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Handle large JSON payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Handle form data

// Request logging - track all incoming requests for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint - useful for load balancers and monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: SERVER_CONFIG.NODE_ENV,
    uptime: process.uptime()
  });
});

// Initialize Firebase Admin SDK
try {
  const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: SERVER_CONFIG.FIREBASE_DATABASE_URL,
    storageBucket: SERVER_CONFIG.FIREBASE_STORAGE_BUCKET
  });
  
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  // In production, we can't run without Firebase - exit gracefully
  if (SERVER_CONFIG.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Make Firebase services available to all route handlers
// This way we don't need to import them in every route file
app.locals.db = admin.firestore();
app.locals.auth = admin.auth();
app.locals.storage = admin.storage();

// API Routes - organize by feature
app.use('/api/items', require('./routes/items'));

// 404 handler - catch any routes that don't exist
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler - catch all errors and format them consistently
app.use((error, req, res, next) => {
  console.error('🚨 Global error handler:', error);
  
  // Handle CORS errors specifically
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      error: 'CORS policy violation',
      message: 'Origin not allowed'
    });
  }
  
  // Handle validation errors from our middleware
  if (error.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation failed',
      message: error.message,
      details: error.details
    });
  }
  
  // Handle Firebase-specific errors
  if (error.code && error.code.startsWith('firebase/')) {
    return res.status(400).json({ 
      error: 'Firebase error',
      message: error.message,
      code: error.code
    });
  }
  
  // Default error response - hide internal details in production
  const statusCode = error.statusCode || 500;
  const message = SERVER_CONFIG.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;
  
  res.status(statusCode).json({ 
    error: 'Server error',
    message,
    ...(SERVER_CONFIG.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown handling - important for production deployments
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the server
const server = app.listen(SERVER_CONFIG.PORT, () => {
  console.log(`🚀 Server running on port ${SERVER_CONFIG.PORT}`);
  console.log(`🌍 Environment: ${SERVER_CONFIG.NODE_ENV}`);
  console.log(`🔒 CORS origins: ${SERVER_CONFIG.ALLOWED_ORIGINS.join(', ')}`);
});

// Handle server startup errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  
  const bind = typeof SERVER_CONFIG.PORT === 'string' ? 'Pipe ' + SERVER_CONFIG.PORT : 'Port ' + SERVER_CONFIG.PORT;
  
  switch (error.code) {
    case 'EACCES':
      console.error(`❌ ${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`❌ ${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});
