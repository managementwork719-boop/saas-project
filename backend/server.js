import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import path from 'path';
import { fileURLToPath } from 'url';

// Utility Imports
import connectDB from './config/db.js';
import { createActivityLog } from './utils/logger.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import platformSettingsRoutes from './routes/platformSettingsRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import projectManagerRoutes from './routes/projectManagerRoutes.js';

// Connect to Database
connectDB();

const app = express();

// Set __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1) GLOBAL MIDDLEWARES
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
    max: 1000, // Increase to 1000 for dev/testing
    windowMs: 15 * 60 * 1000, // 15 minutes instead of 1 hour
    message: 'Too many requests from this IP, please try again in 15 minutes!',
    skip: (req, res) => process.env.NODE_ENV === 'development' // Skip in development
});
app.use('/api', limiter);

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Data compression for faster loading
app.use(compression());

// Limit data from body to 10mb
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Prevent parameter pollution
app.use(hpp());

// CORS configuration
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'https://work-management-v1.vercel.app',
    /\.vercel\.app$/ // Allow all vercel preview deployments
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Serving static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2) ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/platform-settings', platformSettingsRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/project-manager', projectManagerRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Server is healthy' });
});

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    console.error('SERVER ERROR 💥:', err);

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message || 'Something went wrong!',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
