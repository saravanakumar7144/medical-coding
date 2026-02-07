import { useState } from 'react';
import { BatchProcessingUpload } from './batch-processing-upload';
import { BatchProcessingPatientList } from './batch-processing-patient-list';
import { AlertTriangle, BarChart } from 'lucide-react';

export function BatchProcessing() {
  const [showPatientList, setShowPatientList] = useState(false);

  const handleFileProcessed = () => {
    setShowPatientList(true);
  };

  const handleUploadNew = () => {
    setShowPatientList(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="min-h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Batch Processing</h1>
            {showPatientList && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Processing batch file: patients_data.csv</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {showPatientList ? (
            <div className="space-y-0">
              {/* Batch Summary Section */}
              <div className="bg-cyan-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Batch Summary</h2>
                  <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                    <BarChart className="w-4 h-4" />
                    Get AI Insights
                  </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Total Patients</p>
                    <p className="text-xl font-semibold text-gray-900">5</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">AI Verified</p>
                    <p className="text-xl font-semibold text-[#62d5e4]">60.0%</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Total Codes</p>
                    <p className="text-xl font-semibold text-gray-900">15</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">High Confidence</p>
                    <p className="text-xl font-semibold text-[#62d5e4]">73.3%</p>
                  </div>
                </div>

                {/* Common Issues Detected */}
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-900 mb-1">Common Issues Detected</h3>
                      <p className="text-xs text-yellow-800">Missing specificity in chronic conditions (32%), Unspecified codes (18%)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient List */}
              <BatchProcessingPatientList onUploadNew={handleUploadNew} />
            </div>
          ) : (
            <div className="px-6 py-6">
              <BatchProcessingUpload onFileProcessed={handleFileProcessed} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}