# Pricing & Plans

Choose the plan that best fits your needs - from free tier for experimentation to enterprise for production workloads.

## Plan Overview

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| **Price** | $0/month | $49/month | Custom |
| **API Requests** | 100/day | 10,000/day | Unlimited |
| **Blockchain Operations** | 10/month | 1,000/month | Unlimited |
| **Attestations** | 10/month | 1,000/month | Unlimited |
| **ZKP Proofs** | 5/month | 500/month | Unlimited |
| **Team Members** | 1 | 5 | Unlimited |
| **API Keys** | 1 | 5 | Unlimited |
| **Support** | Community | Email (24-48h) | Dedicated (4-8h) |
| **SLA** | None | 99.5% | 99.9% |
| **Custom Domain** | ❌ | ❌ | ✅ |
| **White Labeling** | ❌ | ❌ | ✅ |
| **Dedicated Instance** | ❌ | ❌ | ✅ |

## Plan Details

### Free Plan - $0/month

Perfect for:
- Trying out ProofPass
- Personal projects
- Learning and experimentation
- Proof of concepts

**Features**:
- ✅ 100 API requests per day
- ✅ 10 blockchain operations per month
- ✅ 10 attestations per month
- ✅ 5 ZKP proofs per month
- ✅ 1 team member
- ✅ 1 API key (test mode)
- ✅ Community support
- ✅ Access to all core features
- ✅ Documentation and guides

**Limitations**:
- No production API keys
- Community support only
- No SLA guarantee
- Rate limited at 10 requests/minute

**Get Started**:
```bash
# Sign up at platform.proofpass.co
curl https://platform.proofpass.co/api/v1/signup \
  -d '{"email": "you@example.com", "plan": "free"}'
```

---

### Pro Plan - $49/month

Perfect for:
- Startups and small businesses
- Production applications
- Growing projects
- Professional developers

**Features**:
- ✅ 10,000 API requests per day (300K/month)
- ✅ 1,000 blockchain operations per month
- ✅ 1,000 attestations per month
- ✅ 500 ZKP proofs per month
- ✅ Up to 5 team members
- ✅ 5 API keys (live + test)
- ✅ Email support (24-48 hour response)
- ✅ 99.5% uptime SLA
- ✅ Advanced analytics dashboard
- ✅ Webhook support
- ✅ Priority bug fixes
- ✅ Rate limit: 100 requests/minute

**Additional Benefits**:
- 💳 Overage protection (soft limits with alerts)
- 📊 Advanced usage metrics and reports
- 🔔 Usage alerts and notifications
- 📈 Historical data retention (90 days)
- 🔐 Enhanced security features

**Pricing**:
- **Monthly**: $49/month
- **Annual**: $490/year ($40.83/month - save 17%)

**Overage Rates** (if enabled):
- API requests: $0.10 per 1,000 requests
- Blockchain ops: $0.50 per 10 operations
- Attestations: $0.30 per 10 attestations

**Upgrade**:
```bash
# Via dashboard or API
curl -X POST https://platform.proofpass.co/api/v1/subscription \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"plan": "pro", "interval": "monthly"}'
```

---

### Enterprise Plan - Custom Pricing

Perfect for:
- Large organizations
- High-volume applications
- Mission-critical systems
- Compliance-heavy industries

**Features**:
- ✅ Unlimited API requests
- ✅ Unlimited blockchain operations
- ✅ Unlimited attestations
- ✅ Unlimited ZKP proofs
- ✅ Unlimited team members
- ✅ Unlimited API keys
- ✅ Dedicated support (4-8 hour response)
- ✅ 99.9% uptime SLA
- ✅ Custom SLA options available
- ✅ Priority feature requests
- ✅ Dedicated account manager
- ✅ Custom rate limits

**Enterprise-Exclusive Features**:
- 🏢 **Dedicated Infrastructure**: Your own instance
- 🎨 **White Labeling**: Custom branding
- 🌐 **Custom Domain**: your-domain.com
- 🔒 **SSO & SAML**: Enterprise authentication
- 📋 **Compliance**: SOC 2, HIPAA, GDPR support
- 🔐 **Advanced Security**: Custom security policies
- 💾 **Data Residency**: Choose your data location
- 🔄 **Custom Integrations**: Built to your needs
- 📞 **Phone Support**: Direct line to engineers
- 🎓 **Training**: Onboarding and workshops
- 📊 **Custom Reports**: Tailored analytics

**Service Level Agreement**:
- 99.9% uptime guarantee
- < 200ms average response time
- < 1 hour critical issue response
- Dedicated status page
- Proactive monitoring

**Contact Sales**:
- 📧 Email: sales@proofpass.co
- 📅 Book Demo: [Schedule a call](https://proofpass.co/demo)
- 💬 Slack Connect: Available for enterprise customers

---

## Feature Comparison

### API & Integration

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| REST API | ✅ | ✅ | ✅ |
| GraphQL API | ❌ | ✅ | ✅ |
| Webhooks | ❌ | ✅ | ✅ |
| WebSockets | ❌ | ❌ | ✅ |
| Batch Operations | Limited | ✅ | ✅ |
| Rate Limit | 10 req/min | 100 req/min | Custom |

### Identity & Credentials

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Verifiable Credentials | ✅ | ✅ | ✅ |
| Digital Passports | ✅ | ✅ | ✅ |
| Attestations | 10/month | 1,000/month | Unlimited |
| Custom Schemas | ❌ | ✅ | ✅ |
| DID Methods | did:web | did:web, did:key | All methods |
| Credential Templates | Basic | Advanced | Custom |

### Blockchain & Anchoring

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Blockchain Anchoring | 10/month | 1,000/month | Unlimited |
| Stellar Network | ✅ | ✅ | ✅ |
| Ethereum (coming soon) | ❌ | ❌ | ✅ |
| Custom Blockchain | ❌ | ❌ | ✅ |
| Transaction Priority | Standard | High | Highest |
| Gas Fee Optimization | ❌ | ✅ | ✅ |

### Zero-Knowledge Proofs

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| ZKP Generation | 5/month | 500/month | Unlimited |
| ZKP Verification | Unlimited | Unlimited | Unlimited |
| Proof Types | Basic | All standard | Custom circuits |
| Proof Templates | 2 | 10 | Unlimited |

### Security & Compliance

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| SSL/TLS | ✅ | ✅ | ✅ |
| API Key Auth | ✅ | ✅ | ✅ |
| OAuth 2.0 | ❌ | ✅ | ✅ |
| SSO/SAML | ❌ | ❌ | ✅ |
| 2FA | ✅ | ✅ | ✅ |
| IP Whitelisting | ❌ | ✅ | ✅ |
| Audit Logs | 7 days | 90 days | Custom |
| SOC 2 Compliance | ❌ | ❌ | ✅ |
| HIPAA Compliance | ❌ | ❌ | ✅ |
| Custom Security Policies | ❌ | ❌ | ✅ |

### Support & SLA

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Documentation | ✅ | ✅ | ✅ |
| Community Forum | ✅ | ✅ | ✅ |
| Email Support | ❌ | 24-48h | 4-8h |
| Phone Support | ❌ | ❌ | ✅ |
| Slack Support | ❌ | ❌ | ✅ |
| Uptime SLA | None | 99.5% | 99.9% |
| Dedicated Manager | ❌ | ❌ | ✅ |
| Training | ❌ | ❌ | ✅ |
| Custom Development | ❌ | ❌ | ✅ |

## Usage-Based Pricing (Pro Plan Overages)

If you exceed your Pro plan limits, you can enable overage billing:

### API Request Overages

| Volume | Price per 1,000 requests |
|--------|--------------------------|
| 0 - 100K | $0.10 |
| 100K - 1M | $0.08 |
| 1M+ | Contact us |

### Blockchain Operation Overages

| Volume | Price per 10 operations |
|--------|-------------------------|
| 0 - 5K | $0.50 |
| 5K - 50K | $0.40 |
| 50K+ | Contact us |

### Attestation Overages

| Volume | Price per 10 attestations |
|--------|---------------------------|
| 0 - 5K | $0.30 |
| 5K - 50K | $0.25 |
| 50K+ | Contact us |

**Enable Overages**:
```
Settings → Billing → Enable Overage Billing
```

## Frequently Asked Questions

### General

**Q: Can I change plans anytime?**
A: Yes! Upgrade anytime and changes take effect immediately. Downgrades apply at the next billing cycle.

**Q: Do unused limits roll over?**
A: No, limits reset at the start of each billing period (daily for requests, monthly for operations).

**Q: What payment methods do you accept?**
A: Credit cards (Visa, Mastercard, Amex). Enterprise plans can use ACH or wire transfer.

**Q: Is there a setup fee?**
A: No setup fees for Free and Pro plans. Enterprise plans may have implementation fees depending on customization.

### Billing

**Q: When am I billed?**
A: Billing occurs monthly on your signup anniversary. Annual plans are billed once per year.

**Q: Can I get a refund?**
A: Yes, we offer a 30-day money-back guarantee for Pro and Enterprise plans.

**Q: What happens if my payment fails?**
A: We'll retry 3 times over 7 days and send email notifications. After that, your account may be suspended.

**Q: Do you offer discounts?**
A: Yes! We offer:
- 17% discount on annual plans
- Non-profit discount (50% off Pro)
- Educational discount (50% off Pro)
- Startup program (3 months free Pro)

### Limits & Overages

**Q: What happens if I hit my limit?**
A: API requests will return a 429 error. You can enable overage billing or upgrade your plan.

**Q: How do I monitor my usage?**
A: Real-time usage dashboard at Settings → Usage & Billing. We also send alerts at 50%, 80%, and 90% of limits.

**Q: Are there any soft limits?**
A: Yes, Pro plan has soft limits with alerts. You can continue beyond the limit if overages are enabled.

### Enterprise

**Q: What's included in Enterprise pricing?**
A: Custom pricing based on your needs. Includes infrastructure, support, SLA, and implementation.

**Q: Can I get a dedicated instance?**
A: Yes, Enterprise plans can include dedicated infrastructure in your preferred cloud region.

**Q: Do you support on-premise deployment?**
A: Yes, but only for Enterprise customers with specific compliance requirements.

### Technical

**Q: Do test API calls count toward limits?**
A: No, test mode API calls (using `pk_test_` keys) don't count toward your production limits.

**Q: What's the rate limit?**
A: Free: 10 req/min, Pro: 100 req/min, Enterprise: Custom. Burst limits allow short spikes.

**Q: Can I increase just one limit?**
A: Not on Free/Pro plans. Enterprise plans can customize individual limits.

## How to Choose

### Choose Free if you:
- 🧪 Want to try ProofPass
- 📚 Are learning about verifiable credentials
- 🏠 Building a personal project
- 💡 Prototyping an idea

### Choose Pro if you:
- 🚀 Launching a production app
- 👥 Need team collaboration
- 📈 Expect moderate traffic
- 💼 Running a business
- 🔒 Need SLA guarantees

### Choose Enterprise if you:
- 🏢 Large organization
- 📊 High volume (100K+ requests/day)
- 🔐 Strict compliance requirements
- 🎨 Need customization
- ☎️ Want dedicated support
- 🌍 Need data residency

## Migration Path

### Free → Pro
**When to upgrade**:
- Hitting daily request limits
- Need production API keys
- Want faster support
- Need team collaboration

**Process**:
1. Settings → Billing → Upgrade to Pro
2. Enter payment information
3. Limits increase immediately
4. Billed monthly starting today

### Pro → Enterprise
**When to upgrade**:
- Exceeding Pro limits regularly
- Need custom features
- Require dedicated support
- Compliance requirements

**Process**:
1. Contact sales@proofpass.co
2. Discuss requirements and pricing
3. Review and sign enterprise agreement
4. Account upgraded within 1-2 weeks

## Open Source Option

ProofPass is also available as **open source** for self-hosting:

**Self-Hosted Features**:
- ✅ Full source code access
- ✅ Deploy on your infrastructure
- ✅ No API limits
- ✅ Complete customization
- ✅ No monthly fees
- ⚠️ You manage everything

**Trade-offs**:
- Need DevOps expertise
- Manage updates and security
- No SLA or dedicated support
- Setup and maintenance time
- Infrastructure costs

**Get Started**:
```bash
git clone https://github.com/PROOFPASS/ProofPassPlatform
cd ProofPassPlatform
docker-compose up
```

See [Deployment Guide](./deployment.md) for details.

## Get Started

### Sign Up for Free
```
👉 https://platform.proofpass.co/signup
```

### Upgrade to Pro
```
👉 Settings → Billing → Upgrade to Pro
```

### Contact Enterprise Sales
```
📧 sales@proofpass.co
📅 https://proofpass.co/demo
💬 Slack Connect available
```

## Next Steps

- [Using ProofPass SaaS](./using-proofpass-saas.md) - Get started guide
- [Authentication & API Keys](./authentication-api-keys.md) - API authentication
- [API Reference](./api-reference.md) - Complete API documentation
- [Deployment Guide](./deployment.md) - Self-hosting option

## Need Help Choosing?

**Talk to Us**:
- 📧 Email: sales@proofpass.co
- 💬 Chat: [Live chat](https://proofpass.co/chat)
- 📅 Demo: [Schedule a call](https://proofpass.co/demo)

**Calculate Your Needs**:
Use our [pricing calculator](https://proofpass.co/pricing-calculator) to estimate costs based on your expected usage.
