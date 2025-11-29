/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Provides role verification for protecting admin endpoints
 */

import { FastifyRequest, FastifyReply } from 'fastify';

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  [key: string]: unknown;
}

// Use FastifyRequest directly and cast user property when needed
export type AuthenticatedRequest = FastifyRequest;

/**
 * Role hierarchy for permission checking
 * Higher number = more permissions
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  admin: 2,
  superadmin: 3,
};

/**
 * Check if user has required role or higher
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Middleware to require specific role
 *
 * @param requiredRole - Minimum role required to access endpoint
 * @returns Fastify preHandler function
 */
export function requireRole(requiredRole: UserRole) {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      // Verify JWT first
      await request.jwtVerify();

      const user = request.user as AuthenticatedUser | undefined;

      if (!user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      // Check if user has required role
      if (!user.role || !hasRole(user.role, requiredRole)) {
        request.log.warn({
          userId: user.id,
          userRole: user.role || 'none',
          requiredRole,
          endpoint: request.url
        }, 'Access denied - insufficient permissions');

        return reply.code(403).send({
          error: 'Forbidden',
          message: `This endpoint requires ${requiredRole} role or higher`
        });
      }

      // User has required role, continue
      request.log.debug({
        userId: user.id,
        userRole: user.role,
        endpoint: request.url
      }, 'RBAC check passed');

    } catch (error) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }
  };
}

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware to require superadmin role
 */
export const requireSuperAdmin = requireRole('superadmin');

/**
 * Check if request is from authenticated user
 */
export async function requireAuth(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();

    const user = request.user as AuthenticatedUser | undefined;
    if (!user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }
  } catch (error) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
}

/**
 * Check if user owns the resource or is admin
 *
 * @param resourceUserId - User ID who owns the resource
 */
export function checkOwnershipOrAdmin(
  request: AuthenticatedRequest,
  resourceUserId: string
): boolean {
  const user = request.user as AuthenticatedUser | undefined;

  if (!user) {
    return false;
  }

  // User owns the resource
  if (user.id === resourceUserId) {
    return true;
  }

  // User is admin or superadmin
  if (hasRole(user.role, 'admin')) {
    return true;
  }

  return false;
}
