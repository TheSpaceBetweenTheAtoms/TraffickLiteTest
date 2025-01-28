import readline from 'readline/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import net from 'net';
import os from 'os';

const execAsync = promisify(exec);

class DeploymentWizard {
  constructor() {
    this.rl = null;
  }

  async initialize() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
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

  async cleanup() {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }

  async setupWordAddIn() {
    console.log('\n📎 Setting up Word Add-in...');
    try {
      const homedir = os.homedir();
      let addInFolder;

      if (process.platform === 'win32') {
        addInFolder = path.join(homedir, 'AppData', 'Local', 'Microsoft', 'Office', 'Word', 'WEF');
      } else if (process.platform === 'darwin') {
        addInFolder = path.join(homedir, 'Library', 'Containers', 'com.microsoft.Word', 'Data', 'Documents', 'wef');
      } else {
        console.log('\x1b[33m⚠ Your platform is not supported for Word Add-in installation\x1b[0m');
        return false;
      }

      await fs.mkdir(addInFolder, { recursive: true });

      await fs.copyFile(
        path.join(process.cwd(), 'manifest.xml'),
        path.join(addInFolder, 'document-review-addin.xml')
      );

      console.log('\x1b[32m✓ Word Add-in installed successfully\x1b[0m');
      return true;
    } catch (error) {
      console.error('\x1b[31m❌ Failed to setup Word Add-in:', error.message, '\x1b[0m');
      return false;
    }
  }

  async generateSelfSignedCert() {
    console.log('\n🔒 Generating SSL certificate for Add-in...');
    try {
      const certPath = path.join(process.cwd(), 'ssl');
      await fs.mkdir(certPath, { recursive: true });

      if (process.platform === 'win32') {
        await execAsync('powershell -Command "New-SelfSignedCertificate -DnsName localhost -CertStoreLocation cert:\\LocalMachine\\My"');
      } else {
        await execAsync(`openssl req -x509 -newkey rsa:2048 -keyout ${path.join(certPath, 'key.pem')} -out ${path.join(certPath, 'cert.pem')} -days 365 -nodes -subj "/CN=localhost"`);
      }

      console.log('\x1b[32m✓ SSL certificate generated\x1b[0m');
      return true;
    } catch (error) {
      console.error('\x1b[31m❌ Failed to generate SSL certificate:', error.message, '\x1b[0m');
      return false;
    }
  }

  async run() {
    try {
      console.log('\x1b[32m=== Document Review Word Add-in Deployment Wizard ===\x1b[0m\n');

      console.log('📋 Checking system requirements...');
      if (!await this.verifyNodeVersion()) {
        console.error('\x1b[31m❌ Node.js 18 or higher is required.\x1b[0m');
        console.log('Please install Node.js from: https://nodejs.org/');
        return false;
      }
      console.log('\x1b[32m✓ Node.js version check passed\x1b[0m');

      const currentDir = process.cwd();
      if (!await this.validatePath(currentDir)) {
        console.error('\x1b[31m❌ No write permission in the current directory\x1b[0m');
        return false;
      }
      console.log('\x1b[32m✓ Directory permissions verified\x1b[0m');


      if (!await this.setupNpmDependencies()) {
        return false;
      }
      console.log('\x1b[32m✓ Dependencies installed\x1b[0m');


      console.log('\n🏗️ Building the application...');
      try {
        await execAsync('npm run build');
        console.log('\x1b[32m✓ Application built successfully\x1b[0m');
      } catch (error) {
        console.error('\x1b[31m❌ Build failed:', error.message, '\x1b[0m');
        return false;
      }

      // Generate SSL certificate
      if (!await this.generateSelfSignedCert()) {
        return false;
      }

      // Setup Word Add-in
      if (!await this.setupWordAddIn()) {
        return false;
      }


      console.log('\n\x1b[32m=== Deployment Complete! ===\x1b[0m');
      console.log('\nTo use the Word Add-in:');
      console.log('1. Start the application server: npm run dev');
      console.log('2. Open Microsoft Word');
      console.log('3. Go to Insert > Office Add-ins > My Add-ins');
      console.log('4. Look for "Document Review Add-in" under Custom Add-ins');
      console.log('\nNote: You may need to trust the SSL certificate in your browser and Word.\n');

      return true;
    } catch (error) {
      console.error('\n\x1b[31m❌ An unexpected error occurred:', error.message, '\x1b[0m');
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

const wizard = new DeploymentWizard();
wizard.run().then(success => process.exit(success ? 0 : 1));