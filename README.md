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

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **Document Processing**: 
  - `docx` for Word document generation
  - `csv-parse/stringify` for CSV handling
  - `pdfkit` for PDF generation

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the database:
   ```bash
   npm run db:push
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

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

## Development

### Project Structure

```
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utility functions
│   │   └── pages/      # Page components
├── db/                  # Database schema and configuration
├── server/             # Express.js backend
└── migrations/         # Database migrations
```

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run db:push`: Update database schema
- `npm run check`: Type-check TypeScript files

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
