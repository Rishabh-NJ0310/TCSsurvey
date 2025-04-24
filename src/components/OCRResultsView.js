
    // src/components/OCRResultsView.js
    import React from 'react';

    const OCRResultsView = ({ ocrData, processingStatus }) => {
    if (!ocrData || !ocrData.raw) {
        return (
        <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-gray-500">No OCR data available.</p>
        </div>
        );
    }

    // Format the raw OCR text for display
    const formattedText = ocrData.raw.split('\n').map((line, index) => (
        <p key={index} className={line.trim() === '' ? 'my-2' : 'mb-1'}>
        {line}
        </p>
    ));

    return (
        <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
            <h3 className="font-medium">OCR Extracted Text</h3>
            {ocrData.confidence && (
            <span className="text-sm text-gray-600">
                Confidence: {ocrData.confidence.toFixed(1)}%
            </span>
            )}
        </div>
        
        <div className="p-4 bg-white">
            <div className="bg-gray-50 p-3 rounded-md font-mono text-sm overflow-x-auto">
            {formattedText}
            </div>
            
            {processingStatus === 'completed' && (
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-700">
                <p className="font-medium">Extracted Information</p>
                <p className="text-sm mt-1">
                The OCR system has extracted key information from this document. Please verify the extracted data in the application form above.
                </p>
            </div>
            )}
            
            {processingStatus === 'error' && (
            <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
                <p className="font-medium">Processing Error</p>
                <p className="text-sm mt-1">
                There was an error processing this document. Please try uploading a clearer image or a different document.
                </p>
            </div>
            )}
        </div>
        </div>
    );
    };

    export default OCRResultsView;