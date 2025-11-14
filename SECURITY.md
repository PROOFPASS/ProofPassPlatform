# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Create a Public Issue

Please do not create a public GitHub issue for security vulnerabilities.

### 2. Report Privately

Send details to: **fboiero@frvm.utn.edu.ar**

Include in your report:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information

### 3. Response Timeline

- **Within 24 hours**: We will acknowledge receipt of your report
- **Within 7 days**: We will provide an initial assessment of the severity
- **Within 30 days**: We will release a fix for critical vulnerabilities
- **Within 90 days**: We will release a fix for non-critical vulnerabilities

### 4. Disclosure Policy

- We ask that you do not publicly disclose the vulnerability until we have released a fix
- Once a fix is released, we will publicly acknowledge your responsible disclosure
- We will credit you in our security advisories (unless you prefer to remain anonymous)

## Security Best Practices

For detailed security documentation, see:
- [Security Best Practices Guide](docs/SECURITY.md) - Comprehensive security documentation
- [Deployment Security](docs/DEPLOYMENT.md) - Production deployment security

## Security Features

ProofPass Platform implements defense-in-depth security:

- **Authentication**: JWT tokens with secure signing
- **Authorization**: Resource-level access control
- **Input Validation**: All inputs validated with Zod schemas
- **Rate Limiting**: Multi-tier protection against abuse
- **SQL Injection Prevention**: Parameterized queries throughout
- **XSS Protection**: Input sanitization and CSP headers
- **Security Headers**: Helmet.js with strict configuration
- **Encryption**: TLS 1.3 for transport, bcrypt for passwords
- **Audit Logging**: Comprehensive security event logging

## Known Limitations

Current platform limitations (as of v0.1.0):

1. **Zero-Knowledge Proofs**: Simplified implementation for MVP, not production-grade zk-SNARKs
2. **API Key Rotation**: Manual process, no automatic expiration
3. **JWT Secret Rotation**: No automated rotation mechanism

These limitations are documented and planned for future releases.

## Security Audits

- **Last Internal Audit**: November 2024
- **External Audit**: Planned for v1.0.0 release

## Contact

For security inquiries:
- Email: fboiero@frvm.utn.edu.ar
- GitHub: [@fboiero](https://github.com/fboiero)

---

Thank you for helping keep ProofPass Platform and our users safe!
