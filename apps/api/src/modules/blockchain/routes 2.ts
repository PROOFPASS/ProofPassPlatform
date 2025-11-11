import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { BlockchainNetwork } from '@proofpass/blockchain';
import {
  anchorData,
  batchAnchorData,
  getTransactionStatus,
  verifyAnchor,
  getBalance,
  estimateFee,
  getBlockchainInfo,
  getAvailableNetworks,
} from './service';
import {
  anchorDataBodySchema,
  anchorDataResponseSchema,
  transactionInfoSchema,
  transactionHistoryResponseSchema,
  verifyAnchorBodySchema,
  verifyAnchorResponseSchema,
  balanceResponseSchema,
  blockchainInfoResponseSchema,
  errorSchema,
} from '../../schemas';

// Blockchain network enum
const blockchainNetworkSchema = z.enum([
  'stellar-testnet',
  'stellar-mainnet',
  'optimism',
  'optimism-sepolia',
  'arbitrum',
  'arbitrum-sepolia',
]);

const anchorDataSchema = z.object({
  data: z.string().min(1, 'Data cannot be empty'),
  network: blockchainNetworkSchema.optional(),
  metadata: z.object({
    type: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
});

const batchAnchorDataSchema = z.object({
  dataHashes: z.array(z.string()).min(1, 'At least one data hash is required'),
  network: blockchainNetworkSchema.optional(),
  metadata: z.object({
    type: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
});

const verifyAnchorSchema = z.object({
  txHash: z.string().min(1, 'Transaction hash is required'),
  data: z.string().min(1, 'Data is required'),
  network: blockchainNetworkSchema.optional(),
});

export async function blockchainRoutes(server: FastifyInstance) {
  // Get blockchain info
  server.get('/blockchain/info', {
    schema: {
      description: 'Get blockchain configuration and available networks',
      tags: ['blockchain'],
      response: {
        200: blockchainInfoResponseSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const info = getBlockchainInfo();
        return reply.send(info);
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  });

  // Get available networks
  server.get('/blockchain/networks', {
    schema: {
      description: 'Get list of available blockchain networks',
      tags: ['blockchain'],
      response: {
        200: {
          type: 'object',
          properties: {
            networks: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const networks = getAvailableNetworks();
        return reply.send({ networks });
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  });

  // Get account balance
  server.get('/blockchain/balance', {
    schema: {
      description: 'Get blockchain account balance (supports Stellar, Optimism, Arbitrum)',
      tags: ['blockchain'],
      security: [{ bearerAuth: [] }, { apiKey: [] }],
      querystring: {
        type: 'object',
        properties: {
          network: {
            type: 'string',
            enum: ['stellar-testnet', 'stellar-mainnet', 'optimism', 'optimism-sepolia', 'arbitrum', 'arbitrum-sepolia'],
            description: 'Blockchain network (defaults to configured default)',
          },
        },
      },
      response: {
        200: balanceResponseSchema,
        401: errorSchema,
        500: errorSchema,
      },
    },
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (error) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
    },
    handler: async (request, reply) => {
      try {
        const { network } = request.query as { network?: BlockchainNetwork };
        const balance = await getBalance(network);
        return reply.send(balance);
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  });

  // Estimate fee for anchoring
  server.get('/blockchain/estimate-fee', {
    schema: {
      description: 'Estimate fee for anchoring data to blockchain',
      tags: ['blockchain'],
      querystring: {
        type: 'object',
        properties: {
          dataCount: {
            type: 'number',
            minimum: 1,
            default: 1,
            description: 'Number of data items to anchor',
          },
          network: {
            type: 'string',
            enum: ['stellar-testnet', 'stellar-mainnet', 'optimism', 'optimism-sepolia', 'arbitrum', 'arbitrum-sepolia'],
            description: 'Blockchain network (defaults to configured default)',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            fee: { type: 'string' },
            network: { type: 'string' },
          },
        },
        500: errorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const { dataCount = 1, network } = request.query as { dataCount?: number; network?: BlockchainNetwork };
        const result = await estimateFee(dataCount, network);
        return reply.send(result);
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  });

  // Anchor data to blockchain
  server.post('/blockchain/anchor', {
    schema: {
      description: 'Anchor data to blockchain (supports Stellar, Optimism, Arbitrum)',
      tags: ['blockchain'],
      security: [{ bearerAuth: [] }, { apiKey: [] }],
      body: anchorDataBodySchema,
      response: {
        201: anchorDataResponseSchema,
        400: errorSchema,
        401: errorSchema,
        500: errorSchema,
      },
    },
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (error) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
    },
    handler: async (request, reply) => {
      try {
        const data = anchorDataSchema.parse(request.body);
        const result = await anchorData(data);

        request.log.info({
          txHash: result.txHash,
          network: result.network,
          dataHash: result.dataHash
        }, 'Data anchored to blockchain');

        return reply.code(201).send(result);
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation error', details: error.errors });
        }
        request.log.error(error, 'Failed to anchor data');
        return reply.code(500).send({ error: error.message });
      }
    },
  });

  // Batch anchor multiple data hashes
  server.post('/blockchain/anchor/batch', {
    schema: {
      description: 'Batch anchor multiple data hashes to blockchain',
      tags: ['blockchain'],
      security: [{ bearerAuth: [] }, { apiKey: [] }],
      body: {
        type: 'object',
        properties: {
          dataHashes: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
          },
          network: {
            type: 'string',
            enum: ['stellar-testnet', 'stellar-mainnet', 'optimism', 'optimism-sepolia', 'arbitrum', 'arbitrum-sepolia'],
          },
          metadata: {
            type: 'object',
            additionalProperties: true,
          },
        },
        required: ['dataHashes'],
      },
      response: {
        201: {
          type: 'object',
          properties: {
            txHash: { type: 'string' },
            network: { type: 'string' },
            count: { type: 'number' },
            timestamp: { type: 'number' },
          },
        },
        400: errorSchema,
        401: errorSchema,
        500: errorSchema,
      },
    },
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (error) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
    },
    handler: async (request, reply) => {
      try {
        const data = batchAnchorDataSchema.parse(request.body);
        const result = await batchAnchorData(data.dataHashes, data.network, data.metadata);

        request.log.info({
          txHash: result.txHash,
          network: result.network,
          count: result.count
        }, 'Batch data anchored to blockchain');

        return reply.code(201).send(result);
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation error', details: error.errors });
        }
        request.log.error(error, 'Failed to batch anchor data');
        return reply.code(500).send({ error: error.message });
      }
    },
  });

  // Get transaction status by hash
  server.get('/blockchain/transactions/:txHash', {
    schema: {
      description: 'Get transaction status by hash (supports Stellar, Optimism, Arbitrum)',
      tags: ['blockchain'],
      params: {
        type: 'object',
        properties: {
          txHash: { type: 'string' },
        },
        required: ['txHash'],
      },
      querystring: {
        type: 'object',
        properties: {
          network: {
            type: 'string',
            enum: ['stellar-testnet', 'stellar-mainnet', 'optimism', 'optimism-sepolia', 'arbitrum', 'arbitrum-sepolia'],
            description: 'Blockchain network (defaults to configured default)',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            network: { type: 'string' },
            confirmations: { type: 'number' },
            timestamp: { type: 'number' },
          },
        },
        404: errorSchema,
        500: errorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const { txHash } = request.params as { txHash: string };
        const { network } = request.query as { network?: BlockchainNetwork };
        const status = await getTransactionStatus(txHash, network);

        if (!status) {
          return reply.code(404).send({ error: 'Transaction not found' });
        }

        return reply.send(status);
      } catch (error: any) {
        request.log.error(error, 'Failed to get transaction status');
        return reply.code(500).send({ error: error.message });
      }
    },
  });

  // Verify anchor
  server.post('/blockchain/verify', {
    schema: {
      description: 'Verify that data was anchored in a specific transaction (supports Stellar, Optimism, Arbitrum)',
      tags: ['blockchain'],
      body: verifyAnchorBodySchema,
      response: {
        200: verifyAnchorResponseSchema,
        400: errorSchema,
        500: errorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const data = verifyAnchorSchema.parse(request.body);

        // Create hash of the data
        const crypto = await import('crypto');
        const dataHash = crypto.createHash('sha256').update(data.data).digest('hex');

        const result = await verifyAnchor(data.txHash, dataHash, data.network);

        return reply.send({
          valid: result.verified,
          txHash: data.txHash,
          network: result.network,
          dataHash,
        });
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation error', details: error.errors });
        }
        request.log.error(error, 'Failed to verify anchor');
        return reply.code(500).send({ error: error.message });
      }
    },
  });
}
