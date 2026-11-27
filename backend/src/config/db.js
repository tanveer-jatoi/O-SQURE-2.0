import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Establishes a MongoDB connection using Mongoose with sensible timeouts
 * and connection lifecycle event listeners.
 */
export async function connectDatabase() {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    console.log('[DB] MongoDB connection established successfully.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[DB] MongoDB runtime error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected.');
  });

  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: 5000,
  });

  return mongoose.connection;
}

/**
 * Cleanly closes the active MongoDB connection during server shutdown.
 */
export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('[DB] MongoDB connection closed cleanly.');
  }
}
