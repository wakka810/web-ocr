import { Router } from 'express';
import { uploadImage, uploadErrorHandler } from '../controllers/uploadController';

const router = Router();

// POST /api/upload - Upload an image
router.post('/', uploadImage, uploadErrorHandler);

export default router;