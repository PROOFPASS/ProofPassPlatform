'use client';

import { useState } from 'react';
import { Card } from '../ui/card';

interface HelpTip {
  title: string;
  content: string;
  link?: {
    text: string;
    href: string;
  };
}

const helpTips: Record<string, HelpTip> = {
  '/dashboard': {
    title: 'Dashboard Overview',
    content: 'View your platform statistics, recent credentials, and blockchain activity. All data is updated in real-time.',
    link: {
      text: 'Learn more about dashboards',
      href: '/docs/dashboard',
    },
  },
  '/dashboard/credentials': {
    title: 'Verifiable Credentials',
    content: 'Create W3C-compliant verifiable credentials with cryptographic proofs. Each credential is signed and can be independently verified.',
    link: {
      text: 'Credential documentation',
      href: '/docs/credentials',
    },
  },
  '/dashboard/credentials/new': {
    title: 'Creating a Credential',
    content: 'Fill in the credential details, add claims, and issue. The credential will be signed with your DID and optionally anchored on Stellar blockchain.',
    link: {
      text: 'Credential schema guide',
      href: '/docs/credential-schema',
    },
  },
  '/dashboard/passports': {
    title: 'Digital Passports',
    content: 'Combine multiple credentials into a portable digital passport. Useful for product traceability and compliance documentation.',
    link: {
      text: 'Passport guide',
      href: '/docs/passports',
    },
  },
  '/dashboard/zkp': {
    title: 'Zero-Knowledge Proofs',
    content: 'Create proofs that verify statements without revealing the underlying data. Perfect for privacy-preserving verification.',
    link: {
      text: 'ZKP documentation',
      href: '/docs/zkp',
    },
  },
  '/api-keys': {
    title: 'API Keys',
    content: 'Generate and manage API keys for programmatic access. Each key can have specific permissions and rate limits.',
    link: {
      text: 'API documentation',
      href: '/docs/api',
    },
  },
  '/analytics': {
    title: 'Analytics',
    content: 'Track credential issuance, verifications, and blockchain transactions. Export reports for compliance and auditing.',
    link: {
      text: 'Analytics guide',
      href: '/docs/analytics',
    },
  },
};

interface HelpWidgetProps {
  path?: string;
}

export default function HelpWidget({ path }: HelpWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const currentPath = path || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const helpTip = helpTips[currentPath];

  if (!helpTip && !isOpen) {
    return null;
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
        title="Show help"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    );
  }

  if (!isOpen && helpTip) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40 flex items-center gap-2"
        title="Show contextual help"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Need help?</span>
      </button>
    );
  }

  if (!isOpen) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 bg-white shadow-2xl z-40 border-2 border-blue-100">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="font-semibold">Help</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="hover:bg-blue-800 rounded p-1 transition-colors"
              title="Minimize"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-800 rounded p-1 transition-colors"
              title="Close"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {helpTip ? (
          <>
            <h4 className="font-bold text-lg mb-2 text-gray-900">
              {helpTip.title}
            </h4>
            <p className="text-gray-600 mb-4 leading-relaxed">
              {helpTip.content}
            </p>
            {helpTip.link && (
              <a
                href={helpTip.link.href}
                className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                {helpTip.link.text}
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <h4 className="font-bold text-lg text-gray-900">
              ProofPass Platform Help
            </h4>
            <div className="space-y-2">
              <a
                href="/docs"
                className="block p-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700"
              >
                <div className="font-medium">Documentation</div>
                <div className="text-sm text-gray-500">
                  Complete guides and API reference
                </div>
              </a>
              <a
                href="/docs/quickstart"
                className="block p-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700"
              >
                <div className="font-medium">Quick Start Guide</div>
                <div className="text-sm text-gray-500">
                  Get started in 5 minutes
                </div>
              </a>
              <a
                href="/docs/faq"
                className="block p-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700"
              >
                <div className="font-medium">FAQ</div>
                <div className="text-sm text-gray-500">
                  Common questions answered
                </div>
              </a>
              <a
                href="mailto:fboiero@frvm.utn.edu.ar"
                className="block p-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700"
              >
                <div className="font-medium">Contact Support</div>
                <div className="text-sm text-gray-500">
                  Get help from our team
                </div>
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-3 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Keyboard shortcuts</span>
          <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">
            ?
          </kbd>
        </div>
      </div>
    </Card>
  );
}
