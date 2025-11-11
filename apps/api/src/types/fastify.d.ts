import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    client?: {
      orgId: string;
      apiKeyId: string;
      plan: string;
      limits: {
        requestsPerDay: number;
        blockchainOpsPerMonth: number;
      };
    };
  }
}
