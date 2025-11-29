# ProofPass CLI

Interactive command-line interface for ProofPass Platform development and testing.

## Usage

```bash
# Run the CLI
npm run cli

# Or directly with tsx
npx tsx cli/proofpass.ts
```

## Available Commands

### Getting Started
| Command | Description |
|---------|-------------|
| `install` | Run the installation wizard |
| `validate` | Validate system requirements (Node.js, npm, Docker, etc.) |
| `health` | Run health checks on all services |

### Development
| Command | Description |
|---------|-------------|
| `dev` | Start development servers |
| `build` | Build all packages |
| `test` | Run test suites |

### Database
| Command | Description |
|---------|-------------|
| `db:setup` | Initialize database with Prisma |
| `db:migrate` | Run database migrations |
| `db:reset` | Reset database (WARNING: deletes all data) |
| `db:studio` | Open Prisma Studio |

### Stellar Blockchain
| Command | Description |
|---------|-------------|
| `stellar:setup` | Configure Stellar testnet account |
| `stellar:demo` | Run Stellar integration demo |
| `stellar:balance` | Check Stellar account balance |

### Utilities
| Command | Description |
|---------|-------------|
| `docs` | Open documentation |
| `status` | Show project status |
| `help` | Display help message |
| `exit` | Exit the CLI |

## Examples

```bash
# Check if your system meets requirements
npm run cli
> validate

# Run health checks
npm run cli
> health

# Start development environment
npm run cli
> dev

# Setup Stellar testnet
npm run cli
> stellar:setup
```

## Testing

The CLI includes comprehensive tests:

```bash
# Run CLI tests
npm run test:cli

# Run all tests including CLI
npm run test:all
```

## Architecture

The CLI is built with:
- **TypeScript** - Type-safe implementation
- **readline** - Native Node.js interactive prompts
- **chalk-like colors** - ANSI color output for better UX

## Files

```
cli/
├── proofpass.ts      # Main CLI implementation
├── __tests__/
│   └── proofpass.test.ts  # CLI tests
└── README.md         # This file
```

## Related Documentation

- [Development Guide](../DEVELOPMENT.md)
- [Testing Guide](../TESTING.md)
- [Scripts Documentation](../scripts/README.md)
