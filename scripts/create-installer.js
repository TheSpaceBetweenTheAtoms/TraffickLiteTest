import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

// Configuration
const config = {
  appName: 'Document Review Word Add-in',
  version: '1.0.0',
  bundleDir: 'dist',
  outputFile: 'document-review-word-addin.zip',
};

// Ensure dist directory exists
if (!fs.existsSync(config.bundleDir)) {
  fs.mkdirSync(config.bundleDir, { recursive: true });
}

// Files to include in the package
const filesToCopy = [
  'package.json',
  'README.md',
  'LICENSE',
  '.env.example',
  'scripts/deployment-wizard.js',
  'manifest.xml',
  'tsconfig.json',
  'vite.config.ts',
  'tailwind.config.ts',
  'postcss.config.js',
  'theme.json',
  'drizzle.config.ts',
  'db/schema.ts',
  'db/index.ts',
];

// Copy necessary files
function copyFiles() {
  console.log('\nCopying configuration files...');
  for (const file of filesToCopy) {
    if (fs.existsSync(file)) {
      const targetPath = path.join(config.bundleDir, file);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(file, targetPath);
      console.log(`✓ Copied ${file}`);
    } else {
      console.warn(`⚠ Warning: ${file} not found, skipping...`);
    }
  }
}

// Create installer script
function createInstaller() {
  const installerScript = `@echo off
echo Installing ${config.appName} ${config.version}...

REM Check for Node.js
node --version > nul 2>&1
if errorlevel 1 (
    echo Node.js is not installed. Please install Node.js 18 or higher.
    exit /b 1
)

REM Check for Microsoft Word
reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Office\\ClickToRun\\Configuration" /v "VersionToReport" > nul 2>&1
if errorlevel 1 (
    echo Microsoft Word is not installed.
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

  const installerPath = path.join(config.bundleDir, 'install.bat');
  fs.writeFileSync(installerPath, installerScript);
  console.log('✓ Created installer script');
}

// Create zip archive
function createZipArchive() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path.join(config.bundleDir, config.outputFile));
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    output.on('close', () => {
      console.log(`\n✓ Archive created successfully (${archive.pointer()} bytes)`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('⚠ Warning:', err.message);
      } else {
        reject(err);
      }
    });

    archive.pipe(output);

    // Add the built application files
    if (fs.existsSync(path.join(config.bundleDir, 'public'))) {
      archive.directory(path.join(config.bundleDir, 'public'), 'public');
      console.log('✓ Added frontend build files');
    }

    if (fs.existsSync(path.join(config.bundleDir, 'server'))) {
      archive.directory(path.join(config.bundleDir, 'server'), 'server');
      console.log('✓ Added backend build files');
    }

    // Add configuration files
    const filesToAdd = fs.readdirSync(config.bundleDir)
      .filter(file => !['public', 'server', config.outputFile].includes(file));

    filesToAdd.forEach(file => {
      const filePath = path.join(config.bundleDir, file);
      archive.file(filePath, { name: file });
      console.log(`✓ Added ${file} to archive`);
    });

    archive.finalize();
  });
}

// Verify the build output
function verifyBuildOutput() {
  const requiredFiles = [
    path.join(config.bundleDir, 'public', 'index.html'),
    path.join(config.bundleDir, 'server', 'index.js'),
  ];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  if (missingFiles.length > 0) {
    throw new Error(`Build verification failed. Missing files:\n${missingFiles.join('\n')}`);
  }
  console.log('✓ Build output verification passed');
}

// Build and package the application
async function createInstallationPackage() {
  try {
    console.log('Creating installation package...\n');

    // Build frontend
    console.log('Building frontend...');
    execSync('npm run build', { stdio: 'inherit' });

    // Bundle backend
    console.log('\nBuilding backend...');
    execSync('ncc build server/index.ts -o dist/server', { stdio: 'inherit' });

    // Verify build output
    verifyBuildOutput();

    // Copy configuration files
    copyFiles();

    // Create installer script
    console.log('\nCreating installer script...');
    createInstaller();

    // Create zip archive
    console.log('\nCreating installation package...');
    await createZipArchive();

    console.log(`\n✨ Installation package created successfully at: ${path.join(config.bundleDir, config.outputFile)}`);
    return true;
  } catch (error) {
    console.error('\n❌ Error creating installation package:', error.message);
    if (error.stdout) console.error(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
    return false;
  }
}

// Run the packaging process
createInstallationPackage().then(success => process.exit(success ? 0 : 1));