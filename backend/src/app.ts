import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './shared/utils/logger';

// Routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import poolRoutes from './modules/pools/pools.routes';
import projectRoutes from './modules/projects/projects.routes';
import teamRoutes from './modules/teams/teams.routes';
import ideaRoutes from './modules/student-ideas/ideas.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import reportRoutes from './modules/reports/reports.routes';
import auditRoutes from './modules/audit/audit.routes';
import temporaryPermissionsRoutes from './modules/temporary-permissions/temporary-permissions.routes';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: process.env.NODE_ENV === 'production' ? 200 : 2000, standardHeaders: true }));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request log
app.use((req, _res, next) => { logger.debug(`${req.method} ${req.path}`); next(); });

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pools', poolRoutes);
app.use('/api/pools', projectRoutes);   // /api/pools/:poolId/projects
app.use('/api/pools', teamRoutes);      // /api/pools/:poolId/teams
app.use('/api/pools', ideaRoutes);      // /api/pools/:poolId/ideas
app.use('/api/pools', reportRoutes);    // /api/pools/:poolId/reports
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/temporary-permissions', temporaryPermissionsRoutes);

// 404
app.use((_req, res) => { res.status(404).json({ success: false, message: 'Route not found' }); });

// Error handler
app.use(errorHandler);

export default app;