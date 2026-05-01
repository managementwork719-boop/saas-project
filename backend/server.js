import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import dns from 'dns';

// Force global DNS resolution to IPv4 first (Fixes ENETUNREACH on Render/Vercel)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';

import connectDB from './config/db.js';
import { connectRedis } from './utils/cache.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import projectManagerRoutes from './routes/projectManagerRoutes.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();
connectRedis();

const app = express();

// Trust proxy for Render/Vercel
app.set('trust proxy', 1);

// 1. GLOBAL MIDDLEWARES

// Compress API responses
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Implement CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL, 
    'https://worksensy.vercel.app',
    'https://worksensy.vercel.app/',
    'http://localhost:3000', 
    'http://localhost:5173',
    'http://127.0.0.1:3000'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept'],
}));

// Set security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Limit requests from same API - Adjusted for dashboard application
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Increased for general dashboard usage
  message: 'Too many requests from this IP, please try again in 15 minutes!',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 attempts per hour
  message: 'Too many login attempts from this IP, please try again in an hour!',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/setup-password', authLimiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Custom Data Sanitization against NoSQL query injection
// This is a safe alternative to express-mongo-sanitize
const sanitize = (obj) => {
  if (obj instanceof Object) {
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
         delete obj[key];
      } else {
         sanitize(obj[key]);
      }
    }
  }
  return obj;
};

app.use((req, res, next) => {
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  if (req.query) sanitize(req.query);
  next();
});

// Prevent parameter pollution
app.use(hpp({
    whitelist: ['role', 'createdAt'] // Allow these parameters to be duplicated if needed
}));

// Routes
app.get('/', (req, res) => {
  res.send('API is running securely...');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/project-manager', projectManagerRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('SERVER ERROR 💥:', err); // Log the error for diagnostics
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    status: 'error',
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});
