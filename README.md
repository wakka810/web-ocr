# Gemini OCR Web Tool

A responsive web application that enables users to extract text from images using Google's Gemini 2.5 Flash model. The application focuses on region-based OCR processing, allowing users to select multiple specific areas within an image for text extraction.

## Features

- 📸 Image upload with drag-and-drop support
- 🎯 Region-based text extraction
- 📱 Responsive design for desktop and mobile
- 🔄 Automatic retry with exponential backoff
- 📋 Copy-to-clipboard functionality
- 🌐 Cross-platform compatibility (Windows/Linux)

## Prerequisites

- Node.js 18+ and npm
- Google Gemini API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd web-ocr
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your Gemini API key
```

## Development

### Frontend Development

```bash
cd frontend
npm run dev
```

The frontend will be available at http://localhost:3000

### Backend Development

```bash
cd backend
npm run dev
```

The backend API will run on http://localhost:5000

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm test` - Run tests

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm test` - Run tests

## Project Structure

```
web-ocr/
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Utility functions
│   └── package.json
├── backend/               # Node.js backend API
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── package.json
└── .kiro/                 # Project specifications
    └── specs/
        └── gemini-ocr-web-tool/
            ├── requirements.md
            ├── design.md
            └── tasks.md
```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/upload` - Upload image file
- `POST /api/ocr/process` - Process OCR for selected regions
- `GET /api/ocr/status/:sessionId` - Get processing status

## License

Private project