/**
 * VC Verification Job Processor
 * Handles async Verifiable Credential verification
 */

import type { Job } from 'bullmq';
import type { VCVerificationJobData, VCVerificationJobResult } from '../types';
import { recordVCVerified } from '../../telemetry/metrics';
import { addSpanEvent, withSpan } from '../../telemetry/middleware';
import { queueManager } from '../queue-manager';
import { QueueName } from '../config';

/**
 * Process VC verification job
 */
export async function processVCVerification(
  job: Job<VCVerificationJobData>
): Promise<VCVerificationJobResult> {
  return withSpan('queue:vc-verification', async () => {
    const { vcJwt, verifierDid, organizationId } = job.data;

    job.updateProgress(10);
    addSpanEvent('vc-verification-started', {
      'verifier.did': verifierDid || 'unknown',
    });

    try {
      // Import VC toolkit dynamically
      const { verifyVC, extractClaims } = await import('@proofpass/vc-toolkit');

      job.updateProgress(30);

      // Verify the VC
      const verificationResult = await verifyVC(vcJwt);

      job.updateProgress(70);

      if (verificationResult.verified) {
        // Extract claims if verification succeeded
        const claims = extractClaims(verificationResult);

        // Record metrics
        recordVCVerified(true, verifierDid);

        job.updateProgress(100);
        addSpanEvent('vc-verification-succeeded', {
          'issuer.did': verificationResult.issuer,
          'subject.did': verificationResult.subject,
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
                  event: 'vc.verified',
                  valid: true,
                  claims,
                  issuer: verificationResult.issuer,
                  verifiedAt: new Date().toISOString(),
                },
                event: 'vc.verified',
                organizationId,
              },
              { priority: 5 }
            );
          }
        }

        return {
          valid: true,
          claims,
          issuer: verificationResult.issuer,
          subject: verificationResult.subject,
        };
      } else {
        // Verification failed
        recordVCVerified(false, verifierDid);

        addSpanEvent('vc-verification-failed', {
          'error': verificationResult.error || 'Verification failed',
        });

        // Trigger failure webhook if callback URL provided
        if (job.data.callbackUrl) {
          const webhookQueue = queueManager.getQueue(QueueName.WEBHOOKS);
          if (webhookQueue) {
            await webhookQueue.add(
              'webhook',
              {
                url: job.data.callbackUrl,
                method: 'POST',
                payload: {
                  event: 'vc.verification_failed',
                  valid: false,
                  error: verificationResult.error || 'Verification failed',
                  verifiedAt: new Date().toISOString(),
                },
                event: 'vc.verification_failed',
                organizationId,
              },
              { priority: 5 }
            );
          }
        }

        return {
          valid: false,
          error: verificationResult.error || 'Verification failed',
        };
      }
    } catch (error) {
      recordVCVerified(false, verifierDid);
      addSpanEvent('vc-verification-error', {
        'error.message': (error as Error).message,
      });
      throw error;
    }
  });
}
