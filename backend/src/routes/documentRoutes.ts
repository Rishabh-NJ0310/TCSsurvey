import express from 'express';
import { upload, handleUploadErrors } from '../middleware/middleware';
import {verifyApplication, uploadDocument, processDocument} from '../controllers/documentController';

const router = express.Router();

// Route for document upload only (no processing)
router.post('/upload', upload.single('document'), handleUploadErrors, uploadDocument);

// Route for processing a previously uploaded document
router.get('/process/:fileId', processDocument);

// Route for verifying and saving application data
router.post('/verify', verifyApplication);

export default router;