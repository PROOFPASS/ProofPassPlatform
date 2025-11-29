/**
 * Type declarations for snarkjs
 * @see https://github.com/iden3/snarkjs
 */

declare module 'snarkjs' {
  export interface Groth16Proof {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  }

  export interface FullProveResult {
    proof: Groth16Proof;
    publicSignals: string[];
  }

  export interface VerificationKey {
    protocol: string;
    curve: string;
    nPublic: number;
    vk_alpha_1: string[];
    vk_beta_2: string[][];
    vk_gamma_2: string[][];
    vk_delta_2: string[][];
    vk_alphabeta_12: string[][][];
    IC: string[][];
  }

  export namespace groth16 {
    function fullProve(
      input: Record<string, string | string[]>,
      wasmFile: string,
      zkeyFileName: string
    ): Promise<FullProveResult>;

    function verify(
      vkey: VerificationKey,
      publicSignals: string[],
      proof: Groth16Proof
    ): Promise<boolean>;

    function exportSolidityCallData(
      proof: Groth16Proof,
      publicSignals: string[]
    ): Promise<string>;
  }

  export namespace plonk {
    function fullProve(
      input: Record<string, string | string[]>,
      wasmFile: string,
      zkeyFileName: string
    ): Promise<FullProveResult>;

    function verify(
      vkey: VerificationKey,
      publicSignals: string[],
      proof: Groth16Proof
    ): Promise<boolean>;
  }

  export namespace powersOfTau {
    function newAccumulator(
      curve: string,
      power: number,
      outputFileName: string
    ): Promise<void>;

    function contribute(
      inputFileName: string,
      outputFileName: string,
      name: string,
      entropy: string
    ): Promise<void>;

    function preparePhase2(
      inputFileName: string,
      outputFileName: string
    ): Promise<void>;
  }

  export namespace zKey {
    function newZKey(
      r1csFileName: string,
      ptauFileName: string,
      zkeyFileName: string
    ): Promise<void>;

    function contribute(
      inputFileName: string,
      outputFileName: string,
      name: string,
      entropy: string
    ): Promise<void>;

    function exportVerificationKey(zkeyFileName: string): Promise<VerificationKey>;

    function exportSolidityVerifier(
      zkeyFileName: string,
      templates: { groth16: string }
    ): Promise<string>;
  }

  export namespace wtns {
    function calculate(
      input: Record<string, string | string[]>,
      wasmFile: string,
      wtnsFileName: string
    ): Promise<void>;
  }
}
