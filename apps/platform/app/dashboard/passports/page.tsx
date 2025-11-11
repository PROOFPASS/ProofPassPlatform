'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { passportsService, type Passport } from '@/lib/services/passports';

export default function PassportsPage() {
  const [passport, setPassport] = useState<Passport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPassport();
  }, []);

  const loadPassport = async () => {
    try {
      setLoading(true);
      const data = await passportsService.getMyPassport();
      setPassport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load passport');
    } finally {
      setLoading(false);
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Digital Passport</h1>
            <p className="text-gray-600 mt-2">
              Verifiable credential collection with DID-based identity
            </p>
          </div>
          <Link
            href={`/dashboard/passports/${passport.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Manage Passport
          </Link>
        </div>
      </div>

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
              <div>
                <dt className="text-sm font-medium text-gray-500">Owner</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {passport.user.name} ({passport.user.email})
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(passport.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(passport.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Attestations */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Verifiable Credentials ({passport.attestations.length})
              </h2>
              <Link
                href="/dashboard/credentials"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Credential
              </Link>
            </div>

            {passport.attestations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No credentials in your passport yet.</p>
                <Link
                  href="/dashboard/credentials"
                  className="mt-2 inline-block text-blue-600 hover:text-blue-800"
                >
                  Create your first credential →
                </Link>
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
                      <Link
                        href={`/dashboard/credentials/${attestation.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View
                      </Link>
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
                onClick={handleDownload}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Download JSON
              </button>
              <button
                onClick={copyShareUrl}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Copy Share URL
              </button>
              <Link
                href={`/dashboard/passports/${passport.id}`}
                className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors text-center"
              >
                Manage Credentials
              </Link>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">About Passports</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>Your digital passport is a collection of verifiable credentials.</p>
              <p>Each credential is cryptographically signed and can be verified independently.</p>
              <p>Share your passport URL to let others verify your credentials.</p>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Statistics</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Total Credentials</dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {passport.attestations.length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Anchored</dt>
                <dd className="text-sm font-semibold text-green-600">
                  {passport.attestations.filter((a: any) => a.status === 'anchored').length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Pending</dt>
                <dd className="text-sm font-semibold text-yellow-600">
                  {passport.attestations.filter((a: any) => a.status === 'pending').length}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
