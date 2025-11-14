#!/usr/bin/env tsx
/**
 * ProofPass CLI - Interactive Command-Line Tool
 *
 * Provides convenient commands for common ProofPass operations
 *
 * Author: Federico Boiero (fboiero@frvm.utn.edu.ar)
 * Date: November 13, 2025
 */

import { spawn } from 'child_process';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

interface Command {
  name: string;
  description: string;
  action: () => Promise<void>;
}

class ProofPassCLI {
  private rl: readline.Interface;
  private commands: Command[];

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.commands = [
      {
        name: 'install',
        description: 'Run installation wizard',
        action: () => this.runInstallWizard(),
      },
      {
        name: 'validate',
        description: 'Validate system requirements',
        action: () => this.runValidation(),
      },
      {
        name: 'health',
        description: 'Run health check',
        action: () => this.runHealthCheck(),
      },
      {
        name: 'dev',
        description: 'Start development servers',
        action: () => this.startDev(),
      },
      {
        name: 'build',
        description: 'Build all packages',
        action: () => this.buildPackages(),
      },
      {
        name: 'test',
        description: 'Run tests',
        action: () => this.runTests(),
      },
      {
        name: 'stellar:setup',
        description: 'Setup Stellar testnet account',
        action: () => this.setupStellar(),
      },
      {
        name: 'stellar:demo',
        description: 'Run Stellar demo',
        action: () => this.runStellarDemo(),
      },
      {
        name: 'stellar:balance',
        description: 'Check Stellar account balance',
        action: () => this.checkStellarBalance(),
      },
      {
        name: 'db:setup',
        description: 'Setup database (Docker)',
        action: () => this.setupDatabase(),
      },
      {
        name: 'db:migrate',
        description: 'Run database migrations',
        action: () => this.runMigrations(),
      },
      {
        name: 'db:reset',
        description: 'Reset database',
        action: () => this.resetDatabase(),
      },
      {
        name: 'docs',
        description: 'Open documentation',
        action: () => this.openDocs(),
      },
      {
        name: 'status',
        description: 'Show platform status',
        action: () => this.showStatus(),
      },
      {
        name: 'help',
        description: 'Show this help message',
        action: () => this.showHelp(),
      },
      {
        name: 'exit',
        description: 'Exit CLI',
        action: () => this.exit(),
      },
    ];
  }

  private log(message: string, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  private logSuccess(message: string) {
    this.log(`✓ ${message}`, colors.green);
  }

  private logError(message: string) {
    this.log(`✗ ${message}`, colors.red);
  }

  private logInfo(message: string) {
    this.log(`ℹ ${message}`, colors.cyan);
  }

  private logWarning(message: string) {
    this.log(`⚠ ${message}`, colors.yellow);
  }

  private async prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(`${colors.yellow}? ${colors.reset}${question} `, (answer) => {
        resolve(answer);
      });
    });
  }

  private async confirm(question: string): Promise<boolean> {
    const answer = await this.prompt(`${question} (y/n)`);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  }

  private async runCommand(command: string, cwd?: string): Promise<number> {
    return new Promise((resolve) => {
      const child = spawn(command, {
        shell: true,
        stdio: 'inherit',
        cwd: cwd || process.cwd(),
      });

      child.on('exit', (code) => {
        resolve(code || 0);
      });
    });
  }

  private showBanner() {
    console.clear();
    this.log(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                               ┃
┃   ██████╗ ██████╗  ██████╗  ██████╗ ███████╗██████╗  █████╗ ┃
┃   ██╔══██╗██╔══██╗██╔═══██╗██╔═══██╗██╔════╝██╔══██╗██╔══██╗┃
┃   ██████╔╝██████╔╝██║   ██║██║   ██║█████╗  ██████╔╝███████║┃
┃   ██╔═══╝ ██╔══██╗██║   ██║██║   ██║██╔══╝  ██╔═══╝ ██╔══██║┃
┃   ██║     ██║  ██║╚██████╔╝╚██████╔╝██║     ██║     ██║  ██║┃
┃   ╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝     ╚═╝  ╚═╝┃
┃                                                               ┃
┃                     Command-Line Tool                         ┃
┃                                                               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
    `, colors.cyan);
    this.logInfo('Interactive CLI for ProofPass Platform');
    console.log('');
  }

  private async showHelp() {
    console.log('');
    this.log('Available Commands:', colors.bright);
    console.log('');

    const categories = {
      'Getting Started': ['install', 'validate', 'health'],
      'Development': ['dev', 'build', 'test'],
      'Stellar': ['stellar:setup', 'stellar:demo', 'stellar:balance'],
      'Database': ['db:setup', 'db:migrate', 'db:reset'],
      'Utilities': ['docs', 'status', 'help', 'exit'],
    };

    for (const [category, cmdNames] of Object.entries(categories)) {
      this.log(`\n${category}:`, colors.cyan + colors.bright);
      for (const cmdName of cmdNames) {
        const cmd = this.commands.find((c) => c.name === cmdName);
        if (cmd) {
          const padding = ' '.repeat(20 - cmd.name.length);
          console.log(`  ${colors.green}${cmd.name}${colors.reset}${padding}${cmd.description}`);
        }
      }
    }

    console.log('');
  }

  private async runInstallWizard() {
    this.logInfo('Starting installation wizard...');
    await this.runCommand('./scripts/install-wizard.sh');
  }

  private async runValidation() {
    this.logInfo('Validating system requirements...');
    await this.runCommand('./scripts/validate-system.sh');
  }

  private async runHealthCheck() {
    this.logInfo('Running health check...');
    await this.runCommand('./scripts/health-check.sh');
  }

  private async startDev() {
    console.log('');
    this.log('Select service to start:', colors.bright);
    console.log('');
    console.log('1. API Server (port 3000)');
    console.log('2. Platform UI (port 3001)');
    console.log('3. Both (in separate terminals)');
    console.log('');

    const choice = await this.prompt('Select (1-3):');

    switch (choice) {
      case '1':
        this.logInfo('Starting API server...');
        await this.runCommand('npm run dev', 'apps/api');
        break;
      case '2':
        this.logInfo('Starting Platform UI...');
        await this.runCommand('npm run dev', 'apps/platform');
        break;
      case '3':
        this.logInfo('Opening both services...');
        this.logInfo('API: Open a new terminal and run: cd apps/api && npm run dev');
        this.logInfo('Platform: Open another terminal and run: cd apps/platform && npm run dev');
        break;
      default:
        this.logError('Invalid selection');
    }
  }

  private async buildPackages() {
    this.logInfo('Building packages...');
    await this.runCommand('npm run build:packages');
    this.logSuccess('Build complete!');
  }

  private async runTests() {
    this.logInfo('Running tests...');
    await this.runCommand('npm test');
  }

  private async setupStellar() {
    this.logInfo('Setting up Stellar testnet account...');

    if (fs.existsSync('apps/api/.env')) {
      const envContent = fs.readFileSync('apps/api/.env', 'utf-8');
      if (envContent.includes('STELLAR_SECRET_KEY') && !envContent.includes('STELLAR_SECRET_KEY=')) {
        this.logWarning('Stellar account already configured');
        const proceed = await this.confirm('Create new account anyway?');
        if (!proceed) {
          return;
        }
      }
    }

    await this.runCommand('npm run setup:stellar');
    this.logSuccess('Stellar account configured!');
  }

  private async runStellarDemo() {
    this.logInfo('Running Stellar demo...');

    if (!fs.existsSync('apps/api/.env')) {
      this.logError('Environment file not found');
      this.logInfo('Run: proofpass stellar:setup');
      return;
    }

    await this.runCommand('npx tsx scripts/demo-stellar-testnet.ts');
  }

  private async checkStellarBalance() {
    this.logInfo('Checking Stellar balance...');

    const envPath = 'apps/api/.env';
    if (!fs.existsSync(envPath)) {
      this.logError('Environment file not found');
      return;
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const publicKeyMatch = envContent.match(/STELLAR_PUBLIC_KEY=(.+)/);

    if (!publicKeyMatch) {
      this.logError('STELLAR_PUBLIC_KEY not found in .env');
      return;
    }

    const publicKey = publicKeyMatch[1].trim();
    const horizonUrl = `https://horizon-testnet.stellar.org/accounts/${publicKey}`;

    try {
      const response = await fetch(horizonUrl);
      const data = await response.json();

      if (data.balances) {
        console.log('');
        this.log('Account Balance:', colors.bright);
        for (const balance of data.balances) {
          if (balance.asset_type === 'native') {
            this.log(`  XLM: ${colors.green}${balance.balance}${colors.reset}`);
          }
        }
        console.log('');
        this.logInfo(`Explorer: https://stellar.expert/explorer/testnet/account/${publicKey}`);
      }
    } catch (error: any) {
      this.logError(`Failed to fetch balance: ${error.message}`);
    }
  }

  private async setupDatabase() {
    this.logInfo('Setting up PostgreSQL with Docker...');

    const containerName = 'proofpass-postgres';

    // Check if container exists
    const checkResult = await this.runCommand(`docker ps -a | grep ${containerName}`);

    if (checkResult === 0) {
      this.logWarning('PostgreSQL container already exists');
      const restart = await this.confirm('Restart container?');
      if (restart) {
        await this.runCommand(`docker start ${containerName}`);
      }
    } else {
      await this.runCommand(`docker run -d \
        --name ${containerName} \
        -e POSTGRES_DB=proofpass_dev \
        -e POSTGRES_USER=proofpass \
        -e POSTGRES_PASSWORD=proofpass_dev \
        -p 5432:5432 \
        postgres:14-alpine`);

      this.logSuccess('PostgreSQL container created and started');
      this.logInfo('Waiting for PostgreSQL to be ready...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  private async runMigrations() {
    this.logInfo('Running database migrations...');
    await this.runCommand('npm run migrate', 'apps/api');
    this.logSuccess('Migrations complete!');
  }

  private async resetDatabase() {
    this.logWarning('This will delete all data in the database!');
    const confirm = await this.confirm('Are you sure?');

    if (!confirm) {
      this.logInfo('Database reset cancelled');
      return;
    }

    this.logInfo('Resetting database...');
    await this.runCommand('npm run migrate:reset', 'apps/api');
    this.logSuccess('Database reset complete!');
  }

  private async openDocs() {
    console.log('');
    this.log('Documentation Files:', colors.bright);
    console.log('');

    const docs = [
      { file: 'START_HERE.md', desc: 'Quick start guide' },
      { file: 'QUICK_START_STELLAR.md', desc: 'Stellar quick start' },
      { file: 'STELLAR_INTEGRATION_GUIDE.md', desc: 'Stellar integration guide' },
      { file: 'README.md', desc: 'Main README' },
    ];

    docs.forEach((doc, index) => {
      if (fs.existsSync(doc.file)) {
        console.log(`${index + 1}. ${colors.cyan}${doc.file}${colors.reset} - ${doc.desc}`);
      }
    });

    console.log('');
    this.logInfo('Open these files in your editor or use: cat <filename>');
    console.log('');
  }

  private async showStatus() {
    console.log('');
    this.log('Platform Status', colors.bright + colors.cyan);
    console.log('━'.repeat(60));
    console.log('');

    // Check environment
    if (fs.existsSync('apps/api/.env')) {
      this.logSuccess('Environment configured');
    } else {
      this.logWarning('Environment not configured');
    }

    // Check dependencies
    if (fs.existsSync('node_modules')) {
      this.logSuccess('Dependencies installed');
    } else {
      this.logWarning('Dependencies not installed');
    }

    // Check Docker containers
    try {
      const pgCheck = await this.runCommand('docker ps 2>/dev/null | grep proofpass-postgres > /dev/null 2>&1');
      if (pgCheck === 0) {
        this.logSuccess('PostgreSQL running');
      } else {
        this.logInfo('PostgreSQL not running');
      }

      const redisCheck = await this.runCommand('docker ps 2>/dev/null | grep proofpass-redis > /dev/null 2>&1');
      if (redisCheck === 0) {
        this.logSuccess('Redis running');
      } else {
        this.logInfo('Redis not running');
      }
    } catch (error) {
      this.logInfo('Cannot check Docker containers');
    }

    console.log('');
  }

  private async exit() {
    this.logInfo('Goodbye!');
    this.rl.close();
    process.exit(0);
  }

  async run() {
    const args = process.argv.slice(2);

    if (args.length > 0) {
      // Command mode
      const commandName = args[0];
      const command = this.commands.find((c) => c.name === commandName);

      if (command) {
        await command.action();
      } else {
        this.logError(`Unknown command: ${commandName}`);
        this.log('Run without arguments for interactive mode', colors.dim);
      }

      process.exit(0);
    } else {
      // Interactive mode
      this.showBanner();
      await this.showHelp();

      const mainLoop = async () => {
        console.log('');
        const input = await this.prompt(`${colors.cyan}proofpass>${colors.reset}`);

        if (!input.trim()) {
          return mainLoop();
        }

        const command = this.commands.find((c) => c.name === input.trim());

        if (command) {
          console.log('');
          await command.action();
        } else {
          this.logError(`Unknown command: ${input}`);
          this.logInfo('Type "help" for available commands');
        }

        return mainLoop();
      };

      await mainLoop();
    }
  }
}

// Run CLI
const cli = new ProofPassCLI();
cli.run().catch((error) => {
  console.error('CLI Error:', error);
  process.exit(1);
});
