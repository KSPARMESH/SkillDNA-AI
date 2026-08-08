import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import apiRouter from './routes';
import { errorHandler } from './middleware/error.middleware';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Healthcheck Route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'SkillDNA AI Backend API',
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use(config.apiPrefix, apiRouter);

// Global Error Handler
app.use(errorHandler);
