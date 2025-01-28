# Document Review Word Add-in

A Microsoft Word add-in that helps you review and annotate documents with color-coded flags.

## Quick Installation Guide

### Step 1: Download
1. Download the latest `document-review-word-addin.zip` from the Releases page
2. Extract the zip file to any folder on your computer

### Step 2: Install
1. Open Command Prompt (Windows) or Terminal (Mac)
2. Navigate to the extracted folder:
   ```
   cd path/to/extracted/folder
   ```
3. Run the installer:
   - Windows: Double-click `install.bat`
   - Mac/Linux: Type `node scripts/deployment-wizard.js`
4. Follow the prompts:
   - The wizard will check if you have Node.js installed
   - Enter database details when asked
   - Accept the default port (5000) or choose another if it's in use

### Step 3: Add to Word
1. Open Microsoft Word
2. Click the **Insert** tab
3. Click **Office Add-ins**
4. Select **My Add-ins** from the dropdown
5. Look for "Document Review Add-in" and click **Add**

## Using the Add-in

1. Open any document in Word
2. In the Review tab, click "Document Review" to open the add-in panel
3. Select text in your document
4. Click "Get Selected Text" in the add-in panel
5. Choose a flag color (Yellow, Green, or Red)
6. The selected text will be highlighted in your chosen color

## Troubleshooting

### Add-in Not Appearing?
1. Check that the installation completed successfully
2. Make sure Word is fully closed and reopened after installation
3. Try running the server manually:
   ```
   npm run dev
   ```

### Installation Errors?
1. Make sure Node.js 18 or higher is installed
   - Download from: https://nodejs.org
2. Check that Microsoft Word is installed
3. Try running the installer again

### Still Having Issues?
- Check the detailed installation guide in `INSTALL.md`
- Submit an issue on GitHub

### Common Issues
1. **Database Connection Issues**:
   - Verify PostgreSQL is running
   - Check DATABASE_URL environment variable format:
     ```
     postgresql://username:password@hostname:5432/database_name
     ```
   - Ensure database user has proper permissions
   - Test connection using psql command line tool
   - Common error: "password authentication failed" - verify credentials
   - Common error: "database does not exist" - create database first

2. **Port Already in Use**:
   - The wizard will automatically detect if the default port (5000) is in use
   - You can specify a different port during installation
   - To check what's using port 5000:
     - Windows: `netstat -ano | findstr :5000`
     - Linux/Mac: `lsof -i :5000`
   - Stop the conflicting process or choose another port

3. **Installation Wizard Errors**:
   - If the wizard fails, check the error messages displayed
   - Verify that Node.js is installed correctly:
     ```bash
     node --version  # Should be 18.x or higher
     ```
   - Ensure you have proper permissions to write to the installation directory
   - Check your database credentials with psql before running the wizard
   - If seeing "command not found", ensure you're in the correct directory

4. **Build Errors**:
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Verify Node.js version: `node --version`
   - Check for TypeScript errors: `npm run check`
   - Common error: "Cannot find module" - Clear npm cache:
     ```bash
     npm cache clean --force
     npm install
     ```
   - For "out of memory" errors, increase Node.js memory limit:
     ```bash
     export NODE_OPTIONS=--max-old-space-size=4096  # Linux/Mac
     set NODE_OPTIONS=--max-old-space-size=4096     # Windows
     ```

### Verification Steps
After installation, verify:
1. Database connection is working
2. Application starts without errors
3. Can access the web interface
4. Can perform basic operations (create/view documents)
5. Export functionality works for all formats

## License

This project is licensed under the MIT License - see the LICENSE file for details.