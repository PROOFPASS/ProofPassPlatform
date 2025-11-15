/**
 * Batch Credential Creation Utilities
 *
 * Tools for creating multiple credentials at once
 */

import type { AttestationTemplate, ValidationResult } from './index';
import { validateClaims } from './index';

export interface BatchCredentialInput<T = any> {
  templateId: string;
  claims: T;
  metadata?: {
    issuer?: string;
    subject?: string;
    expirationDate?: string;
    [key: string]: any;
  };
}

export interface BatchCredentialResult<T = any> {
  success: boolean;
  index: number;
  templateId: string;
  data?: T;
  error?: string | Error;
}

export interface BatchCreationSummary {
  total: number;
  successful: number;
  failed: number;
  results: BatchCredentialResult[];
  duration: number; // milliseconds
}

/**
 * Validate multiple credentials in batch
 *
 * @param inputs Array of credential inputs to validate
 * @returns Array of validation results
 *
 * @example
 * ```typescript
 * const inputs = [
 *   { templateId: 'farm-origin', claims: farmData },
 *   { templateId: 'processing', claims: processingData },
 *   { templateId: 'transport', claims: transportData },
 * ];
 *
 * const results = validateBatch(inputs);
 * console.log(`Validated ${results.filter(r => r.success).length} credentials`);
 * ```
 */
export function validateBatch(
  inputs: BatchCredentialInput[]
): BatchCredentialResult[] {
  const startTime = Date.now();

  const results = inputs.map((input, index) => {
    try {
      const validation = validateClaims(input.templateId, input.claims);

      if (validation.success) {
        return {
          success: true,
          index,
          templateId: input.templateId,
          data: validation.data,
        };
      } else {
        return {
          success: false,
          index,
          templateId: input.templateId,
          error: validation.errors?.message || 'Validation failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        index,
        templateId: input.templateId,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  return results;
}

/**
 * Create batch credentials with summary
 *
 * @param inputs Array of credential inputs
 * @returns Batch creation summary with all results
 *
 * @example
 * ```typescript
 * const summary = createBatchWithSummary(inputs);
 * console.log(`Created ${summary.successful}/${summary.total} credentials in ${summary.duration}ms`);
 * ```
 */
export function createBatchWithSummary(
  inputs: BatchCredentialInput[]
): BatchCreationSummary {
  const startTime = Date.now();
  const results = validateBatch(inputs);

  const summary: BatchCreationSummary = {
    total: inputs.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
    duration: Date.now() - startTime,
  };

  return summary;
}

/**
 * Create sequential batch (stops on first error)
 *
 * @param inputs Array of credential inputs
 * @returns Results array (may be partial if error occurs)
 *
 * @example
 * ```typescript
 * try {
 *   const results = await createSequentialBatch(inputs);
 *   console.log('All credentials created successfully');
 * } catch (error) {
 *   console.error('Batch failed:', error);
 * }
 * ```
 */
export function createSequentialBatch(
  inputs: BatchCredentialInput[]
): BatchCredentialResult[] {
  const results: BatchCredentialResult[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];

    try {
      const validation = validateClaims(input.templateId, input.claims);

      if (!validation.success) {
        throw new Error(validation.errors?.message || 'Validation failed');
      }

      results.push({
        success: true,
        index: i,
        templateId: input.templateId,
        data: validation.data,
      });
    } catch (error) {
      const errorResult: BatchCredentialResult = {
        success: false,
        index: i,
        templateId: input.templateId,
        error: error instanceof Error ? error.message : String(error),
      };
      results.push(errorResult);
      throw error; // Stop on first error
    }
  }

  return results;
}

/**
 * Create supply chain batch (common pattern)
 *
 * @param supplyChainSteps Array of supply chain credentials
 * @returns Batch creation summary
 *
 * @example
 * ```typescript
 * const summary = createSupplyChainBatch([
 *   { templateId: 'farm-origin', claims: farmData },
 *   { templateId: 'processing', claims: processingData },
 *   { templateId: 'transport', claims: transportData },
 *   { templateId: 'retail', claims: retailData },
 * ]);
 * ```
 */
export function createSupplyChainBatch(
  supplyChainSteps: BatchCredentialInput[]
): BatchCreationSummary {
  // Validate that all supply chain templates are used
  const validTemplates = ['farm-origin', 'processing', 'transport', 'retail'];

  for (const step of supplyChainSteps) {
    if (!validTemplates.includes(step.templateId)) {
      throw new Error(
        `Invalid supply chain template: ${step.templateId}. Must be one of: ${validTemplates.join(', ')}`
      );
    }
  }

  return createBatchWithSummary(supplyChainSteps);
}

/**
 * Group batch results by success/failure
 *
 * @param results Array of batch results
 * @returns Grouped results
 */
export function groupBatchResults(results: BatchCredentialResult[]): {
  successful: BatchCredentialResult[];
  failed: BatchCredentialResult[];
} {
  return {
    successful: results.filter((r) => r.success),
    failed: results.filter((r) => !r.success),
  };
}

/**
 * Retry failed credentials
 *
 * @param failedResults Previously failed results
 * @param inputs Original inputs
 * @returns New batch results
 *
 * @example
 * ```typescript
 * const { failed } = groupBatchResults(results);
 * const retryResults = retryFailedCredentials(failed, originalInputs);
 * ```
 */
export function retryFailedCredentials(
  failedResults: BatchCredentialResult[],
  inputs: BatchCredentialInput[]
): BatchCredentialResult[] {
  const retryInputs = failedResults.map((result) => inputs[result.index]);
  return validateBatch(retryInputs);
}

/**
 * Format batch summary for display
 *
 * @param summary Batch creation summary
 * @returns Formatted string
 */
export function formatBatchSummary(summary: BatchCreationSummary): string {
  const successRate = ((summary.successful / summary.total) * 100).toFixed(1);

  let output = `Batch Creation Summary:\n`;
  output += `  Total: ${summary.total}\n`;
  output += `  Successful: ${summary.successful} (${successRate}%)\n`;
  output += `  Failed: ${summary.failed}\n`;
  output += `  Duration: ${summary.duration}ms\n`;

  if (summary.failed > 0) {
    output += `\nFailed Credentials:\n`;
    summary.results
      .filter((r) => !r.success)
      .forEach((result) => {
        output += `  [${result.index}] ${result.templateId}: ${result.error}\n`;
      });
  }

  return output;
}
