import { FastifyReply, FastifyRequest } from "fastify";

// Middleware to verify JWT token
export async function VerifyJWT(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return reply.status(401).send({ error: "Unauthorized." }); // Send 401 Unauthorized response
  }
}
