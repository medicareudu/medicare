import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { scheduleAutoBackups } from './services/backup.service.js';

async function main() {
  app.listen(env.PORT, () => {
    logger.info(`Medicare API running on http://localhost:${env.PORT}`);
    logger.info(`Health check: http://localhost:${env.PORT}/api/health`);
  });

  // Initialize auto backups
  await scheduleAutoBackups();
}

main().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
