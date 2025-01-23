import readline from 'readline/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import net from 'net';

const execAsync = promisify(exec);

class DeploymentWizard {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async checkPort(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => {
        resolve(false);
      });
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      server.listen(port);
    });
  }

  async askQuestion(question) {
    const answer = await this.rl.question(`\x1b[36m${question}\x1b[0m `);
    return answer.trim();
  }

  async verifyNodeVersion() {
    try {
      const { stdout } = await execAsync('node --version');
      const version = parseInt(stdout.match(/v(\d+)/)[1]);
      return version >= 18;
    } catch (error) {
      return false;
    }
  }

  async checkDatabaseConnection(dbUrl) {
    try {
      // Only validate URL format for now
      new URL(dbUrl);
      return true;
    } catch (error) {
      return false;
    }
  }

  async validatePath(dirPath) {
    try {
      await fs.access(dirPath, fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  async setupNpmDependencies() {
    console.log('\n📦 Installing dependencies...');
    try {
      await execAsync('npm install');
      return true;
    } catch (error) {
      console.error('\x1b[31m❌ Failed to install dependencies:', error.message, '\x1b[0m');
      return false;
    }
  }

  async setupDatabase() {
    console.log('\n🔄 Setting up database...');
    try {
      await execAsync('npm run db:push');
      return true;
    } catch (error) {
      console.error('\x1b[31m❌ Database setup failed:', error.message, '\x1b[0m');
      return false;
    }
  }

  async run() {
    console.log('\x1b[32m=== Document Review App Deployment Wizard ===\x1b[0m\n');

    // Step 1: Check Node.js version
    console.log('📋 Checking system requirements...');
    if (!await this.verifyNodeVersion()) {
      console.error('\x1b[31m❌ Node.js 18 or higher is required.\x1b[0m');
      console.log('Please install Node.js from: https://nodejs.org/');
      return false;
    }
    console.log('\x1b[32m✓ Node.js version check passed\x1b[0m');

    // Step 2: Check write permissions
    const currentDir = process.cwd();
    if (!await this.validatePath(currentDir)) {
      console.error('\x1b[31m❌ No write permission in the current directory\x1b[0m');
      return false;
    }
    console.log('\x1b[32m✓ Directory permissions verified\x1b[0m');

    // Step 3: Database Configuration
    console.log('\n📦 Database Configuration');
    let dbUrl;
    let isValidDb = false;
    do {
      dbUrl = await this.askQuestion(
        'Enter your PostgreSQL database URL (format: postgresql://user:password@host:port/database):'
      );
      isValidDb = await this.checkDatabaseConnection(dbUrl);
      if (!isValidDb) {
        console.error('\x1b[31m❌ Invalid database URL format. Please try again.\x1b[0m');
      }
    } while (!isValidDb);
    console.log('\x1b[32m✓ Database URL format validated\x1b[0m');

    // Step 4: Port Configuration
    console.log('\n🔌 Port Configuration');
    let port;
    let isPortAvailable = false;
    do {
      port = await this.askQuestion('Enter the port to run the application (default: 5000):');
      const portNumber = parseInt(port) || 5000;
      isPortAvailable = await this.checkPort(portNumber);
      if (!isPortAvailable) {
        console.error(`\x1b[31m❌ Port ${portNumber} is already in use. Please choose another port.\x1b[0m`);
      }
    } while (!isPortAvailable);
    console.log('\x1b[32m✓ Port availability confirmed\x1b[0m');

    // Step 5: Create environment file
    console.log('\n📝 Creating environment configuration...');
    try {
      await fs.writeFile('.env', `DATABASE_URL=${dbUrl}\nPORT=${port}\n`);
      console.log('\x1b[32m✓ Environment configuration created\x1b[0m');
    } catch (error) {
      console.error('\x1b[31m❌ Failed to create environment configuration:', error.message, '\x1b[0m');
      return false;
    }

    // Step 6: Install dependencies
    if (!await this.setupNpmDependencies()) {
      return false;
    }
    console.log('\x1b[32m✓ Dependencies installed\x1b[0m');

    // Step 7: Run database migrations
    if (!await this.setupDatabase()) {
      return false;
    }
    console.log('\x1b[32m✓ Database setup completed\x1b[0m');

    // Step 8: Build the application
    console.log('\n🏗️ Building the application...');
    try {
      await execAsync('npm run build');
      console.log('\x1b[32m✓ Application built successfully\x1b[0m');
    } catch (error) {
      console.error('\x1b[31m❌ Build failed:', error.message, '\x1b[0m');
      return false;
    }

    console.log('\n\x1b[32m=== Deployment Complete! ===\x1b[0m');
    console.log('\nYou can now:');
    console.log('1. Start the application in development mode: npm run dev');
    console.log('2. Build and start in production mode: npm run build && npm start');
    console.log(`\nAccess the application at: http://localhost:${port || 5000}\n`);

    this.rl.close();
    return true;
  }
}

// Run the wizard
const wizard = new DeploymentWizard();
wizard.run().then(success => process.exit(success ? 0 : 1));