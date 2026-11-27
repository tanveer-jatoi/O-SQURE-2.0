import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredVars = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  campus: {
    name: process.env.CAMPUS_NAME || 'O-Square Educational Centre',
    code: process.env.CAMPUS_CODE || 'OSQ-01',
    email: process.env.CAMPUS_EMAIL || 'info@osquare-campus.edu',
    phone: process.env.CAMPUS_PHONE || '',
  },
  paymentWebhookSecret:
    process.env.PAYMENT_WEBHOOK_SECRET || 'osquare2_dev_webhook_hmac_secret',
};
