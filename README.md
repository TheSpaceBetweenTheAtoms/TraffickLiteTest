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

## Quick Installation

1. Download the latest release package from the releases page
2. Extract the downloaded package to your desired location
3. Run the `install.bat` file
4. Follow the deployment wizard prompts:
   - The wizard will check for Node.js installation
   - Enter your PostgreSQL database connection details
   - Choose a port for the application (default: 5000)
   - The wizard will automatically:
     - Set up environment variables
     - Install dependencies
     - Initialize the database
     - Prepare the application for first use
5. Once installation is complete, you can:
   - Start the development server: `npm run dev`
   - Build and start in production: `npm run build && npm start`
   - Access the application at: `http://localhost:<your-chosen-port>`

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

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Verify PostgreSQL is running
   - Check DATABASE_URL environment variable
   - Ensure database user has proper permissions

2. **Port Already in Use**:
   - The wizard will automatically detect if the default port (5000) is in use
   - You can specify a different port during installation
   - Alternatively, check and stop any processes using port 5000

3. **Installation Wizard Errors**:
   - If the wizard fails, check the error messages displayed
   - Verify that Node.js is installed correctly
   - Ensure you have proper permissions to write to the installation directory
   - Check your database credentials

4. **Build Errors**:
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Verify Node.js version: `node --version`
   - Check for TypeScript errors: `npm run check`

## License

This project is licensed under the MIT License - see the LICENSE file for details.