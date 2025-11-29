/**
 * Type declarations for circomlibjs
 */

declare module 'circomlibjs' {
  export interface PoseidonFunction {
    (inputs: (bigint | number | string)[]): Uint8Array;
    F: {
      toObject(hash: Uint8Array): bigint;
    };
  }

  export function buildPoseidon(): Promise<PoseidonFunction>;
  export function buildMimc7(): Promise<unknown>;
  export function buildEddsa(): Promise<unknown>;
  export function buildBabyjub(): Promise<unknown>;
}
