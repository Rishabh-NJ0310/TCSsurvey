const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const LoanApplication = require('./schema');
const ocrService = require('./ocrService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
destination: function (req, file, cb) {
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
},
filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
}
});

const upload = multer({ storage });

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/loan-ocr-app', {
useNewUrlParser: true,
useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
// Create a new loan application
app.post('/api/applications', async (req, res) => {
try {
    const newApplication = new LoanApplication(req.body);
    await newApplication.save();
    res.status(201).json(newApplication);
} catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ message: 'Could not create application', error: error.message });
}
});

// Get all applications
app.get('/api/applications', async (req, res) => {
try {
    const applications = await LoanApplication.find().sort({ createdAt: -1 });
    res.json(applications);
} catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Could not fetch applications', error: error.message });
}
});

// Get application by ID
app.get('/api/applications/:id', async (req, res) => {
try {
    const application = await LoanApplication.findById(req.params.id);
    if (!application) {
    return res.status(404).json({ message: 'Application not found' });
    }
    res.json(application);
} catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ message: 'Could not fetch application', error: error.message });
}
});

// Update application
app.put('/api/applications/:id', async (req, res) => {
try {
    const updatedApplication = await LoanApplication.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
    );
    
    if (!updatedApplication) {
    return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json(updatedApplication);
} catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ message: 'Could not update application', error: error.message });
}
});

// Upload document for OCR processing
app.post('/api/applications/:id/documents', upload.single('document'), async (req, res) => {
try {
    if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
    }

    const { id } = req.params;
    const documentType = req.body.documentType;
    const application = await LoanApplication.findById(id);
    
    if (!application) {
    return res.status(404).json({ message: 'Application not found' });
    }

    // Add document to application
    const filePath = req.file.path;
    application.documents.push({
    documentType,
    filePath,
    uploadDate: new Date()
    });
    
    await application.save();
    
    // Process document with OCR (asynchronously)
    ocrService.processDocument(id, filePath, documentType)
    .then(extractedData => {
        console.log('Document processed successfully:', extractedData);
    })
    .catch(error => {
        console.error('Error processing document:', error);
    });
    
    res.status(200).json({ 
    message: 'Document uploaded and queued for processing',
    documentId: application.documents[application.documents.length - 1]._id
    });
} catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Could not upload document', error: error.message });
}
});

// Manually verify and update extracted data
app.post('/api/applications/:id/verify', async (req, res) => {
try {
    const { id } = req.params;
    const verifiedData = req.body;
    
    const application = await LoanApplication.findById(id);
    if (!application) {
    return res.status(404).json({ message: 'Application not found' });
    }
    
    // Update with verified data
    const updatedApplication = await LoanApplication.findByIdAndUpdate(
    id,
    {
        ...verifiedData,
        isManuallyVerified: true,
        status: 'submitted'
    },
    { new: true }
    );
    
    res.json(updatedApplication);
} catch (error) {
    console.error('Error verifying application:', error);
    res.status(500).json({ message: 'Could not verify application', error: error.message });
}
});

// Submit application for review
app.post('/api/applications/:id/submit', async (req, res) => {
try {
    const { id } = req.params;
    
    const application = await LoanApplication.findById(id);
    if (!application) {
    return res.status(404).json({ message: 'Application not found' });
    }
    
    // Check if application has been verified
    if (!application.isManuallyVerified) {
    return res.status(400).json({ message: 'Application must be manually verified before submission' });
    }
    
    // Update application status
    application.status = 'under-review';
    application.submissionDate = new Date();
    await application.save();
    
    res.json({ message: 'Application submitted for review', application });
} catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ message: 'Could not submit application', error: error.message });
}
});

// Delete application
app.delete('/api/applications/:id', async (req, res) => {
try {
    const result = await LoanApplication.findByIdAndDelete(req.params.id);
    
    if (!result) {
    return res.status(404).json({ message: 'Application not found' });
    }
    
    // Delete associated documents
    if (result.documents && result.documents.length > 0) {
    for (const doc of result.documents) {
        if (fs.existsSync(doc.filePath)) {
        fs.unlinkSync(doc.filePath);
        }
    }
    }
    
    res.json({ message: 'Application deleted successfully' });
} catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ message: 'Could not delete application', error: error.message });
}
});

// Start the server
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown - terminate OCR worker
process.on('SIGTERM', async () => {
console.log('SIGTERM received, shutting down gracefully');
await ocrService.terminate();
process.exit(0);
});