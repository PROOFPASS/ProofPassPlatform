'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { credentialsService, type Credential, type VerificationResult } from '@/lib/services/credentials';
import Image from 'next/image';

export default function CredentialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [credential, setCredential] = useState<Credential | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJWT, setShowJWT] = useState(false);

  useEffect(() => {
    loadCredential();
  }, [id]);

  const loadCredential = async () => {
    try {
      setLoading(true);
      const data = await credentialsService.getById(id);
      setCredential(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load credential');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setVerifying(true);
      const result = await credentialsService.verify(id);
      setVerification(result);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleDownloadJWT = () => {
    if (credential) {
      credentialsService.downloadCredentialJWT(credential.id);
    }
  };

  const handleDownloadJSON = () => {
    if (credential) {
      credentialsService.downloadCredentialJSON(credential.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'anchored':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !credential) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Credential not found'}
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
          ← Back to Credentials
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{credential.type}</h1>
            <p className="text-gray-600 mt-2">Verifiable Credential Details</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(credential.status)}`}>
            {credential.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Credential Info */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Credential Information</h2>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono break-all">{credential.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Issuer DID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono break-all">{credential.issuer_did}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Subject DID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono break-all">{credential.subject}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Issued At</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(credential.issued_at).toLocaleString()}</dd>
              </div>
              {credential.blockchain_network && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Blockchain</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{credential.blockchain_network}</dd>
                </div>
              )}
              {credential.blockchain_tx_hash && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Transaction Hash</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono break-all">{credential.blockchain_tx_hash}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Claims */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Claims</h2>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(credential.claims, null, 2)}
            </pre>
          </div>

          {/* JWT */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Credential JWT</h2>
              <button
                onClick={() => setShowJWT(!showJWT)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {showJWT ? 'Hide' : 'Show'}
              </button>
            </div>
            {showJWT && (
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs break-all font-mono">
                {credential.credential}
              </pre>
            )}
          </div>

          {/* Verification Results */}
          {verification && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Verification Results</h2>
              <div className={`p-4 rounded-lg ${verification.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`font-semibold ${verification.valid ? 'text-green-800' : 'text-red-800'}`}>
                  {verification.valid ? '✓ Credential is valid' : '✗ Credential is invalid'}
                </p>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="font-medium">Credential Signature:</dt>
                    <dd className={verification.verification.credentialValid ? 'text-green-600' : 'text-red-600'}>
                      {verification.verification.credentialValid ? 'Valid' : 'Invalid'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Blockchain Anchor:</dt>
                    <dd className={verification.verification.blockchainVerified ? 'text-green-600' : 'text-gray-600'}>
                      {verification.verification.blockchainVerified ? 'Verified' : 'Not verified'}
                    </dd>
                  </div>
                </dl>
                {verification.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-red-800 mb-2">Errors:</p>
                    <ul className="list-disc list-inside text-sm text-red-700">
                      {verification.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
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
                {verifying ? 'Verifying...' : 'Verify Credential'}
              </button>
              <button
                onClick={handleDownloadJWT}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Download JWT
              </button>
              <button
                onClick={handleDownloadJSON}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Download JSON
              </button>
            </div>
          </div>

          {/* QR Code */}
          {credential.qr_code && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">QR Code</h3>
              <div className="flex justify-center">
                <Image
                  src={credential.qr_code}
                  alt="Credential QR Code"
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Scan to verify credential
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
