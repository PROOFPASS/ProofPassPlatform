/**
 * VC Issuance Job Processor
 * Handles async Verifiable Credential issuance
 */

import type { Job } from 'bullmq';
import type { VCIssuanceJobData, VCIssuanceJobResult } from '../types';
import { recordVCIssued } from '../../telemetry/metrics';
import { addSpanEvent, withSpan } from '../../telemetry/middleware';
import { queueManager } from '../queue-manager';
import { QueueName } from '../config';

/**
 * Process VC issuance job
 */
export async function processVCIssuance(
  job: Job<VCIssuanceJobData>
): Promise<VCIssuanceJobResult> {
  return withSpan('queue:vc-issuance', async () => {
    const { issuerDid, subjectDid, credentialType, claims, expirationDate, organizationId } =
      job.data;

    job.updateProgress(10);
    addSpanEvent('vc-issuance-started', {
      'credential.type': credentialType,
      'issuer.did': issuerDid,
    });

    try {
      // Import VC toolkit dynamically to avoid circular dependencies
      const { issueVC, createCredential } = await import('@proofpass/vc-toolkit');

      job.updateProgress(30);

      // Create credential payload
      const credential = createCredential({
        issuerDID: issuerDid,
        subjectDID: subjectDid,
        type: ['VerifiableCredential', credentialType],
        credentialSubject: {
          id: subjectDid,
          ...claims,
        },
        expirationDate,
      });

      job.updateProgress(50);

      // Issue VC as JWT
      // Note: In production, you'd load the private key securely from OpenBao/KMS
      const { importDIDKeyPair } = await import('@proofpass/vc-toolkit');
      const privateKeyHex = process.env.ISSUER_PRIVATE_KEY || '';
      const issuerKeyPair = importDIDKeyPair(privateKeyHex);
      const vcJwt = await issueVC({ credential, issuerKeyPair });

      job.updateProgress(80);

      // Store VC in database (TODO: implement persistence)
      const credentialId = `vc-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Record metrics
      recordVCIssued(credentialType, issuerDid);

      job.updateProgress(100);
      addSpanEvent('vc-issuance-completed', {
        'credential.id': credentialId,
      });

      // If callback URL is provided, trigger webhook
      if (job.data.callbackUrl) {
        const webhookQueue = queueManager.getQueue(QueueName.WEBHOOKS);
        if (webhookQueue) {
          await webhookQueue.add(
            'webhook',
            {
              url: job.data.callbackUrl,
              method: 'POST',
              payload: {
                event: 'vc.issued',
                credentialId,
                vcJwt,
                issuedAt: new Date().toISOString(),
              },
              event: 'vc.issued',
              organizationId,
            },
            { priority: 5 }
          );
        }
      }

      return {
        vcJwt,
        credentialId,
        issuedAt: new Date().toISOString(),
      };
    } catch (error) {
      addSpanEvent('vc-issuance-failed', {
        'error.message': (error as Error).message,
      });
      throw error;
    }
  });
}
