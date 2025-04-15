import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';

/**
 * Fastify preHandler hook to authenticate requests based on a static API key
 * provided in the Authorization header (Bearer scheme).
 * Reads the expected API key from the API_KEY environment variable.
 */
export function apiKeyAuth(
    request: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction
) {
    const expectedKey = process.env.API_KEY;

    // Check if API_KEY is configured in the environment
    if (!expectedKey) {
        request.log.error('API_KEY environment variable is not set. Authentication disabled.');
        // In a real scenario, you might want to block all requests if the key isn't set
        return reply.internalServerError('Server configuration error.');
    }

    const authHeader = request.headers.authorization; // Fastify normalizes headers to lowercase
    let providedKey: string | undefined;

    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        providedKey = authHeader.substring(7); // Extract token after "Bearer "
    }

    // Compare provided key with expected key
    if (providedKey !== expectedKey) {
        request.log.warn(`Unauthorized attempt: Provided key "${providedKey}"`);
        reply.code(401).send({ message: 'Unauthorized: Invalid or missing API key.' });
        return; // Important: Stop processing further handlers
    }

    // Authentication successful, proceed to the route handler
    done();
}
