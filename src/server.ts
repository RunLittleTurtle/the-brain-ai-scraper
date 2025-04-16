import './config/loadEnv.js';
import { buildApp } from './app.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    const app = await buildApp();

    const shutdown = async (signal: string) => {
      app.log.info(`Received signal ${signal}. Shutting down gracefully...`);
      await app.close();
      app.log.info('Server successfully closed.');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    await app.listen({ port: PORT, host: HOST });

  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

startServer();
