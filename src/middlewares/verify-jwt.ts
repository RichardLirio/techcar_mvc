import { FastifyReply, FastifyRequest } from "fastify";

// Middleware to verify JWT token
export async function VerifyJWT(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (error) {
    return reply.status(401).send({ message: "Unauthorized." }); // Send 401 Unauthorized response
  }
}
