import './config/loadEnv.js';
import { buildApp } from './app.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Async IIFE to handle async buildApp
(async () => {
  try {
    const app = await buildApp(); // Await the Fastify instance

    // Add types for err (Error | null) and address (string)
    app.listen({ port: PORT, host: '0.0.0.0' }, (err: Error | null, address: string) => {
      if (err) {
        app.log.error(err);
        process.exit(1);
      }
      // Log is available on the resolved app instance
      app.log.info(`Server listening at ${address}`);
    });
  } catch (err) {
    console.error("Error starting server:", err); // Log error during buildApp
    process.exit(1);
  }
})(); // Immediately invoke the async function
