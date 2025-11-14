'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface QuickStartTask {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
}

const quickStartTasks: QuickStartTask[] = [
  {
    id: 'create_credential',
    title: 'Create your first credential',
    description: 'Issue a verifiable credential in minutes',
    href: '/dashboard/credentials/new',
    icon: '🎓',
  },
  {
    id: 'create_passport',
    title: 'Build a digital passport',
    description: 'Combine credentials into a portable passport',
    href: '/dashboard/passports',
    icon: '📱',
  },
  {
    id: 'generate_api_key',
    title: 'Generate an API key',
    description: 'Integrate ProofPass into your apps',
    href: '/api-keys',
    icon: '🔑',
  },
  {
    id: 'view_stellar',
    title: 'View blockchain transactions',
    description: 'See your data anchored on Stellar',
    href: '/dashboard/analytics',
    icon: '⛓️',
  },
];

export default function QuickStartWidget() {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('proofpass_completed_tasks');
    const dismissed = localStorage.getItem('proofpass_quickstart_dismissed');

    if (completed) {
      setCompletedTasks(new Set(JSON.parse(completed)));
    }

    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const markTaskComplete = (taskId: string) => {
    const newCompleted = new Set(completedTasks);
    newCompleted.add(taskId);
    setCompletedTasks(newCompleted);
    localStorage.setItem('proofpass_completed_tasks', JSON.stringify(Array.from(newCompleted)));
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('proofpass_quickstart_dismissed', 'true');
  };

  const handleReset = () => {
    setCompletedTasks(new Set());
    setIsDismissed(false);
    localStorage.removeItem('proofpass_completed_tasks');
    localStorage.removeItem('proofpass_quickstart_dismissed');
  };

  if (isDismissed) {
    return (
      <button
        onClick={handleReset}
        className="text-sm text-blue-600 hover:text-blue-700 underline"
      >
        Show quick start guide
      </button>
    );
  }

  const progress = (completedTasks.size / quickStartTasks.length) * 100;
  const allComplete = completedTasks.size === quickStartTasks.length;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              🚀 Quick Start Guide
            </h3>
            <p className="text-sm text-gray-600">
              {allComplete
                ? 'Great job! You\'re all set up.'
                : 'Complete these tasks to get started with ProofPass'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <svg
                className={`w-5 h-5 transition-transform ${
                  isCollapsed ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Dismiss"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress: {completedTasks.size} of {quickStartTasks.length}
            </span>
            <span className="text-sm font-bold text-blue-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Tasks */}
        {!isCollapsed && (
          <div className="space-y-3">
            {quickStartTasks.map((task) => {
              const isComplete = completedTasks.has(task.id);

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isComplete
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{task.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {task.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {task.description}
                      </p>
                      <div className="flex gap-2">
                        {!isComplete ? (
                          <>
                            <a href={task.href}>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Start →
                              </Button>
                            </a>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markTaskComplete(task.id)}
                            >
                              Mark as done
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-green-700">
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="font-medium">Complete</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Completion Message */}
        {allComplete && !isCollapsed && (
          <div className="mt-6 p-4 bg-green-100 border-2 border-green-300 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🎉</div>
              <div>
                <h4 className="font-bold text-green-900 mb-1">
                  Congratulations!
                </h4>
                <p className="text-sm text-green-800">
                  You've completed the quick start guide. Explore more features or check out the{' '}
                  <a href="/docs" className="underline font-medium">
                    documentation
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
