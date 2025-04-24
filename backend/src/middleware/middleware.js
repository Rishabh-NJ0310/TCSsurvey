"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUploadErrors = exports.clearTempFiles = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Create uploads directory if it doesn't exist
const uploadDir = path_1.default.join(__dirname, '../../uploads/temp');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Configure storage
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename with timestamp and original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path_1.default.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
    }
});
// File filter to only allow certain file types
const fileFilter = (req, file, cb) => {
    // Accept pdf and image files (jpg, jpeg, png)
    if (file.mimetype === 'application/pdf' ||
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/png') {
        cb(null, true);
    }
    else {
        // Reject file
        cb(new Error('Unsupported file format. Only PDF, JPG, JPEG, and PNG files are allowed.'));
    }
};
// Create multer instance with configuration
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB file size limit
    }
});
// Helper function to clear temporary files after processing
const clearTempFiles = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (fs_1.default.existsSync(filePath)) {
            yield fs_1.default.promises.unlink(filePath);
            console.log(`Temporary file deleted: ${filePath}`);
        }
    }
    catch (error) {
        console.error('Error deleting temporary file:', error);
    }
});
exports.clearTempFiles = clearTempFiles;
// Middleware to handle file upload errors
const handleUploadErrors = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size exceeds the 10MB limit.' });
        }
        return res.status(400).json({ error: err.message });
    }
    else if (err) {
        // An unknown error occurred
        return res.status(400).json({ error: err.message });
    }
    // No errors, continue
    next();
};
exports.handleUploadErrors = handleUploadErrors;
