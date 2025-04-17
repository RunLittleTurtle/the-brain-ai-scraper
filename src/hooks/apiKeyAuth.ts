import type { FastifyRequest, FastifyReply } from '../types/fastify.js';

/**
 * Fastify preHandler hook to authenticate requests based on a static API key
 * provided in the Authorization header (Bearer scheme).
 * Reads the expected API key from the API_KEY environment variable.
 */
export async function apiKeyAuth(
    request: FastifyRequest,
    reply: FastifyReply
) : Promise<void> {
    // Prefer apiKey from fastify instance config, fallback to env
    const fastify = request.server;
    // @ts-ignore
    const apiKey = fastify.config?.apiKey || process.env.API_KEY;

    // Check if API_KEY is configured in the environment
    if (!apiKey) {
        request.log.error('API_KEY environment variable is not set. Authentication disabled.');
        reply.code(500).send({ message: 'Server configuration error: API_KEY not set.' });
        return;
    }

    const authHeader = request.headers.authorization; // Fastify normalizes headers to lowercase
    let providedKey: string | undefined;

    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        providedKey = authHeader.substring(7); // Extract token after "Bearer "
    }

    // Compare provided key with expected key
    if (!providedKey || providedKey !== apiKey) {
        request.log.warn(`Unauthorized attempt: Provided key "${providedKey}"`);
        reply.code(401).send({ message: 'Unauthorized: Invalid or missing API key.' });
        return;
    }

    // Authentication successful, proceed to the route handler
    // No explicit return needed; Fastify will continue to the next handler
}
