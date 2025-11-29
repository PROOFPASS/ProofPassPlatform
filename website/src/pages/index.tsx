import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const FeatureList = [
  {
    title: 'W3C Verifiable Credentials',
    icon: '🔐',
    description: 'Create tamper-proof digital credentials following W3C standards. Support for did:key and did:web methods with Ed25519 signatures.',
  },
  {
    title: 'Zero-Knowledge Proofs',
    icon: '🛡️',
    description: 'Production-ready Groth16 zk-SNARKs. Prove claims without revealing sensitive data. Range proofs, set membership, and threshold verification.',
  },
  {
    title: 'Multi-Blockchain Anchoring',
    icon: '⛓️',
    description: 'Anchor credentials on Stellar (live), Optimism, and Arbitrum. Immutable proof of existence with low transaction costs.',
  },
  {
    title: 'Digital Product Passports',
    icon: '📱',
    description: 'Aggregate credentials into portable passports. Full supply chain traceability and product authentication.',
  },
  {
    title: 'Enterprise SaaS Ready',
    icon: '🏢',
    description: 'Multi-tenant architecture with RBAC, API keys, rate limiting, and organization management. Scale from startup to enterprise.',
  },
  {
    title: 'Digital Public Good',
    icon: '🌍',
    description: 'Open source (AGPL-3.0), standards-compliant, and designed for global impact. Free for organizations worldwide.',
  },
];

const TechStack = [
  { name: 'Stellar', category: 'Blockchain' },
  { name: 'Optimism', category: 'Blockchain' },
  { name: 'Arbitrum', category: 'Blockchain' },
  { name: 'W3C DID', category: 'Standards' },
  { name: 'W3C VC', category: 'Standards' },
  { name: 'Groth16', category: 'ZK Proofs' },
  { name: 'Ed25519', category: 'Cryptography' },
  { name: 'JWT', category: 'Auth' },
];

const Stats = [
  { value: '6+', label: 'Blockchain Networks' },
  { value: '3', label: 'ZK Proof Types' },
  { value: '85%+', label: 'Test Coverage' },
  { value: 'W3C', label: 'Compliant' },
];

const UseCases = [
  {
    title: 'Supply Chain Traceability',
    description: 'Track products from origin to consumer with verifiable credentials at each step. Ensure authenticity and compliance.',
    icon: '📦',
  },
  {
    title: 'Academic Credentials',
    description: 'Issue tamper-proof diplomas and certificates. Students own their credentials and can share them instantly.',
    icon: '🎓',
  },
  {
    title: 'Identity Verification',
    description: 'Verify identity attributes without exposing personal data using zero-knowledge proofs. Age verification, membership proofs.',
    icon: '🪪',
  },
  {
    title: 'Product Authentication',
    description: 'Combat counterfeiting with blockchain-anchored product passports. QR codes for instant verification.',
    icon: '✅',
  },
];

function Feature({title, icon, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>{icon}</div>
        <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.badge}>Digital Public Good</div>
          <Heading as="h1" className={styles.heroTitle}>
            Verifiable Credentials &<br />Zero-Knowledge Proofs
          </Heading>
          <p className={styles.heroSubtitle}>
            Enterprise-grade platform for issuing tamper-proof digital credentials
            with privacy-preserving verification. Built on W3C standards with
            multi-blockchain anchoring.
          </p>
          <div className={styles.buttons}>
            <Link
              className="button button--primary button--lg"
              to="/docs/getting-started">
              Get Started
            </Link>
            <Link
              className="button button--secondary button--lg"
              to="/docs/api-reference">
              API Reference
            </Link>
            <Link
              className={clsx('button button--outline button--lg', styles.githubButton)}
              href="https://github.com/PROOFPASS/ProofPassPlatform">
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatsSection() {
  return (
    <section className={styles.statsSection}>
      <div className="container">
        <div className={styles.statsGrid}>
          {Stats.map((stat, idx) => (
            <div key={idx} className={styles.statItem}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2">Core Capabilities</Heading>
          <p>Everything you need to build trust in digital ecosystems</p>
        </div>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TechStackSection() {
  return (
    <section className={styles.techSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2">Technology Stack</Heading>
          <p>Built on proven technologies and open standards</p>
        </div>
        <div className={styles.techGrid}>
          {TechStack.map((tech, idx) => (
            <div key={idx} className={styles.techBadge}>
              <span className={styles.techName}>{tech.name}</span>
              <span className={styles.techCategory}>{tech.category}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UseCasesSection() {
  return (
    <section className={styles.useCasesSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2">Use Cases</Heading>
          <p>Trusted by organizations across industries</p>
        </div>
        <div className={styles.useCasesGrid}>
          {UseCases.map((useCase, idx) => (
            <div key={idx} className={styles.useCaseCard}>
              <div className={styles.useCaseIcon}>{useCase.icon}</div>
              <Heading as="h3">{useCase.title}</Heading>
              <p>{useCase.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArchitectureSection() {
  return (
    <section className={styles.architectureSection}>
      <div className="container">
        <div className="row">
          <div className="col col--6">
            <div className={styles.archContent}>
              <Heading as="h2">Production-Ready Architecture</Heading>
              <ul className={styles.archList}>
                <li><strong>RESTful API</strong> - Fastify with OpenAPI documentation</li>
                <li><strong>Multi-tenant</strong> - Organization isolation with RBAC</li>
                <li><strong>Queue System</strong> - BullMQ for async credential processing</li>
                <li><strong>Caching</strong> - Redis for high-performance operations</li>
                <li><strong>Observability</strong> - OpenTelemetry, Prometheus, Jaeger</li>
                <li><strong>Security</strong> - OWASP compliant with rate limiting</li>
              </ul>
              <Link
                className="button button--primary"
                to="/docs/api-architecture">
                View Architecture
              </Link>
            </div>
          </div>
          <div className="col col--6">
            <div className={styles.codePreview}>
              <div className={styles.codeHeader}>
                <span>Quick Start</span>
              </div>
              <pre className={styles.codeBlock}>
{`# Clone and install
git clone https://github.com/PROOFPASS/ProofPassPlatform
cd ProofPassPlatform && npm install

# Start development
npm run dev

# Run CLI demo
npm run demo:standalone`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.ctaSection}>
      <div className="container">
        <div className={styles.ctaContent}>
          <Heading as="h2">Ready to Build Trust?</Heading>
          <p>
            Start issuing verifiable credentials in minutes.
            Open source, enterprise-ready, and backed by W3C standards.
          </p>
          <div className={styles.ctaButtons}>
            <Link
              className="button button--primary button--lg"
              to="/docs/getting-started">
              Start Building
            </Link>
            <Link
              className="button button--secondary button--lg"
              href="https://github.com/PROOFPASS/ProofPassPlatform">
              Star on GitHub
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Verifiable Credentials & Zero-Knowledge Proofs Platform"
      description="ProofPass Platform - Enterprise-grade Digital Public Good for W3C Verifiable Credentials, Zero-Knowledge Proofs, and Multi-Blockchain Anchoring">
      <HomepageHeader />
      <main>
        <StatsSection />
        <FeaturesSection />
        <TechStackSection />
        <UseCasesSection />
        <ArchitectureSection />
        <CTASection />
      </main>
    </Layout>
  );
}
