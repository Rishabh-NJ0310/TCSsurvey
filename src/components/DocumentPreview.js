    import React, { useState, useEffect } from 'react';

    const DocumentPreview = ({ filePath, documentType }) => {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!filePath) return;

        const isPdf = filePath.toLowerCase().endsWith('.pdf');
        
        if (isPdf) {
        // For PDFs, we'll just show a placeholder
        setPreview(null);
        setLoading(false);
        } else {
        // For images, load the preview
        const img = new Image();
        img.src = `http://localhost:5000/${filePath}`;
        
        img.onload = () => {
            setPreview(`http://localhost:5000/${filePath}`);
            setLoading(false);
        };
        
        img.onerror = () => {
            setError('Failed to load image preview');
            setLoading(false);
        };
        }
    }, [filePath]);

    const getDocumentTypeLabel = (type) => {
        switch (type) {
        case 'id-proof':
            return 'ID Proof';
        case 'income-statement':
            return 'Income Statement';
        case 'loan-application':
            return 'Loan Application Form';
        case 'bank-statement':
            return 'Bank Statement';
        default:
            return 'Document';
        }
    };

    if (loading) {
        return (
        <div className="document-preview flex justify-center items-center h-64 bg-gray-50">
            <div className="loader"></div>
        </div>
        );
    }

    if (error) {
        return (
        <div className="document-preview flex justify-center items-center h-64 bg-gray-50">
            <p className="text-red-500">{error}</p>
        </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b">
            <h3 className="font-medium">{getDocumentTypeLabel(documentType)}</h3>
        </div>
        
        <div className="p-4">
            {preview ? (
            <img 
                src={preview} 
                alt={`${getDocumentTypeLabel(documentType)} Preview`} 
                className="w-full h-auto max-h-64 object-contain"
            />
            ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">PDF document</p>
                <a 
                href={`http://localhost:5000/${filePath}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 text-blue-600 hover:text-blue-800"
                >
                Open PDF
                </a>
            </div>
            )}
        </div>
        </div>
    );
    };

    export default DocumentPreview;
