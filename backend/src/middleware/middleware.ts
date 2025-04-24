    import multer from 'multer';
    import path from 'path';
    import fs from 'fs';
    import { Request } from 'express';

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Configure storage
    const storage = multer.diskStorage({
    destination: function (req: Request, file: Express.Multer.File, cb) {
        cb(null, uploadDir);
    },
    filename: function (req: Request, file: Express.Multer.File, cb) {
        // Create unique filename with timestamp and original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
    }
    });

    // File filter to only allow certain file types
    const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept pdf and image files (jpg, jpeg, png)
    if (
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/png'
    ) {
        cb(null, true);
    } else {
        // Reject file
        cb(new Error('Unsupported file format. Only PDF, JPG, JPEG, and PNG files are allowed.'));
    }
    };

    // Create multer instance with configuration
    export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB file size limit
    }
    });

    // Helper function to clear temporary files after processing
    export const clearTempFiles = async (filePath: string) => {
    try {
        if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`Temporary file deleted: ${filePath}`);
        }
    } catch (error) {
        console.error('Error deleting temporary file:', error);
    }
    };

    // Middleware to handle file upload errors
    export const handleUploadErrors = (err: any, req: Request, res: any, next: any) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds the 10MB limit.' });
        }
        return res.status(400).json({ error: err.message });
    } else if (err) {
        // An unknown error occurred
        return res.status(400).json({ error: err.message });
    }
    
    // No errors, continue
    next();
    };