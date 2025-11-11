'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zkpService, type GenerateZKProofRequest, type CircuitType } from '@/lib/services/zkp';
import { credentialsService, type Credential } from '@/lib/services/credentials';

export default function NewZKProofPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCredentials, setLoadingCredentials] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [formData, setFormData] = useState<GenerateZKProofRequest>({
    attestation_id: '',
    circuit_type: 'threshold',
    private_inputs: {},
    public_inputs: {},
  });
  const [privateInputsJSON, setPrivateInputsJSON] = useState('{}');
  const [publicInputsJSON, setPublicInputsJSON] = useState('{}');

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const data = await credentialsService.list();
      setCredentials(data.filter(c => c.status === 'anchored'));
    } catch (err: any) {
      setError('Failed to load credentials');
    } finally {
      setLoadingCredentials(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const privateInputs = JSON.parse(privateInputsJSON);
      const publicInputs = JSON.parse(publicInputsJSON);

      const proof = await zkpService.generate({
        ...formData,
        private_inputs: privateInputs,
        public_inputs: publicInputs,
      });

      router.push(`/dashboard/zkp/${proof.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate proof');
    } finally {
      setLoading(false);
    }
  };

  const getExampleInputs = (circuitType: CircuitType) => {
    switch (circuitType) {
      case 'threshold':
        return {
          private: { value: 25, nullifier: '0x1234567890abcdef' },
          public: { threshold: 18 },
        };
      case 'range':
        return {
          private: { value: 25, nullifier: '0x1234567890abcdef' },
          public: { min: 18, max: 65 },
        };
      case 'set_membership':
        return {
          private: { value: 'CA', nullifier: '0x1234567890abcdef' },
          public: { set: ['US', 'CA', 'MX', 'UK', 'FR'] },
        };
    }
  };

  const handleCircuitChange = (type: CircuitType) => {
    setFormData({ ...formData, circuit_type: type });
    const examples = getExampleInputs(type);
    setPrivateInputsJSON(JSON.stringify(examples.private, null, 2));
    setPublicInputsJSON(JSON.stringify(examples.public, null, 2));
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Generate Zero-Knowledge Proof</h1>
        <p className="text-gray-600 mt-2">
          Create a zk-SNARK proof using Groth16 without revealing private data
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
            Select Credential
            <span className="text-red-500">*</span>
          </label>
          {loadingCredentials ? (
            <div className="text-sm text-gray-500">Loading credentials...</div>
          ) : (
            <select
              required
              value={formData.attestation_id}
              onChange={(e) => setFormData({ ...formData, attestation_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a credential...</option>
              {credentials.map((cred) => (
                <option key={cred.id} value={cred.id}>
                  {cred.type} - {cred.id.substring(0, 8)}...
                </option>
              ))}
            </select>
          )}
          <p className="text-sm text-gray-500 mt-1">
            The credential to generate a proof from (must be anchored)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Circuit Type
            <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {(['threshold', 'range', 'set_membership'] as CircuitType[]).map((type) => (
              <div key={type} className="flex items-start">
                <input
                  type="radio"
                  id={type}
                  checked={formData.circuit_type === type}
                  onChange={() => handleCircuitChange(type)}
                  className="mt-1 mr-3"
                />
                <label htmlFor={type} className="cursor-pointer">
                  <div className="font-medium text-gray-900">{zkpService.getCircuitName(type)}</div>
                  <div className="text-sm text-gray-500">{zkpService.getCircuitDescription(type)}</div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Private Inputs (JSON)
            <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={privateInputsJSON}
            onChange={(e) => setPrivateInputsJSON(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <p className="text-sm text-gray-500 mt-1">
            Private values that won't be revealed in the proof (must include nullifier for replay protection)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Public Inputs (JSON)
            <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={publicInputsJSON}
            onChange={(e) => setPublicInputsJSON(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <p className="text-sm text-gray-500 mt-1">
            Public parameters that will be included in the proof
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Generating Proof...' : 'Generate Proof'}
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
        <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>1. Threshold:</strong> Prove age ≥ 18 without revealing exact age</p>
          <p><strong>2. Range:</strong> Prove salary in [50K, 100K] without exact amount</p>
          <p><strong>3. Set Membership:</strong> Prove citizenship in allowed countries without revealing which one</p>
        </div>
      </div>
    </div>
  );
}
