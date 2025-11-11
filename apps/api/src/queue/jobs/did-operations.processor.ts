/**
 * DID Operations Job Processor
 * Handles async DID creation, updates, and deactivation
 */

import type { Job } from 'bullmq';
import type { DIDOperationJobData, DIDOperationJobResult } from '../types';
import { recordDIDOperation } from '../../telemetry/metrics';
import { addSpanEvent, withSpan } from '../../telemetry/middleware';

/**
 * Process DID operation job
 */
export async function processDIDOperation(
  job: Job<DIDOperationJobData>
): Promise<DIDOperationJobResult> {
  return withSpan('queue:did-operation', async () => {
    const { operation, didMethod, organizationId, metadata } = job.data;

    job.updateProgress(10);
    addSpanEvent('did-operation-started', {
      'did.operation': operation,
      'did.method': didMethod,
    });

    try {
      let did: string;

      switch (operation) {
        case 'create':
          job.updateProgress(30);

          if (didMethod === 'key') {
            // Create did:key
            const { generateDIDKey } = await import('@proofpass/vc-toolkit');
            const { did: newDid } = await generateDIDKey();
            did = newDid;
          } else if (didMethod === 'web') {
            // Create did:web
            const { buildDIDWeb } = await import('@proofpass/vc-toolkit');
            const domain = metadata?.domain || process.env.DID_WEB_DOMAIN || 'example.com';
            const path = metadata?.path;
            did = buildDIDWeb(domain, path);
          } else {
            throw new Error(`Unsupported DID method: ${didMethod}`);
          }

          job.updateProgress(70);

          // Store DID in database (TODO: implement persistence)
          console.log(`[DID] Created ${did} for organization ${organizationId}`);

          break;

        case 'update':
          job.updateProgress(50);
          // TODO: Implement DID document update
          did = metadata?.did || 'did:example:placeholder';
          console.log(`[DID] Updated ${did} for organization ${organizationId}`);
          break;

        case 'deactivate':
          job.updateProgress(50);
          // TODO: Implement DID deactivation
          did = metadata?.did || 'did:example:placeholder';
          console.log(`[DID] Deactivated ${did} for organization ${organizationId}`);
          break;

        default:
          throw new Error(`Unknown DID operation: ${operation}`);
      }

      // Record metrics
      recordDIDOperation(operation, didMethod);

      job.updateProgress(100);
      addSpanEvent('did-operation-completed', {
        'did': did,
      });

      // If callback URL is provided, trigger webhook
      if (job.data.callbackUrl) {
        await job.queue.add(
          'webhook',
          {
            url: job.data.callbackUrl,
            method: 'POST',
            payload: {
              event: `did.${operation}`,
              did,
              operation,
              completedAt: new Date().toISOString(),
            },
            event: `did.${operation}`,
            organizationId,
          },
          { priority: 5 }
        );
      }

      return {
        did,
        operation,
        success: true,
      };
    } catch (error) {
      addSpanEvent('did-operation-failed', {
        'error.message': (error as Error).message,
      });
      throw error;
    }
  });
}
