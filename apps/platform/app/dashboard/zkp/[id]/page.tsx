'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { zkpService, type ZKProof, type VerificationResult } from '@/lib/services/zkp';
import Link from 'next/link';

export default function ZKProofDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [proof, setProof] = useState<ZKProof | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProofData, setShowProofData] = useState(false);

  useEffect(() => {
    loadProof();
  }, [id]);

  const loadProof = async () => {
    try {
      setLoading(true);
      const data = await zkpService.getById(id);
      setProof(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load proof');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setVerifying(true);
      const result = await zkpService.verify(id);
      setVerification(result);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !proof) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Proof not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          ← Back to Proofs
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {zkpService.getCircuitName(proof.circuit_type)}
            </h1>
            <p className="text-gray-600 mt-2">Zero-Knowledge Proof Details</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${proof.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {proof.verified ? 'Verified' : 'Unverified'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Proof Info */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Proof Information</h2>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Proof ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono break-all">{proof.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Attestation ID</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link href={`/dashboard/credentials/${proof.attestation_id}`} className="text-blue-600 hover:text-blue-800 font-mono break-all">
                    {proof.attestation_id}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Circuit Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{zkpService.getCircuitName(proof.circuit_type)}</dd>
                <dd className="mt-1 text-sm text-gray-500">{zkpService.getCircuitDescription(proof.circuit_type)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(proof.created_at).toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          {/* Public Inputs */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Public Inputs</h2>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(proof.public_inputs, null, 2)}
            </pre>
          </div>

          {/* Proof Data */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">zk-SNARK Proof Data</h2>
              <button
                onClick={() => setShowProofData(!showProofData)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {showProofData ? 'Hide' : 'Show'}
              </button>
            </div>
            {showProofData && (
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs break-all font-mono">
                {proof.proof}
              </pre>
            )}
          </div>

          {/* Verification Results */}
          {verification && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Verification Results</h2>
              <div className={`p-4 rounded-lg ${verification.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`font-semibold text-lg ${verification.valid ? 'text-green-800' : 'text-red-800'}`}>
                  {verification.valid ? '✓ Proof is cryptographically valid' : '✗ Proof verification failed'}
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  {verification.valid
                    ? 'The zero-knowledge proof has been verified using Groth16 zk-SNARK verification. The prover knows the private inputs without revealing them.'
                    : 'The proof could not be verified. It may have been tampered with or generated incorrectly.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {verifying ? 'Verifying...' : 'Verify Proof'}
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">About zk-SNARKs</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>This proof uses Groth16, a production-ready zk-SNARK system.</p>
              <p>The proof demonstrates knowledge of private inputs without revealing them.</p>
              <p>Nullifiers prevent proof replay attacks.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
