import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { corsMiddleware } from './config/cors.config';
import { generalRateLimiter } from './middleware/rate-limiter.middleware';
import apiRouter from './routes';
import { errorHandler } from './middleware/error.middleware';

export const app = express();

// Configure trust proxy for Render, Cloudflare, and cloud load-balancers (1 hop)
app.set('trust proxy', 1);

// Security Headers & CORS origin whitelist
app.use(helmet());
app.use(corsMiddleware);

// JSON body parser & dev logger
app.use(express.json());
app.use(morgan('dev'));

// Healthcheck Route (unmetered, public system liveness endpoint)
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'SkillDNA AI Backend API',
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// General Rate Limiting applied to all API endpoints
app.use(config.apiPrefix, generalRateLimiter);

// API Routes
app.use(config.apiPrefix, apiRouter);

// Global Error Handler
app.use(errorHandler);
