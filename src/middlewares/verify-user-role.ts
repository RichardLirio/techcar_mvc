import { FastifyReply, FastifyRequest } from "fastify";

// Middleware to verify user role
export function VerifyUserRole(roleToVerify: "ADMIN" | "USER") {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { role } = request.user;

    if (role !== roleToVerify) {
      return reply.status(401).send({ message: "Unauthorized." }); // Send 401 Unauthorized response
    }
  };
}
