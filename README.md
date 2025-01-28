# Document Review Word Add-in

A Microsoft Word add-in that helps you review and annotate documents with color-coded flags.

## Quick Installation Guide

### Step 1: Download
1. Download the latest `document-review-word-addin.zip` from the Releases page
2. Extract the zip file to any folder on your computer

### Step 2: Install
1. First, install Node.js if you haven't already:
   - Download from: https://nodejs.org (version 18 or higher)
2. Open Command Prompt (Windows) or Terminal (Mac)
3. Navigate to the extracted folder:
   ```
   cd path/to/extracted/folder
   ```
4. Run the installer:
   - Windows: Double-click `install.bat`
   - Mac/Linux: Type `node scripts/deployment-wizard.js`

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
1. Make sure Word is fully closed and reopened after installation
2. Try running the server manually:
   ```
   npm run dev
   ```
3. Check that the installation completed successfully

### Installation Errors?
1. Make sure Node.js 18 or higher is installed
   - Download from: https://nodejs.org
2. Check that Microsoft Word is installed
3. Try running the installer again

### Still Having Issues?
- Submit an issue on GitHub with details about the problem

## License

This project is licensed under the MIT License - see the LICENSE file for details.