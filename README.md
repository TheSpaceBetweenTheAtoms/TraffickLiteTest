# Document Review Application

A professional-grade web-based document review application designed to enhance text analysis and collaboration through advanced annotation capabilities. This application provides a comprehensive document management system with intelligent text flagging, filtering, and export functionality.

## Features

- 📝 **Document Viewer**: Clean and responsive interface for document viewing
- 🚩 **Text Flagging**: Select and flag text with different colors (red, yellow, green)
- 🔍 **Filtering**: Filter flags by color and sort by newest, oldest, or text content
- 📤 **Export Options**: Export flagged content in multiple formats:
  - CSV for data analysis
  - PDF for sharing and printing
  - Word (DOCX) for further editing
- 📥 **Import Support**: Import flags from CSV files
- 🎨 **Visual Highlighting**: Clear visual indicators for flagged text with color coding
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Quick Installation (Windows)

1. Download the latest release `document-review-app-installer.exe` from the releases page
2. Run the installer and follow the setup wizard
3. Launch the application from the Start Menu or Desktop shortcut
4. Access the application at `http://localhost:5000` in your web browser

## Manual Installation

### Prerequisites

1. Node.js 18 or higher
2. PostgreSQL database
3. Git

### Step-by-Step Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd document-review-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with:
   ```
   DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
   ```

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Access the application:
   Open `http://localhost:5000` in your browser

### Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Creating Installation Package

To create an installation package for distribution:

1. Install the packaging dependencies:
   ```bash
   npm install -g @vercel/ncc pkg
   ```

2. Bundle the application:
   ```bash
   # Bundle frontend
   npm run build

   # Bundle backend
   ncc build server/index.ts -o dist/server
   ```

3. Create executable:
   ```bash
   pkg . --targets node18-win-x64 --output document-review-app.exe
   ```

4. Package with dependencies:
   ```bash
   # Run the packaging script
   node scripts/create-installer.js
   ```

The installer will be created in the `dist` directory as `document-review-app-installer.exe`

## Usage Guide

### Flagging Text

1. Select any text in the document viewer
2. Use the floating toolbar to flag the text:
   - 🔴 Red for critical issues
   - 🟡 Yellow for warnings or concerns
   - 🟢 Green for positive notes or approved sections

### Managing Flags

- **Filter Flags**: Use the filter button to show/hide flags by color
- **Sort Flags**: Sort flags by newest, oldest, or text content
- **Delete Flags**: Remove individual flags or use "Clear All" to remove all flags
- **Export Flags**: Export your flags in CSV, PDF, or DOCX format
- **Import Flags**: Import previously exported flags from CSV files

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Verify PostgreSQL is running
   - Check DATABASE_URL environment variable
   - Ensure database user has proper permissions

2. **Build Errors**:
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Verify Node.js version: `node --version`
   - Check for TypeScript errors: `npm run check`

## License

This project is licensed under the MIT License - see the LICENSE file for details.