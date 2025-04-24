"use client";

import { useState } from "react";
import { Loader2, Upload, Check, AlertCircle, FileText } from "lucide-react";
import api from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setOcrData(null); // Clear previous data when new file is selected
      setUploadedFileId(null); // Clear previous file ID
      setError(null); // Clear any previous errors
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      // Log the base URL for debugging
      console.log("API base URL:", api.defaults.baseURL);

      // Create form data for upload
      const formData = new FormData();
      formData.append("document", file);

      // Send to backend for file upload only
      const response = await api.post("/documents/upload", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log("Upload response:", response.data);

      // Store the uploaded file ID for later processing
      setUploadedFileId(response.data.fileId || response.data.documents?.[0]?.filePath);
    } catch (error: any) {
      console.error("Error uploading document:", error);

      // Enhanced error reporting
      if (error.response) {
        // The request was made and the server responded with a status code outside of 2xx
        console.error("Response error data:", error.response.data);
        console.error("Response error status:", error.response.status);
        setError(`Server error: ${error.response.status} - ${error.response.data.error || 'Unknown error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Request error:", error.request);
        setError(`Network error: Could not connect to the server. Make sure the backend is running on the correct port.`);
      } else {
        // Something happened in setting up the request
        setError(`Error: ${error.message}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Handle OCR processing
  const handleGetExtractedData = async () => {
    if (!uploadedFileId) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Request OCR processing of the previously uploaded file
      const response = await api.get(`/documents/process/${uploadedFileId}`);
      setOcrData(response.data);
    } catch (error: any) {
      console.error("Error processing document:", error);

      if (error.response) {
        setError(`Server error: ${error.response.status} - ${error.response.data.error || 'Unknown error'}`);
      } else if (error.request) {
        setError(`Network error: Could not connect to the server.`);
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle verification submission
  const handleVerify = async () => {
    if (!ocrData) return;

    setError(null);

    try {
      // Send verified data to backend using axios
      const response = await api.post("/applications/verify", {
        ...ocrData,
        isManuallyVerified: true
      });

      // Handle success response
      console.log("Verification successful:", response.data);
      alert("Verification successful!");
    } catch (error: any) {
      console.error("Error verifying data:", error);

      if (error.response) {
        setError(`Server error: ${error.response.status} - ${error.response.data.error || 'Unknown error'}`);
      } else if (error.request) {
        setError(`Network error: Could not connect to the server.`);
      } else {
        setError(`Error: ${error.message}`);
      }
    }
  };

  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Loan Application Document Processor</h1>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side - Document Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-lg">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 mb-4">
                Upload your application document for processing
              </p>
              <Input
                id="document"
                type="file"
                onChange={handleFileChange}
                className="mb-4"
                accept="image/*, application/pdf"
              />
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload Document"
                )}
              </Button>

              {file && !isUploading && (
                <p className="mt-4 text-sm">
                  Selected file: {file.name}
                </p>
              )}

              {uploadedFileId && (
                <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md w-full text-center">
                  <Check className="h-5 w-5 mx-auto mb-2" />
                  <p className="text-sm font-medium">Document uploaded successfully!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Side - Data Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Extracted Data</CardTitle>
            {ocrData && (
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs font-medium">Data Available</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!uploadedFileId ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Upload a document first
                </p>
              </div>
            ) : !ocrData ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <FileText className="h-12 w-12 text-primary/60 mb-4" />
                <p className="text-muted-foreground mb-8">
                  Document uploaded. Ready to extract data.
                </p>
                <Button
                  onClick={handleGetExtractedData}
                  disabled={isProcessing}
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Get Extracted Data"
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Applicant Information */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Applicant Information</h3>
                  <div className="grid grid-cols-1 gap-4 p-4 bg-muted/30 rounded-md">
                    <div>
                      <Label className="text-xs text-muted-foreground">Applicant Name</Label>
                      <p className="font-medium">{ocrData.applicantName || "Not detected"}</p>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Address</h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-md">
                    <div>
                      <Label className="text-xs text-muted-foreground">Street</Label>
                      <p className="font-medium">{ocrData.address?.street || "Not detected"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">City</Label>
                      <p className="font-medium">{ocrData.address?.city || "Not detected"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">State</Label>
                      <p className="font-medium">{ocrData.address?.state || "Not detected"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">ZIP Code</Label>
                      <p className="font-medium">{ocrData.address?.zipCode || "Not detected"}</p>
                    </div>
                  </div>
                </div>

                {/* Income Details */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Income Details</h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-md">
                    <div>
                      <Label className="text-xs text-muted-foreground">Monthly Income</Label>
                      <p className="font-medium">
                        {ocrData.incomeDetails?.monthlyIncome
                          ? `$${ocrData.incomeDetails.monthlyIncome.toLocaleString()}`
                          : "Not detected"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Employer</Label>
                      <p className="font-medium">{ocrData.incomeDetails?.employerName || "Not detected"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Employment Duration</Label>
                      <p className="font-medium">
                        {ocrData.incomeDetails?.employmentDuration
                          ? `${ocrData.incomeDetails.employmentDuration} months`
                          : "Not detected"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Loan Amount</Label>
                      <p className="font-medium">
                        {ocrData.loanAmount
                          ? `$${ocrData.loanAmount.toLocaleString()}`
                          : "Not detected"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* OCR Confidence */}
                {ocrData.ocrData && (
                  <div className="p-4 bg-muted rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs text-muted-foreground">OCR Confidence</Label>
                      <span className="text-sm font-bold">
                        {ocrData.ocrData.confidence || 'N/A'}%
                      </span>
                    </div>
                    <div className="w-full bg-muted-foreground/20 rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{ width: `${ocrData.ocrData.confidence || 0}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <Button onClick={handleVerify} className="w-full">
                  <Check className="mr-2 h-4 w-4" /> Verify Data
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}