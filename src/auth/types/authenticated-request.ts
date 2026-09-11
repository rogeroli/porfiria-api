import { FastifyRequest } from 'fastify';
import { JwtAuthenticatedUser } from './jwt-authenticated-user';

export type AuthenticatedRequest = FastifyRequest & {
  user: JwtAuthenticatedUser;
};
