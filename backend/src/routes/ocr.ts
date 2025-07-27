import { Router } from 'express';
import { processOCR, getOCRStatus } from '../controllers/ocrController';

const router = Router();

// POST /api/ocr/process - Start OCR processing
router.post('/process', processOCR);

// GET /api/ocr/status/:sessionId - Get OCR processing status
router.get('/status/:sessionId', getOCRStatus);

export default router;