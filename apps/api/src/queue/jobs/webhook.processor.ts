/**
 * Webhook Job Processor
 * Handles async webhook notifications
 */

import type { Job } from 'bullmq';
import type { WebhookJobData, WebhookJobResult } from '../types';
import { addSpanEvent, withSpan } from '../../telemetry/middleware';

/**
 * Process webhook job
 */
export async function processWebhook(job: Job<WebhookJobData>): Promise<WebhookJobResult> {
  return withSpan('queue:webhook', async () => {
    const { url, method, headers, payload, event } = job.data;

    job.updateProgress(10);
    addSpanEvent('webhook-started', {
      'webhook.url': url,
      'webhook.event': event,
    });

    try {
      // Make HTTP request
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ProofPass/1.0',
          ...headers,
        },
        body: JSON.stringify(payload),
      });

      job.updateProgress(80);

      const responseData = await response.text();
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseData);
      } catch {
        parsedResponse = responseData;
      }

      if (response.ok) {
        job.updateProgress(100);
        addSpanEvent('webhook-succeeded', {
          'webhook.status_code': response.status,
        });

        return {
          statusCode: response.status,
          success: true,
          response: parsedResponse,
        };
      } else {
        addSpanEvent('webhook-failed', {
          'webhook.status_code': response.status,
          'error.message': `HTTP ${response.status}`,
        });

        // Retry on 5xx errors
        if (response.status >= 500) {
          throw new Error(`Webhook failed with status ${response.status}`);
        }

        return {
          statusCode: response.status,
          success: false,
          error: `HTTP ${response.status}: ${responseData}`,
        };
      }
    } catch (error) {
      addSpanEvent('webhook-error', {
        'error.message': (error as Error).message,
      });
      throw error;
    }
  });
}
