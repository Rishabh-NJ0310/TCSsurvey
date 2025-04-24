
// src/components/ViewApplication.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ViewApplication = () => {
const { id } = useParams();
const navigate = useNavigate();

const [application, setApplication] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [selectedFile, setSelectedFile] = useState(null);
const [documentType, setDocumentType] = useState('id-proof');
const [uploadStatus, setUploadStatus] = useState('idle');
const [editMode, setEditMode] = useState(false);
const [formData, setFormData] = useState({});

// Fetch application data
useEffect(() => {
    const fetchApplication = async () => {
    try {
        const response = await axios.get(`http://localhost:5000/api/applications/${id}`);
        setApplication(response.data);
        setFormData({
        applicantName: response.data.applicantName || '',
        address: {
            street: response.data.address?.street || '',
            city: response.data.address?.city || '',
            state: response.data.address?.state || '',
            zipCode: response.data.address?.zipCode || ''
        },
        incomeDetails: {
            monthlyIncome: response.data.incomeDetails?.monthlyIncome || '',
            employerName: response.data.incomeDetails?.employerName || '',
            employmentDuration: response.data.incomeDetails?.employmentDuration || ''
        },
        loanAmount: response.data.loanAmount || ''
        });
        setLoading(false);
    } catch (err) {
        setError('Error fetching application details');
        setLoading(false);
        console.error('Error fetching application:', err);
    }
    };

    fetchApplication();
}, [id]);

// Handle file selection
const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
};

// Handle document type selection
const handleDocumentTypeChange = (e) => {
    setDocumentType(e.target.value);
};

// Handle file upload
const handleUpload = async () => {
    if (!selectedFile) {
    alert('Please select a file to upload');
    return;
    }

    setUploadStatus('uploading');
    
    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('documentType', documentType);
    
    try {
    await axios.post(
        `http://localhost:5000/api/applications/${id}/documents`, 
        formData, 
        {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
        }
    );
    
    setUploadStatus('success');
    setSelectedFile(null);
    
    // Refresh application data after upload
    const response = await axios.get(`http://localhost:5000/api/applications/${id}`);
    setApplication(response.data);
    
    // Poll for OCR completion
    pollOcrStatus();
    } catch (err) {
    setUploadStatus('error');
    console.error('Error uploading document:', err);
    }
};

// Poll OCR status
const pollOcrStatus = async () => {
    let attempts = 0;
    const maxAttempts = 10;
    
    const poll = async () => {
    if (attempts >= maxAttempts) return;
    
    try {
        const response = await axios.get(`http://localhost:5000/api/applications/${id}`);
        const app = response.data;
        
        if (app.processingStatus === 'completed' || app.processingStatus === 'error') {
        setApplication(app);
        setFormData({
            applicantName: app.applicantName || '',
            address: {
            street: app.address?.street || '',
            city: app.address?.city || '',
            state: app.address?.state || '',
            zipCode: app.address?.zipCode || ''
            },
            incomeDetails: {
            monthlyIncome: app.incomeDetails?.monthlyIncome || '',
            employerName: app.incomeDetails?.employerName || '',
            employmentDuration: app.incomeDetails?.employmentDuration || ''
            },
            loanAmount: app.loanAmount || ''
        });
        return;
        }
        
        attempts++;
        setTimeout(poll, 2000); // Poll every 2 seconds
    } catch (err) {
        console.error('Error polling OCR status:', err);
    }
    };
    
    setTimeout(poll, 2000); // Start polling after 2 seconds
};

// Handle form changes in edit mode
const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
    const [parent, child] = name.split('.');
    setFormData(prev => ({
        ...prev,
        [parent]: {
        ...prev[parent],
        [child]: value
        }
    }));
    } else {
    setFormData(prev => ({
        ...prev,
        [name]: value
    }));
    }
};

// Handle form submission
const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
    // Convert numeric fields to numbers
    const dataToSubmit = {
        ...formData,
        incomeDetails: {
        ...formData.incomeDetails,
        monthlyIncome: parseFloat(formData.incomeDetails.monthlyIncome),
        employmentDuration: parseInt(formData.incomeDetails.employmentDuration, 10)
        },
        loanAmount: parseFloat(formData.loanAmount)
    };
    
    await axios.put(`http://localhost:5000/api/applications/${id}/verify`, dataToSubmit);
    
    // Refresh application data
    const response = await axios.get(`http://localhost:5000/api/applications/${id}`);
    setApplication(response.data);
    
    setEditMode(false);
    } catch (err) {
    console.error('Error updating application:', err);
    alert('Failed to update application. Please try again.');
    }
};

// Handle application submission
const handleSubmitApplication = async () => {
    if (!window.confirm('Are you sure you want to submit this application for review?')) {
    return;
    }
    
    try {
    await axios.post(`http://localhost:5000/api/applications/${id}/submit`);
    
    // Refresh application data
    const response = await axios.get(`http://localhost:5000/api/applications/${id}`);
    setApplication(response.data);
    
    alert('Application submitted successfully!');
    } catch (err) {
    console.error('Error submitting application:', err);
    alert('Failed to submit application. ' + (err.response?.data?.message || 'Please try again.'));
    }
};

if (loading) {
    return (
    <div className="flex justify-center items-center h-64">
        <div className="loader"></div>
    </div>
    );
}

if (error || !application) {
    return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
        <p>{error || 'Application not found'}</p>
        <button 
        onClick={() => navigate('/')}
        className="mt-2 bg-red-700 text-white px-3 py-1 rounded-md hover:bg-red-800"
        >
        Back to Dashboard
        </button>
    </div>
    );
}

const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'draft':
            return 'bg-gray-200 text-gray-800';
        case 'submitted':
            return 'bg-blue-200 text-blue-800';
        case 'under-review':
            return 'bg-yellow-200 text-yellow-800';
        case 'approved':
            return 'bg-green-200 text-green-800';
        case 'rejected':
            return 'bg-red-200 text-red-800';
        default:
            return 'bg-gray-200 text-gray-800';
    }
};

return (
    <div className="max-w-4xl mx-auto">
    <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Application Details</h1>
        <div className="flex gap-2">
        <button
            onClick={() => navigate('/')}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
            Back
        </button>
        
        {application.status === 'draft' && application.isManuallyVerified && (
            <button
            onClick={handleSubmitApplication}
            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
            Submit for Review
            </button>
        )}
        
        {application.status === 'draft' && (
            <button
            onClick={() => setEditMode(!editMode)}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
            {editMode ? 'Cancel Edit' : 'Edit Details'}
            </button>
        )}
        </div>
    </div>
    
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-100 border-b border-gray-200">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
            {application.applicantName || 'Unnamed Applicant'}
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadgeClass(application.status)}`}>
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
            Created: {new Date(application.createdAt).toLocaleString()}
        </p>
        </div>
        
        {editMode ? (
        <form onSubmit={handleFormSubmit} className="p-6">
            <div className="mb-6">
            <h3 className="text-md font-semibold mb-3">Applicant Information</h3>
            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="applicantName">
                Full Name
                </label>
                <input
                type="text"
                id="applicantName"
                name="applicantName"
                value={formData.applicantName}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                />
            </div>
            </div>
            
            <div className="mb-6">
            <h3 className="text-md font-semibold mb-3">Address</h3>
            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="address.street">
                Street Address
                </label>
                <input
                type="text"
                id="address.street"
                name="address.street"
                value={formData.address.street}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="address.city">
                    City
                </label>
                <input
                    type="text"
                    id="address.city"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                </div>
                
                <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="address.state">
                    State
                </label>
                <input
                    type="text"
                    id="address.state"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                </div>
            </div>
            
            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="address.zipCode">
                ZIP Code
                </label>
                <input
                type="text"
                id="address.zipCode"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                />
            </div>
            </div>
            
            <div className="mb-6">
            <h3 className="text-md font-semibold mb-3">Income Details</h3>
            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="incomeDetails.monthlyIncome">
                Monthly Income ($)
                </label>
                <input
                type="number"
                id="incomeDetails.monthlyIncome"
                name="incomeDetails.monthlyIncome"
                value={formData.incomeDetails.monthlyIncome}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
                step="0.01"
                />
            </div>
            
            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="incomeDetails.employerName">
                Employer Name
                </label>
                <input
                type="text"
                id="incomeDetails.employerName"
                name="incomeDetails.employerName"
                value={formData.incomeDetails.employerName}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                />
            </div>
            
            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="incomeDetails.employmentDuration">
                Employment Duration (months)
                </label>
                <input
                type="number"
                id="incomeDetails.employmentDuration"
                name="incomeDetails.employmentDuration"
                value={formData.incomeDetails.employmentDuration}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
                step="1"
                />
            </div>
            </div>
            
            <div className="mb-6">
            <h3 className="text-md font-semibold mb-3">Loan Information</h3>
            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="loanAmount">
                Loan Amount ($)
                </label>
                <input
                type="number"
                id="loanAmount"
                name="loanAmount"
                value={formData.loanAmount}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
                step="0.01"
                />
            </div>
            </div>
            
            <div className="flex justify-end">
            <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
                Save Changes
            </button>
            </div>
        </form>
        ) : (
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 className="text-md font-semibold mb-3">Applicant Information</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                <p className="mb-2"><span className="font-medium">Name:</span> {application.applicantName || 'Not provided'}</p>
                </div>
            </div>
            
            <div>
                <h3 className="text-md font-semibold mb-3">Address</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                <p className="mb-1"><span className="font-medium">Street:</span> {application.address?.street || 'Not provided'}</p>
                <p className="mb-1"><span className="font-medium">City:</span> {application.address?.city || 'Not provided'}</p>
                <p className="mb-1"><span className="font-medium">State:</span> {application.address?.state || 'Not provided'}</p>
                <p><span className="font-medium">ZIP Code:</span> {application.address?.zipCode || 'Not provided'}</p>
                </div>
            </div>
            
            <div>
                <h3 className="text-md font-semibold mb-3">Income Details</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                <p className="mb-1">
                    <span className="font-medium">Monthly Income:</span> {
                    application.incomeDetails?.monthlyIncome 
                        ? `$${application.incomeDetails.monthlyIncome.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                        : 'Not provided'
                    }
                </p>
                <p className="mb-1"><span className="font-medium">Employer:</span> {application.incomeDetails?.employerName || 'Not provided'}</p>
                <p><span className="font-medium">Employment Duration:</span> {
                    application.incomeDetails?.employmentDuration 
                    ? `${application.incomeDetails.employmentDuration} months`
                    : 'Not provided'
                }</p>
                </div>
            </div>
            
            <div>
                <h3 className="text-md font-semibold mb-3">Loan Information</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                <p>
                    <span className="font-medium">Loan Amount:</span> {
                    application.loanAmount 
                        ? `$${application.loanAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                        : 'Not provided'
                    }
                </p>
                </div>
            </div>
            </div>
        </div>
        )}
    </div>
    
    {application.status === 'draft' && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Document Upload & OCR Processing</h2>
        
        <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="documentType">
            Document Type
            </label>
            <select
            id="documentType"
            value={documentType}
            onChange={handleDocumentTypeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
            <option value="id-proof">ID Proof</option>
            <option value="income-statement">Income Statement</option>
            <option value="loan-application">Loan Application Form</option>
            <option value="bank-statement">Bank Statement</option>
            </select>
        </div>
        
        <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="document">
            Upload Document
            </label>
            <input
            type="file"
            id="document"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            accept="image
            /*,.pdf"/>
            <p className="text-xs text-gray-500 mt-1">
            Accepted formats: JPG, PNG, PDF
            </p>
        </div>
        
        <div className="flex justify-end">
            <button
            onClick={handleUpload}
            disabled={!selectedFile || uploadStatus === 'uploading'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
            {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload & Process'}
            </button>
        </div>
        
        {uploadStatus === 'success' && (
            <div className="mt-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
            <p>Document uploaded successfully! OCR processing has started.</p>
            </div>
        )}
        
        {uploadStatus === 'error' && (
            <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
            <p>Error uploading document. Please try again.</p>
            </div>
        )}
        
        {application.processingStatus === 'processing' && (
            <div className="mt-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
            <p>OCR processing in progress... This may take a few moments.</p>
            </div>
        )}
        
        {application.processingStatus === 'completed' && (
            <div className="mt-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
            <p>OCR processing completed! {application.ocrData?.confidence ? `Confidence: ${application.ocrData.confidence.toFixed(2)}%` : ''}</p>
            <p className="mt-2">Please review and verify the extracted information above.</p>
            </div>
        )}
        
        {application.processingStatus === 'error' && (
            <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
            <p>Error during OCR processing. Please try again with a clearer document.</p>
            </div>
        )}
        </div>
    )}
    
    <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Uploaded Documents</h2>
        
        {application.documents && application.documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {application.documents.map((doc, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-medium text-blue-600">
                    {doc.documentType.charAt(0).toUpperCase() + doc.documentType.slice(1).replace('-', ' ')}
                    </h3>
                    <p className="text-sm text-gray-500">
                    Uploaded: {new Date(doc.uploadDate).toLocaleString()}
                    </p>
                </div>
                <a
                    href={`http://localhost:5000/${doc.filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                >
                    View
                </a>
                </div>
            </div>
            ))}
        </div>
        ) : (
        <p className="text-gray-500">No documents uploaded yet.</p>
        )}
    </div>
    </div>
);
};

export default ViewApplication;