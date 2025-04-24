// services/ocrService.js
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const LoanApplication = require('./schema');

class OCRService {
constructor() {
    this.worker = Tesseract.createWorker();
}

async initWorker() {
    await this.worker.load();
    await this.worker.loadLanguage('eng');
    await this.worker.initialize('eng');
}

async extractTextFromImage(imagePath) {
    try {
    if (!this.worker) {
        await this.initWorker();
    }

    const { data } = await this.worker.recognize(imagePath);
    return {
        text: data.text,
        confidence: data.confidence
    };
    } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error('OCR processing failed');
    }
}

async processDocument(applicationId, documentPath, documentType) {
    try {
    // Update application status to processing
    await LoanApplication.findByIdAndUpdate(applicationId, {
        processingStatus: 'processing'
    });

    // Extract text from document
    const ocrResult = await this.extractTextFromImage(documentPath);
    
    // Parse the extracted text based on document type
    const extractedData = this.parseExtractedText(ocrResult.text, documentType);

    // Update the application with extracted data
    await LoanApplication.findByIdAndUpdate(applicationId, {
        ...extractedData,
        'ocrData.raw': ocrResult.text,
        'ocrData.confidence': ocrResult.confidence,
        processingStatus: 'completed'
    });

    return extractedData;
    } catch (error) {
    // Update application status to error
    await LoanApplication.findByIdAndUpdate(applicationId, {
        processingStatus: 'error'
    });
    
    console.error('Error processing document:', error);
    throw error;
    }
}

parseExtractedText(text, documentType) {
    // This is a simplified implementation of the parsing logic
    // In a real application, this would be much more sophisticated
    const extractedData = {};
    
    // Convert text to lowercase and remove extra whitespace for easier matching
    const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');
    
    if (documentType === 'id-proof') {
    // Extract name - simple pattern matching
    const nameMatch = normalizedText.match(/name[:\s]+([\w\s]+)/i);
    if (nameMatch && nameMatch[1]) {
        extractedData.applicantName = this.capitalizeWords(nameMatch[1].trim());
    }
    
    // Extract address - simple pattern matching
    const addressMatch = normalizedText.match(/address[:\s]+([\w\s,\.]+)/i);
    if (addressMatch && addressMatch[1]) {
        const addressParts = this.parseAddress(addressMatch[1].trim());
        extractedData.address = addressParts;
    }
    }
    
    if (documentType === 'income-statement') {
    // Extract income details
    const incomeMatch = normalizedText.match(/monthly income[:\s]+(\$?[\d,\.]+)/i) || 
                        normalizedText.match(/income[:\s]+(\$?[\d,\.]+)/i);
    
    if (incomeMatch && incomeMatch[1]) {
        const income = parseFloat(incomeMatch[1].replace(/[$,]/g, ''));
        extractedData['incomeDetails.monthlyIncome'] = income;
    }
    
    // Extract employer name
    const employerMatch = normalizedText.match(/employer[:\s]+([\w\s]+)/i);
    if (employerMatch && employerMatch[1]) {
        extractedData['incomeDetails.employerName'] = this.capitalizeWords(employerMatch[1].trim());
    }
    }
    
    if (documentType === 'loan-application') {
    // Extract loan amount
    const loanMatch = normalizedText.match(/loan amount[:\s]+(\$?[\d,\.]+)/i);
    if (loanMatch && loanMatch[1]) {
        const loanAmount = parseFloat(loanMatch[1].replace(/[$,]/g, ''));
        extractedData.loanAmount = loanAmount;
    }
    }
    
    return extractedData;
}

parseAddress(addressText) {
    // A simple address parser - in a real application, this would use more sophisticated techniques
    const addressObj = {
    street: '',
    city: '',
    state: '',
    zipCode: ''
    };
    
    // Try to extract zip code first
    const zipMatch = addressText.match(/(\d{5}(-\d{4})?)/);
    if (zipMatch) {
    addressObj.zipCode = zipMatch[1];
    addressText = addressText.replace(zipMatch[1], '').trim();
    }
    
    // Look for state abbreviation
    const stateMatch = addressText.match(/\s([A-Z]{2})\s*$/i);
    if (stateMatch) {
    addressObj.state = stateMatch[1].toUpperCase();
    addressText = addressText.replace(stateMatch[0], '').trim();
    }
    
    // Try to separate city from street
    const parts = addressText.split(',');
    if (parts.length > 1) {
    addressObj.city = this.capitalizeWords(parts[parts.length - 1].trim());
    addressObj.street = this.capitalizeWords(parts.slice(0, -1).join(',').trim());
    } else {
    // If no comma, just set the street
    addressObj.street = this.capitalizeWords(addressText.trim());
    }
    
    return addressObj;
}

capitalizeWords(text) {
    return text.replace(/\b\w/g, c => c.toUpperCase());
}

async validateExtractedData(data) {
    // A simple validation function - in a real application, this would be more comprehensive
    const validationResults = {
    isValid: true,
    errors: []
    };
    
    // Check if applicant name is present
    if (!data.applicantName) {
    validationResults.isValid = false;
    validationResults.errors.push('Could not extract applicant name');
    }
    
    // Check if address components are present
    if (!data.address || !data.address.street || !data.address.city) {
    validationResults.isValid = false;
    validationResults.errors.push('Could not extract complete address');
    }
    
    // Check if income details are present
    if (!data.incomeDetails || !data.incomeDetails.monthlyIncome) {
    validationResults.isValid = false;
    validationResults.errors.push('Could not extract income details');
    }
    
    // Check if loan amount is present
    if (!data.loanAmount) {
    validationResults.isValid = false;
    validationResults.errors.push('Could not extract loan amount');
    }
    
    return validationResults;
}

async terminate() {
    if (this.worker) {
    await this.worker.terminate();
    this.worker = null;
    }
}
}

module.exports = new OCRService();