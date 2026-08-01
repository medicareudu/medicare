import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import medicinesRoutes from './routes/medicines.routes.js';
import suppliersRoutes from './routes/suppliers.routes.js';
import staffRoutes from './routes/staff.routes.js';
import prescriptionsRoutes from './routes/prescriptions.routes.js';
import historyRoutes from './routes/history.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import dataRoutes from './routes/data.routes.js';
import backupRoutes from './routes/backup.routes.js';
import reportsRoutes from './routes/reports.routes.js';

export const app = express();

app.use(helmet());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isVercel = /\.vercel\.app$/.test(origin);
      const allowed =
        origin === env.FRONTEND_URL ||
        isVercel ||
        ((env.NODE_ENV === 'development' || env.NODE_ENV === 'test') && /^http:\/\/localhost:\d+$/.test(origin));
      callback(null, allowed);
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'medicare-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicinesRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/reports', reportsRoutes);

app.use(errorHandler);
