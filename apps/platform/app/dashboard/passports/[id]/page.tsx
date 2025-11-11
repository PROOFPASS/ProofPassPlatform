'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { passportsService, type Passport } from '@/lib/services/passports';
import { credentialsService, type Credential } from '@/lib/services/credentials';
import Link from 'next/link';

export default function PassportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [passport, setPassport] = useState<Passport | null>(null);
  const [availableCredentials, setAvailableCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [passportData, credentialsData] = await Promise.all([
        passportsService.getById(id),
        credentialsService.list(),
      ]);
      setPassport(passportData);

      // Filter out credentials that are already in the passport
      const attestationIds = new Set(passportData.attestations.map((a: any) => a.id));
      const available = credentialsData.filter(
        (c) => c.status === 'anchored' && !attestationIds.has(c.id)
      );
      setAvailableCredentials(available);
    } catch (err: any) {
      setError(err.message || 'Failed to load passport');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAttestation = async (attestationId: string) => {
    if (!passport) return;
    try {
      setLoadingAction(true);
      const updated = await passportsService.addAttestation(passport.id, attestationId);
      setPassport(updated);
      setShowAddModal(false);
      await loadData(); // Reload to update available credentials
    } catch (err: any) {
      setError(err.message || 'Failed to add credential');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRemoveAttestation = async (attestationId: string) => {
    if (!passport) return;
    if (!confirm('Are you sure you want to remove this credential from your passport?')) return;

    try {
      setLoadingAction(true);
      const updated = await passportsService.removeAttestation(passport.id, attestationId);
      setPassport(updated);
      await loadData(); // Reload to update available credentials
    } catch (err: any) {
      setError(err.message || 'Failed to remove credential');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDownload = async () => {
    if (!passport) return;
    try {
      const blob = await passportsService.downloadAsJson(passport.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `passport-${passport.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to download passport');
    }
  };

  const copyShareUrl = () => {
    if (!passport) return;
    const url = passportsService.getShareUrl(passport.id);
    navigator.clipboard.writeText(url);
    alert('Share URL copied to clipboard!');
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

  if (error || !passport) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Passport not found'}
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
          ← Back to Passport
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Digital Passport</h1>
            <p className="text-gray-600 mt-2">Add or remove verifiable credentials</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Passport Info */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Passport Information</h2>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Passport ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono break-all">{passport.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">DID (Decentralized Identity)</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono break-all">{passport.did}</dd>
              </div>
            </dl>
          </div>

          {/* Current Credentials */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Current Credentials ({passport.attestations.length})
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                + Add Credential
              </button>
            </div>

            {passport.attestations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No credentials in your passport yet.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Add your first credential →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {passport.attestations.map((attestation: any) => (
                  <div
                    key={attestation.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{attestation.type}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            attestation.status === 'anchored'
                              ? 'bg-green-100 text-green-800'
                              : attestation.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {attestation.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 font-mono truncate">
                          {attestation.id}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Issued: {new Date(attestation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/credentials/${attestation.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleRemoveAttestation(attestation.id)}
                          disabled={loadingAction}
                          className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Add Credential
              </button>
              <button
                onClick={handleDownload}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Download JSON
              </button>
              <button
                onClick={copyShareUrl}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Copy Share URL
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">About Credentials</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>Add anchored credentials to your passport for verification.</p>
              <p>Each credential is cryptographically signed and blockchain-anchored.</p>
              <p>Remove credentials anytime without affecting the originals.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Credential Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Add Credential to Passport</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {availableCredentials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No available credentials to add.</p>
                  <p className="mt-2 text-sm">
                    Create new credentials or wait for pending credentials to be anchored.
                  </p>
                  <Link
                    href="/dashboard/credentials/new"
                    className="mt-4 inline-block text-blue-600 hover:text-blue-800"
                  >
                    Create New Credential →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableCredentials.map((credential) => (
                    <div
                      key={credential.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{credential.type}</h4>
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              {credential.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 font-mono truncate">
                            {credential.id}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Issued: {new Date(credential.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddAttestation(credential.id)}
                          disabled={loadingAction}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          {loadingAction ? 'Adding...' : 'Add'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
