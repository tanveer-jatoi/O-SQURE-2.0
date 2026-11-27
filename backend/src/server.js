import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';

let server;

async function startServer() {
  try {
    await connectDatabase();

    server = app.listen(env.port, () => {
      console.log(
        `[SERVER] O-Square 2.0 API running in ${env.nodeEnv} mode on http://localhost:${env.port}`
      );
    });
  } catch (err) {
    console.error('[STARTUP ERROR] Failed to start backend server:', err.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\n[SERVER] Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(async () => {
      await disconnectDatabase();
      console.log('[SERVER] HTTP server closed. Exiting.');
      process.exit(0);
    });
  } else {
    await disconnectDatabase();
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]', err);
  shutdown('unhandledRejection');
});

startServer();
