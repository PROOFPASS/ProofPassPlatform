import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // Professional documentation structure for open source & SaaS
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: '🏠 Introduction',
    },
    {
      type: 'category',
      label: '🚀 Getting Started',
      collapsed: false,
      items: [
        'getting-started',
        'using-proofpass-saas',
        'authentication-api-keys',
        'pricing-plans',
        'quickstart-blockchain',
        'quick-reference',
      ],
    },
    {
      type: 'category',
      label: '🔌 Integration Guide',
      collapsed: true,
      items: [
        'api-reference',
        'blockchain-api',
        'frontend-integration',
      ],
    },
    {
      type: 'category',
      label: '👥 For Contributors',
      collapsed: true,
      items: [
        'contributing',
        'code-of-conduct',
        'testing-and-docker-setup',
        'security',
      ],
    },
    {
      type: 'category',
      label: '🚢 Deployment & Operations',
      collapsed: true,
      items: [
        'deployment',
        'docker-testing',
        'api-deployment-guide',
        'devops-guide',
      ],
    },
    {
      type: 'category',
      label: '🏗️ Architecture & Design',
      collapsed: true,
      items: [
        'api-architecture',
        'saas-architecture',
      ],
    },
    {
      type: 'category',
      label: '⚙️ Administration',
      collapsed: true,
      items: [
        'admin-dashboard-guide',
      ],
    },
    {
      type: 'category',
      label: '📚 Project Information',
      collapsed: true,
      items: [
        'dpg-submission',
        'dependency-audit',
        'readme',
      ],
    },
  ],
};

export default sidebars;
