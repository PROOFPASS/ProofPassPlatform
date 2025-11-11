'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { credentialsService, type CreateCredentialRequest } from '@/lib/services/credentials';

export default function NewCredentialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCredentialRequest>({
    subject: '',
    type: '',
    claims: {},
    blockchain_network: 'stellar',
  });
  const [claimsJSON, setClaimsJSON] = useState('{}');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Parse claims JSON
      const parsedClaims = JSON.parse(claimsJSON);

      const credential = await credentialsService.create({
        ...formData,
        claims: parsedClaims,
      });

      router.push(`/dashboard/credentials/${credential.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create credential');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Verifiable Credential</h1>
        <p className="text-gray-600 mt-2">
          Create a new W3C-compliant verifiable credential with DID-based signature
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject DID
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="did:key:z6Mk... or did:web:example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            The DID of the credential subject (recipient)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Credential Type
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            placeholder="e.g., EducationCredential, AgeVerification, EmploymentCredential"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            The type of credential you're issuing
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Claims (JSON)
            <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={claimsJSON}
            onChange={(e) => setClaimsJSON(e.target.value)}
            rows={8}
            placeholder={`{\n  "name": "John Doe",\n  "degree": "Bachelor of Science",\n  "graduationYear": 2023\n}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <p className="text-sm text-gray-500 mt-1">
            The claims/attributes to include in the credential (must be valid JSON)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Blockchain Network
          </label>
          <select
            value={formData.blockchain_network}
            onChange={(e) => setFormData({ ...formData, blockchain_network: e.target.value as 'stellar' | 'optimism' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="stellar">Stellar</option>
            <option value="optimism">Optimism</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            The blockchain network to anchor the credential (optional)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiration Date (Optional)
          </label>
          <input
            type="datetime-local"
            value={formData.expirationDate || ''}
            onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            When this credential expires (leave blank for no expiration)
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Creating...' : 'Create Credential'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Example Claims</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Education:</strong> {`{ "degree": "PhD", "university": "MIT", "year": 2023 }`}</p>
          <p><strong>Age Verification:</strong> {`{ "age": 25, "country": "US", "verified": true }`}</p>
          <p><strong>Employment:</strong> {`{ "company": "Acme Inc", "position": "Engineer", "since": "2020" }`}</p>
        </div>
      </div>
    </div>
  );
}
