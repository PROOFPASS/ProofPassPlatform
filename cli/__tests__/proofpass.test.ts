/**
 * ProofPass CLI - Unit Tests
 *
 * Tests for the interactive CLI tool commands
 */

import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('ProofPass CLI', () => {
  const CLI_PATH = path.join(__dirname, '../proofpass.ts');
  const ROOT_PATH = path.join(__dirname, '../..');

  describe('CLI Execution', () => {
    it('should exist and be executable', () => {
      expect(fs.existsSync(CLI_PATH)).toBe(true);
      const stats = fs.statSync(CLI_PATH);
      expect(stats.isFile()).toBe(true);
    });

    it('should have shebang for direct execution', () => {
      const content = fs.readFileSync(CLI_PATH, 'utf-8');
      expect(content.startsWith('#!/usr/bin/env tsx')).toBe(true);
    });
  });

  describe('Help Command', () => {
    it('should display help message with --help flag', (done) => {
      const child = spawn('npx', ['tsx', CLI_PATH, 'help'], {
        cwd: ROOT_PATH,
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        expect(code).toBe(0);
        expect(output).toContain('Available Commands');
        expect(output).toContain('Getting Started');
        expect(output).toContain('Development');
        expect(output).toContain('Stellar');
        expect(output).toContain('Database');
        expect(output).toContain('Utilities');
        done();
      });
    }, 30000);

    it('should list all expected commands', (done) => {
      const child = spawn('npx', ['tsx', CLI_PATH, 'help'], {
        cwd: ROOT_PATH,
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        const expectedCommands = [
          'install',
          'validate',
          'health',
          'dev',
          'build',
          'test',
          'stellar:setup',
          'stellar:demo',
          'stellar:balance',
          'db:setup',
          'db:migrate',
          'db:reset',
          'docs',
          'status',
          'help',
          'exit',
        ];

        expectedCommands.forEach((cmd) => {
          expect(output).toContain(cmd);
        });

        done();
      });
    }, 30000);
  });

  describe('Status Command', () => {
    it('should execute status command', (done) => {
      const child = spawn('npx', ['tsx', CLI_PATH, 'status'], {
        cwd: ROOT_PATH,
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        expect(code).toBe(0);
        expect(output).toContain('Platform Status');
        done();
      });
    }, 30000);

    it('should check environment configuration', (done) => {
      const child = spawn('npx', ['tsx', CLI_PATH, 'status'], {
        cwd: ROOT_PATH,
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', () => {
        // Should mention environment status
        expect(output.toLowerCase()).toMatch(/environment|dependencies/);
        done();
      });
    }, 30000);
  });

  describe('File Dependencies', () => {
    it('should find required scripts', () => {
      const requiredScripts = [
        'scripts/validate-system.sh',
        'scripts/health-check.sh',
        'scripts/install-wizard.sh',
      ];

      requiredScripts.forEach((script) => {
        const scriptPath = path.join(ROOT_PATH, script);
        expect(fs.existsSync(scriptPath)).toBe(true);
      });
    });

    it('should have package.json with CLI script', () => {
      const packageJsonPath = path.join(ROOT_PATH, 'package.json');
      expect(fs.existsSync(packageJsonPath)).toBe(true);

      const packageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, 'utf-8')
      );
      expect(packageJson.scripts).toHaveProperty('cli');
    });
  });

  describe('Command Categories', () => {
    it('should categorize commands correctly', (done) => {
      const child = spawn('npx', ['tsx', CLI_PATH, 'help'], {
        cwd: ROOT_PATH,
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', () => {
        // Check category headers exist
        expect(output).toContain('Getting Started');
        expect(output).toContain('Development');
        expect(output).toContain('Stellar');
        expect(output).toContain('Database');
        expect(output).toContain('Utilities');

        // Check commands appear after their categories
        const gettingStartedIndex = output.indexOf('Getting Started');
        const installIndex = output.indexOf('install');
        expect(installIndex).toBeGreaterThan(gettingStartedIndex);

        done();
      });
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle unknown commands gracefully', (done) => {
      const child = spawn('npx', ['tsx', CLI_PATH, 'nonexistent-command'], {
        cwd: ROOT_PATH,
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        expect(code).toBe(0); // Should exit gracefully
        expect(output.toLowerCase()).toMatch(/unknown|not found|error/i);
        done();
      });
    }, 30000);
  });

  describe('npm Script Integration', () => {
    it('should be executable via npm run cli', () => {
      try {
        const output = execSync('npm run cli help', {
          cwd: ROOT_PATH,
          encoding: 'utf-8',
          timeout: 30000,
        });

        expect(output).toContain('Available Commands');
      } catch (error: any) {
        // If it fails, check the error output
        expect(error.stdout || error.stderr).toContain('Available Commands');
      }
    }, 35000);
  });

  describe('Color Output', () => {
    it('should use ANSI color codes in output', (done) => {
      const child = spawn('npx', ['tsx', CLI_PATH, 'help'], {
        cwd: ROOT_PATH,
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', () => {
        // Check for ANSI escape codes (colors)
        expect(output).toMatch(/\x1b\[/); // ANSI escape sequence
        done();
      });
    }, 30000);
  });
});

describe('CLI Environment', () => {
  const ROOT_PATH = path.join(__dirname, '../..');

  it('should have Node.js available', () => {
    const nodeVersion = process.version;
    expect(nodeVersion).toMatch(/^v\d+\.\d+\.\d+$/);

    // Check minimum Node version (v20)
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
    expect(majorVersion).toBeGreaterThanOrEqual(20);
  });

  it('should have required npm packages installed', () => {
    const nodeModulesPath = path.join(ROOT_PATH, 'node_modules');
    expect(fs.existsSync(nodeModulesPath)).toBe(true);

    // Check for critical packages
    const criticalPackages = ['typescript', 'tsx'];
    criticalPackages.forEach((pkg) => {
      const pkgPath = path.join(nodeModulesPath, pkg);
      expect(fs.existsSync(pkgPath)).toBe(true);
    });
  });

  it('should have git repository initialized', () => {
    const gitPath = path.join(ROOT_PATH, '.git');
    expect(fs.existsSync(gitPath)).toBe(true);
  });
});
