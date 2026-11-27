import { Router } from 'express';
import mongoose from 'mongoose';
import { sendSuccess } from '../utils/apiResponse.js';
import { env } from '../config/env.js';

const router = Router();

const DB_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

router.get('/', (req, res) => {
  const dbState = DB_STATES[mongoose.connection.readyState] || 'unknown';

  return sendSuccess(res, {
    message: 'O-Square 2.0 API is healthy',
    data: {
      service: 'osquare2-backend',
      environment: env.nodeEnv,
      campus: env.campus.name,
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbState,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
