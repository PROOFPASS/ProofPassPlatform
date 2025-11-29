import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'ProofPass Platform',
  tagline: 'Digital Public Good for Verifiable Credentials & Zero-Knowledge Proofs',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://PROOFPASS.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/ProofPassPlatform/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'PROOFPASS', // Usually your GitHub org/user name.
  projectName: 'ProofPassPlatform', // Usually your repo name.

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/PROOFPASS/ProofPassPlatform/tree/main/website/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/PROOFPASS/ProofPassPlatform/tree/main/website/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    metadata: [
      {name: 'keywords', content: 'verifiable credentials, zero knowledge proofs, blockchain, W3C, DID, digital identity, supply chain, product passports'},
      {name: 'twitter:card', content: 'summary_large_image'},
      {property: 'og:type', content: 'website'},
    ],
    announcementBar: {
      id: 'stellar_live',
      content: 'Stellar blockchain integration is now live! <a href="/ProofPassPlatform/docs/getting-started">Get Started</a>',
      backgroundColor: '#25c2a0',
      textColor: '#fff',
      isCloseable: true,
    },
    navbar: {
      title: 'ProofPass',
      logo: {
        alt: 'ProofPass Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/docs/api-reference',
          label: 'API',
          position: 'left',
        },
        {
          to: '/docs/getting-started',
          label: 'Quick Start',
          position: 'left',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/PROOFPASS/ProofPassPlatform',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started',
            },
            {
              label: 'API Reference',
              to: '/docs/api-reference',
            },
            {
              label: 'Architecture',
              to: '/docs/api-architecture',
            },
            {
              label: 'Security',
              to: '/docs/security',
            },
          ],
        },
        {
          title: 'Technology',
          items: [
            {
              label: 'API Architecture',
              to: '/docs/api-architecture',
            },
            {
              label: 'SaaS Architecture',
              to: '/docs/saas-architecture',
            },
            {
              label: 'DevOps Guide',
              to: '/docs/devops-guide',
            },
            {
              label: 'Docker & Testing',
              to: '/docs/docker-testing',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/PROOFPASS/ProofPassPlatform',
            },
            {
              label: 'Contributing',
              to: '/docs/contributing',
            },
            {
              label: 'Code of Conduct',
              to: '/docs/code-of-conduct',
            },
          ],
        },
        {
          title: 'About',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'DPG Submission',
              to: '/docs/dpg-submission',
            },
            {
              label: 'Pricing Plans',
              to: '/docs/pricing-plans',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ProofPass Platform. A Digital Public Good. Open Source (AGPL-3.0).`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'javascript', 'docker'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
