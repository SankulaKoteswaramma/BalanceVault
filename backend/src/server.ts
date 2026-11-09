import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';

const app = createApp();

const server = app.listen(config.PORT, () => {
  logger.info(`BalanceVault API server active`, {
    port: config.PORT,
    environment: config.NODE_ENV,
    url: `http://localhost:${config.PORT}`,
  });
});

const gracefulShutdown = (signal: string) => {
  logger.warn(`Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    logger.info('HTTP server closed successfully.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded. Forcing termination.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
