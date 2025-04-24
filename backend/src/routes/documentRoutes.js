"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const middleware_1 = require("../middleware/middleware");
const documentController_1 = require("../controllers/documentController");
const router = express_1.default.Router();
// Route for document upload only (no processing)
router.post('/upload', middleware_1.upload.single('document'), middleware_1.handleUploadErrors, documentController_1.uploadDocument);
// Route for processing a previously uploaded document
router.get('/process/:fileId', documentController_1.processDocument);
// Route for verifying and saving application data
router.post('/verify', documentController_1.verifyApplication);
exports.default = router;
