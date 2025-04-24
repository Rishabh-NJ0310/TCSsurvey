    const mongoose = require('mongoose');

    const LoanApplicationSchema = new mongoose.Schema({
    // Applicant Information
    applicantName: {
        type: String,
        required: true,
        trim: true
    },
    
    // Contact Information
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true }
    },
    
    // Income Details
    incomeDetails: {
        monthlyIncome: { type: Number, required: true },
        employerName: { type: String, required: true },
        employmentDuration: { type: Number, required: true } // in months
    },
    
    // Loan Information
    loanAmount: {
        type: Number,
        required: true
    },
    
    // Document References
    documents: [{
        documentType: { type: String, required: true }, // ID proof, income statement, etc.
        filePath: { type: String, required: true },
        uploadDate: { type: Date, default: Date.now }
    }],
    
    // OCR Processing Status
    processingStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'error'],
        default: 'pending'
    },
    
    ocrData: {
        raw: { type: String }, // Raw extracted OCR text
        confidence: { type: Number } // OCR confidence score
    },
    
    // Application Status
    status: {
        type: String,
        enum: ['draft', 'submitted', 'under-review', 'approved', 'rejected'],
        default: 'draft'
    },
    
    submissionDate: {
        type: Date,
        default: Date.now
    },

    isManuallyVerified: {
        type: Boolean,
        default: false
    }
    }, { timestamps: true });

    module.exports = mongoose.model('LoanApplication', LoanApplicationSchema);