export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-4">
          ProofPass Platform
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Admin Dashboard - Phase 2 Setup Complete
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="p-6 border rounded-lg hover:border-primary transition-colors">
            <h2 className="text-xl font-semibold mb-2">🔐 Authentication</h2>
            <p className="text-sm text-muted-foreground">
              NextAuth.js with JWT backend integration
            </p>
          </div>

          <div className="p-6 border rounded-lg hover:border-primary transition-colors">
            <h2 className="text-xl font-semibold mb-2">🏢 Organizations</h2>
            <p className="text-sm text-muted-foreground">
              Manage customer organizations and plans
            </p>
          </div>

          <div className="p-6 border rounded-lg hover:border-primary transition-colors">
            <h2 className="text-xl font-semibold mb-2">💳 Payments</h2>
            <p className="text-sm text-muted-foreground">
              Manual payment registration and tracking
            </p>
          </div>

          <div className="p-6 border rounded-lg hover:border-primary transition-colors">
            <h2 className="text-xl font-semibold mb-2">🔑 API Keys</h2>
            <p className="text-sm text-muted-foreground">
              Generate and manage client API keys
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            ✅ Next.js 15 + TypeScript + Tailwind CSS
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Ready for Phase 2 implementation
          </p>
        </div>
      </div>
    </div>
  );
}
