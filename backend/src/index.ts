import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import uploadRoutes from './routes/upload';
import ocrRoutes from './routes/ocr';
import { getUploadDir, ensureDir } from './utils/pathUtils';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize upload directory
const initializeServer = async () => {
  try {
    await ensureDir(getUploadDir());
  } catch (error) {
    console.error('Failed to create upload directory:', error);
    process.exit(1);
  }
};

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(getUploadDir()));

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/ocr', ocrRoutes);

// Health check endpoint
app.get('/api/health', (_, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Start server
initializeServer().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Upload directory: ${getUploadDir()}`);
  });
});