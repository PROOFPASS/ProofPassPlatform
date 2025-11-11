# ProofPass Platform Dashboard

Admin dashboard for managing the ProofPass SaaS platform - built with Next.js 15.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your settings

# Run development server
npm run dev  # http://localhost:3001
```

## Features

- **Organization Management** - Create and manage organizations
- **Usage Tracking** - Monitor API usage and quotas
- **Payment Management** - Track subscriptions and payments
- **API Key Management** - Generate and manage API keys
- **Analytics Dashboard** - Real-time metrics and charts
- **User Authentication** - NextAuth.js integration

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: TanStack Query
- **Authentication**: NextAuth.js
- **Forms**: React Hook Form + Zod

## Configuration

Create `.env.local`:

```bash
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# NextAuth
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-min-32-chars

# Admin credentials (development)
ADMIN_EMAIL=admin@proofpass.local
ADMIN_PASSWORD=admin123
```

## Development

```bash
# Run development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## Production

```bash
# Build for production
npm run build

# Test production build locally
npm start
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
3. Deploy automatically on push to main

### Docker

```bash
# Build image
docker build -t proofpass-platform -f ../../Dockerfile --target platform .

# Run container
docker run -p 3001:3001 --env-file .env.production proofpass-platform
```

## Project Structure

```
apps/platform/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx   # Root layout
│   │   ├── page.tsx     # Home page
│   │   └── api/         # API routes
│   ├── components/       # React components
│   │   ├── ui/          # UI primitives
│   │   └── features/    # Feature components
│   ├── lib/             # Utilities and helpers
│   └── types/           # TypeScript types
├── public/              # Static assets
└── __tests__/           # Tests
```

## Planned Features

### Phase 2.1: Setup + Auth ✅
- [x] Next.js project setup
- [x] TypeScript configuration
- [x] Tailwind CSS styling
- [ ] NextAuth.js authentication
- [ ] Login page
- [ ] Protected routes

### Phase 2.2: Organizations Dashboard
- [ ] List organizations with filters
- [ ] Create/edit organizations
- [ ] Organization details with stats
- [ ] Plan management
- [ ] Usage tracking

### Phase 2.3: Payments Management
- [ ] Register manual payments
- [ ] Payment list with filters
- [ ] Revenue statistics
- [ ] Payment history

### Phase 2.4: API Keys Management
- [ ] Generate API keys (live/test)
- [ ] List and filter keys
- [ ] Deactivate/rotate keys

### Phase 2.5: Analytics Dashboard
- [ ] Overview stats cards
- [ ] Usage and revenue charts
- [ ] Activity feed
- [ ] Real-time metrics

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Documentation

- **Getting Started**: [Getting Started Guide](../../docs/GETTING_STARTED.md)
- **Backend API**: [API README](../api/README.md)
- **Full Documentation**: [docs/](../../docs/)

## Support

- **Issues**: [GitHub Issues](https://github.com/PROOFPASS/ProofPassPlatform/issues)
- **Documentation**: [docs/](../../docs/)
- **Main README**: [Project README](../../README.md)

---

**Status**: Phase 2.1 Setup Complete ✅
**Next**: Implement authentication and dashboard screens
