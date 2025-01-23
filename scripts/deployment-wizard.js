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

  async run() {
    console.log('\x1b[32m=== Document Review App Deployment Wizard ===\x1b[0m\n');
    
    // Step 1: Check Node.js version
    console.log('📋 Checking system requirements...');
    if (!await this.verifyNodeVersion()) {
      console.error('\x1b[31m❌ Node.js 18 or higher is required.\x1b[0m');
      return false;
    }
    console.log('\x1b[32m✓ Node.js version check passed\x1b[0m');

    // Step 2: Database Configuration
    console.log('\n📦 Database Configuration');
    const dbUrl = await this.askQuestion(
      'Enter your PostgreSQL database URL (format: postgresql://user:password@host:port/database):'
    );
    
    if (!await this.checkDatabaseConnection(dbUrl)) {
      console.error('\x1b[31m❌ Invalid database URL format\x1b[0m');
      return false;
    }
    console.log('\x1b[32m✓ Database URL format validated\x1b[0m');

    // Step 3: Port Configuration
    console.log('\n🔌 Port Configuration');
    const port = await this.askQuestion('Enter the port to run the application (default: 5000):');
    const portNumber = parseInt(port) || 5000;
    
    if (!await this.checkPort(portNumber)) {
      console.error(`\x1b[31m❌ Port ${portNumber} is already in use\x1b[0m`);
      return false;
    }
    console.log('\x1b[32m✓ Port availability confirmed\x1b[0m');

    // Step 4: Create environment file
    console.log('\n📝 Creating environment configuration...');
    try {
      await fs.writeFile('.env', `DATABASE_URL=${dbUrl}\nPORT=${portNumber}\n`);
      console.log('\x1b[32m✓ Environment configuration created\x1b[0m');
    } catch (error) {
      console.error('\x1b[31m❌ Failed to create environment configuration\x1b[0m');
      return false;
    }

    // Step 5: Install dependencies
    console.log('\n📦 Installing dependencies...');
    try {
      await execAsync('npm install');
      console.log('\x1b[32m✓ Dependencies installed\x1b[0m');
    } catch (error) {
      console.error('\x1b[31m❌ Failed to install dependencies\x1b[0m');
      return false;
    }

    // Step 6: Run database migrations
    console.log('\n🔄 Setting up database...');
    try {
      await execAsync('npm run db:push');
      console.log('\x1b[32m✓ Database setup completed\x1b[0m');
    } catch (error) {
      console.error('\x1b[31m❌ Failed to set up database\x1b[0m');
      return false;
    }

    console.log('\n\x1b[32m=== Deployment Complete! ===\x1b[0m');
    console.log('\nYou can now:');
    console.log('1. Start the application in development mode: npm run dev');
    console.log('2. Build and start in production mode: npm run build && npm start');
    console.log(`\nAccess the application at: http://localhost:${portNumber}\n`);

    this.rl.close();
    return true;
  }
}

// Run the wizard
const wizard = new DeploymentWizard();
wizard.run().then(() => process.exit());
