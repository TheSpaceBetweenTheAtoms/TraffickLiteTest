import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const config = {
  appName: 'Document Review App',
  version: '1.0.0',
  bundleDir: 'dist',
  outputFile: 'document-review-app-installer.exe',
};

// Ensure dist directory exists
if (!fs.existsSync(config.bundleDir)) {
  fs.mkdirSync(config.bundleDir, { recursive: true });
}

// Copy necessary files
function copyFiles() {
  const filesToCopy = [
    'package.json',
    'README.md',
    'LICENSE',
    '.env.example',
    'scripts/deployment-wizard.js'
  ];

  for (const file of filesToCopy) {
    if (fs.existsSync(file)) {
      const targetPath = path.join(config.bundleDir, file);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(file, targetPath);
    }
  }
}

// Create installer script
function createInstaller() {
  const installerScript = `
@echo off
echo Installing ${config.appName} ${config.version}...

REM Check for Node.js
node --version > nul 2>&1
if errorlevel 1 (
    echo Node.js is not installed. Please install Node.js 18 or higher.
    exit /b 1
)

REM Run the deployment wizard
node scripts/deployment-wizard.js
if errorlevel 1 (
    echo Installation failed. Please check the error messages above.
    exit /b 1
)

echo Installation complete!
pause
  `;

  fs.writeFileSync(path.join(config.bundleDir, 'install.bat'), installerScript);
}

// Bundle the application
console.log('Creating installation package...');

try {
  // Build frontend
  console.log('Building frontend...');
  execSync('npm run build');

  // Bundle backend with dependencies
  console.log('Building backend...');
  execSync('ncc build server/index.ts -o dist/server');

  // Copy necessary files
  console.log('Copying files...');
  copyFiles();

  // Create installer script
  console.log('Creating installer script...');
  createInstaller();

  console.log(`Installation package created successfully at: ${path.join(config.bundleDir, 'install.bat')}`);
} catch (error) {
  console.error('Error creating installation package:', error);
  process.exit(1);
}