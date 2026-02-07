import { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface BatchProcessingUploadProps {
  onFileProcessed: () => void;
}

export function BatchProcessingUpload({ onFileProcessed }: BatchProcessingUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleStartProcessing = () => {
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      onFileProcessed();
    }, 2000);
  };

  if (isProcessing) {
    return (
      <div className="max-w-2xl">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Patient Data</h3>
          <p className="text-sm text-gray-600">
            AI is analyzing the uploaded file and generating code suggestions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload Patient Data</h2>
        <p className="text-sm text-gray-600">
          Select a file containing patient information and medical conditions for AI-powered batch processing.
        </p>
      </div>

      {/* File Upload Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Patient Data File
          </label>
          
          {/* File Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-teal-500 bg-teal-50'
                : selectedFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileSelect}
              accept=".csv,.xlsx,.xls,.txt"
            />
            
            <div className="flex flex-col items-center">
              {selectedFile ? (
                <>
                  <FileText className="w-12 h-12 text-green-500 mb-4" />
                  <p className="text-sm font-medium text-green-700 mb-1">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-green-600">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Choose File
                  </p>
                  <p className="text-xs text-gray-500">No file chosen</p>
                </>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Supported formats: CSV, Excel (.xlsx, .xls)
          </p>
        </div>

        {/* Processing Options */}
        {selectedFile && (
          <div className="space-y-4">
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Processing Options</h3>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                    defaultChecked
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    AI Code Suggestions
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                    defaultChecked
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Automatic Verification
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Generate Detailed Reports
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={handleStartProcessing}
                className="bg-teal-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-600 transition-colors"
              >
                Start Processing
              </button>
              <button
                onClick={() => setSelectedFile(null)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Clear File
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">File Format Requirements</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Include patient ID, demographics, and diagnosis information</li>
              <li>• Use standard medical terminology and ICD-10 codes when available</li>
              <li>• Ensure patient data is de-identified for privacy compliance</li>
              <li>• Maximum file size: 50MB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}