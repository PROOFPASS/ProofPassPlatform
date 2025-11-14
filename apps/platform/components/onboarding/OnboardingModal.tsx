'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
  action?: {
    label: string;
    href: string;
  };
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: 'Welcome to ProofPass Platform',
    description: 'Create verifiable credentials, digital passports, and anchor them on the blockchain. Let\'s get you started!',
    icon: '👋',
  },
  {
    title: 'Create Your First Credential',
    description: 'Verifiable credentials are digital, tamper-proof certificates. You can issue credentials for degrees, certifications, or any verifiable claim.',
    icon: '🎓',
    action: {
      label: 'Create Credential',
      href: '/dashboard/credentials/new',
    },
  },
  {
    title: 'Build Digital Passports',
    description: 'Combine multiple credentials into a portable digital passport. Perfect for product traceability and compliance.',
    icon: '📱',
    action: {
      label: 'View Passports',
      href: '/dashboard/passports',
    },
  },
  {
    title: 'Anchor on Blockchain',
    description: 'Every credential and passport is anchored on Stellar blockchain for immutable proof. View transactions on Stellar Explorer.',
    icon: '⛓️',
    action: {
      label: 'View Analytics',
      href: '/dashboard/analytics',
    },
  },
  {
    title: 'API Integration',
    description: 'Generate API keys to integrate ProofPass into your applications. Complete REST API documentation available.',
    icon: '🔑',
    action: {
      label: 'Manage API Keys',
      href: '/api-keys',
    },
  },
];

interface OnboardingModalProps {
  onComplete?: () => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('proofpass_onboarding_complete');
    if (!seen) {
      setIsOpen(true);
    } else {
      setHasSeenOnboarding(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('proofpass_onboarding_complete', 'true');
    setIsOpen(false);
    setHasSeenOnboarding(true);
    onComplete?.();
  };

  const handleReopen = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  if (!isOpen && hasSeenOnboarding) {
    return (
      <button
        onClick={handleReopen}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
        title="Restart tour"
      >
        <span className="mr-2">💡</span>
        Help
      </button>
    );
  }

  if (!isOpen) {
    return null;
  }

  const step = onboardingSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full bg-white shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="text-6xl mb-4">{step.icon}</div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              Skip tour
            </button>
          </div>

          {/* Content */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              {step.title}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Action Button (if available) */}
          {step.action && (
            <div className="mb-6">
              <a
                href={step.action.href}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {step.action.label} →
              </a>
            </div>
          )}

          {/* Progress Indicators */}
          <div className="flex gap-2 mb-6">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-600'
                    : index < currentStep
                    ? 'bg-blue-300'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              variant="outline"
              className="px-6"
            >
              Previous
            </Button>

            <div className="text-sm text-gray-500">
              {currentStep + 1} of {onboardingSteps.length}
            </div>

            <Button
              onClick={handleNext}
              className="px-6 bg-blue-600 hover:bg-blue-700"
            >
              {currentStep < onboardingSteps.length - 1 ? 'Next' : 'Get Started'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
