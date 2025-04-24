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
exports.verifyApplication = exports.processDocument = exports.uploadDocument = void 0;
const middleware_1 = require("../middleware/middleware");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const tesseract_js_1 = require("tesseract.js");
const child_process_1 = require("child_process");
const util_1 = require("util");
// Convert exec to promise-based
const execPromise = (0, util_1.promisify)(child_process_1.exec);
// Store uploaded files info for later processing
const uploadedFiles = new Map();
// Check if ImageMagick is installed
const checkImageMagickInstalled = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield execPromise('magick --version');
        return true;
    }
    catch (error) {
        console.log('ImageMagick not found. PDF conversion may not work properly.');
        return false;
    }
});
// Convert PDF to images using ImageMagick
const convertPdfToImages = (pdfPath) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Converting PDF to images using ImageMagick: ${pdfPath}`);
    try {
        const outputDir = path_1.default.join(path_1.default.dirname(pdfPath), 'images');
        if (!fs_1.default.existsSync(outputDir)) {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        const baseFilename = path_1.default.basename(pdfPath, '.pdf');
        const outputPattern = path_1.default.join(outputDir, `${baseFilename}-%d.jpg`);
        // Execute ImageMagick command to convert PDF to images
        yield execPromise(`magick convert -density 300 "${pdfPath}" -quality 100 "${outputPattern}"`);
        // Get the list of created image files
        const files = fs_1.default.readdirSync(outputDir);
        const imagePaths = files
            .filter(file => file.startsWith(baseFilename) && file.endsWith('.jpg'))
            .map(file => path_1.default.join(outputDir, file));
        console.log(`Converted PDF to ${imagePaths.length} images`);
        return imagePaths;
    }
    catch (error) {
        console.error('Error converting PDF to images:', error);
        throw new Error(`Failed to convert PDF to images: ${error.message}`);
    }
});
// Process OCR on multiple images and combine results
const processMultipleImages = (imagePaths) => __awaiter(void 0, void 0, void 0, function* () {
    if (!imagePaths || imagePaths.length === 0) {
        return { text: '', confidence: 0 };
    }
    const worker = yield (0, tesseract_js_1.createWorker)('eng');
    try {
        let combinedText = '';
        let confidenceSum = 0;
        for (const imagePath of imagePaths) {
            console.log(`Processing OCR for image: ${imagePath}`);
            const { data } = yield worker.recognize(imagePath);
            combinedText += data.text + '\n\n';
            confidenceSum += data.confidence;
            // Clean up the temporary image
            try {
                yield fs_1.default.promises.unlink(imagePath);
            }
            catch (err) {
                console.error(`Failed to delete temporary image ${imagePath}:`, err);
            }
        }
        // Calculate average confidence
        const averageConfidence = imagePaths.length > 0 ? confidenceSum / imagePaths.length : 0;
        return {
            text: combinedText,
            confidence: averageConfidence
        };
    }
    finally {
        yield worker.terminate();
        // Only try to clean up if there are image paths
        if (imagePaths && imagePaths.length > 0) {
            // Clean up the images directory if it exists
            try {
                const imagesDir = path_1.default.dirname(imagePaths[0]);
                if (fs_1.default.existsSync(imagesDir)) {
                    const files = fs_1.default.readdirSync(imagesDir);
                    if (files.length === 0) {
                        fs_1.default.rmdirSync(imagesDir);
                    }
                }
            }
            catch (err) {
                console.error('Error cleaning up image directory:', err);
            }
        }
    }
});
// Process OCR using Tesseract.js
const processOCR = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Processing OCR for file: ${filePath}`);
    let text = '';
    let confidence = 0;
    // Check if the file is a PDF
    if (path_1.default.extname(filePath).toLowerCase() === '.pdf') {
        try {
            // Check if ImageMagick is installed
            const isMagickInstalled = yield checkImageMagickInstalled();
            if (isMagickInstalled) {
                // Convert PDF to images using ImageMagick
                const imagePaths = yield convertPdfToImages(filePath);
                // Process OCR on the converted images
                const result = yield processMultipleImages(imagePaths);
                text = result.text;
                confidence = result.confidence;
            }
            else {
                // Fallback: Try to extract text with a basic approach (warning: this will likely fail)
                console.log('ImageMagick not available. PDF processing may fail.');
                // Attempt direct processing (will likely fail, but provides a clear error)
                const worker = yield (0, tesseract_js_1.createWorker)('eng');
                try {
                    const { data } = yield worker.recognize(filePath);
                    text = data.text;
                    confidence = data.confidence;
                }
                catch (error) {
                    console.error('Failed to process PDF directly:', error);
                    text = 'PDF processing failed. Please install ImageMagick for PDF support or upload images instead.';
                    confidence = 0;
                }
                finally {
                    yield worker.terminate();
                }
            }
        }
        catch (error) {
            console.error('Error processing PDF:', error);
            text = `Error processing PDF: ${error.message}`;
            confidence = 0;
        }
    }
    else {
        // For image files, process directly with Tesseract
        const worker = yield (0, tesseract_js_1.createWorker)('eng');
        try {
            const { data } = yield worker.recognize(filePath);
            text = data.text;
            confidence = data.confidence;
        }
        catch (error) {
            console.error('Error processing image:', error);
            text = `Error processing image: ${error.message}`;
            confidence = 0;
        }
        finally {
            yield worker.terminate();
        }
    }
    console.log("OCR Completed with text length:", text.length);
    console.log("OCR Confidence:", confidence);
    // Extract data from the text based on patterns
    const extractedData = extractDataFromText(text);
    // Add OCR confidence and raw text
    extractedData.ocrData = {
        raw: text,
        confidence: confidence
    };
    return extractedData;
});
// Function to extract structured data from OCR text
const extractDataFromText = (text) => {
    // Initialize the structured data object
    const data = {
        applicant_name: "",
        address: {
            street: "",
            city: "",
            state: "",
            zipCode: ""
        },
        incomeDetails: {
            monthlyIncome: 0,
            employerName: "",
            employmentDuration: 0
        },
        loanAmount: 0
    };
    // Extract applicant name using regex patterns
    const nameMatch = text.match(/Name:?\s*([A-Za-z\s]+)/i) ||
        text.match(/Applicant:?\s*([A-Za-z\s]+)/i);
    if (nameMatch && nameMatch[1]) {
        data.applicant_name = nameMatch[1].trim();
    }
    // Extract address components
    // Street address
    const streetMatch = text.match(/Address:?\s*([A-Za-z0-9\s,.]+)/i) ||
        text.match(/Street:?\s*([A-Za-z0-9\s,.]+)/i);
    if (streetMatch && streetMatch[1]) {
        data.address.street = streetMatch[1].trim();
    }
    // City
    const cityMatch = text.match(/City:?\s*([A-Za-z\s]+)/i);
    if (cityMatch && cityMatch[1]) {
        data.address.city = cityMatch[1].trim();
    }
    // State
    const stateMatch = text.match(/State:?\s*([A-Za-z\s]{2,})/i);
    if (stateMatch && stateMatch[1]) {
        data.address.state = stateMatch[1].trim();
    }
    // ZIP Code
    const zipMatch = text.match(/ZIP:?\s*(\d{5}(?:-\d{4})?)/i) ||
        text.match(/Zip\s*Code:?\s*(\d{5}(?:-\d{4})?)/i);
    if (zipMatch && zipMatch[1]) {
        data.address.zipCode = zipMatch[1].trim();
    }
    // Extract income details
    // Monthly income
    const incomeMatch = text.match(/Monthly\s*Income:?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i) ||
        text.match(/Income:?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i);
    if (incomeMatch && incomeMatch[1]) {
        data.incomeDetails.monthlyIncome = parseFloat(incomeMatch[1].replace(/,/g, ''));
    }
    // Employer name
    const employerMatch = text.match(/Employer:?\s*([A-Za-z0-9\s,.]+)/i) ||
        text.match(/Company:?\s*([A-Za-z0-9\s,.]+)/i);
    if (employerMatch && employerMatch[1]) {
        data.incomeDetails.employerName = employerMatch[1].trim();
    }
    // Employment duration
    const durationMatch = text.match(/Employment\s*Duration:?\s*(\d+)/i) ||
        text.match(/(\d+)\s*(?:months|month)/i);
    if (durationMatch && durationMatch[1]) {
        data.incomeDetails.employmentDuration = parseInt(durationMatch[1]);
    }
    // Extract loan amount
    const loanMatch = text.match(/Loan\s*Amount:?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i);
    if (loanMatch && loanMatch[1]) {
        data.loanAmount = parseFloat(loanMatch[1].replace(/,/g, ''));
    }
    return data;
};
// Upload document without processing
const uploadDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const uploadedFile = req.file;
        console.log(`File uploaded: ${uploadedFile.filename}`);
        // Store the uploaded file info for later processing
        const fileId = uploadedFile.filename;
        uploadedFiles.set(fileId, {
            path: uploadedFile.path,
            originalname: uploadedFile.originalname,
            uploadDate: new Date()
        });
        // Return success with file ID
        res.status(200).json({
            message: 'Document uploaded successfully',
            fileId: fileId,
            documents: [{
                    documentType: 'application',
                    filePath: fileId,
                    uploadDate: new Date()
                }]
        });
    }
    catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({
            error: 'Error uploading document',
            message: error.message
        });
    }
});
exports.uploadDocument = uploadDocument;
// Process document with OCR
const processDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const fileId = req.params.fileId;
    try {
        // Get file info
        const fileInfo = uploadedFiles.get(fileId);
        if (!fileInfo) {
            res.status(404).json({ error: 'File not found or already processed' });
            return;
        }
        const filePath = fileInfo.path;
        // Check if file exists
        if (!fs_1.default.existsSync(filePath)) {
            uploadedFiles.delete(fileId);
            res.status(404).json({ error: 'File not found on server' });
            return;
        }
        // Process the document with OCR
        const extractedData = yield processOCR(filePath);
        // After successful processing, clear the temporary file
        yield (0, middleware_1.clearTempFiles)(filePath);
        // Remove from the map
        uploadedFiles.delete(fileId);
        // Return the extracted data
        res.status(200).json(Object.assign(Object.assign({ message: 'Document processed successfully' }, extractedData), { processingStatus: 'completed', documents: [{
                    documentType: 'application',
                    filePath: fileId,
                    uploadDate: fileInfo.uploadDate
                }] }));
    }
    catch (error) {
        console.error('Error processing document:', error);
        res.status(500).json({
            error: 'Error processing document',
            message: error.message
        });
    }
});
exports.processDocument = processDocument;
const verifyApplication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const verifiedData = req.body;
        console.log('Received verified data:', verifiedData);
        // Here you would typically save this data to your database
        // For demo purposes, we're just acknowledging receipt
        res.status(200).json({
            message: 'Application verified successfully',
            applicationId: `APP-${Date.now()}`,
            status: 'submitted'
        });
    }
    catch (error) {
        console.error('Error verifying application:', error);
        res.status(500).json({
            error: 'Error verifying application',
            message: error.message
        });
    }
});
exports.verifyApplication = verifyApplication;
