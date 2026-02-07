import { useState, useEffect } from 'react';
import { Search, FileText, Plus, X } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  conditions: string[];
  suggestedCodes: number;
  status: 'verified' | 'review-needed' | 'pending';
}

interface BatchProcessingPatientDetailsProps {
  patient?: Patient;
}

export function BatchProcessingPatientDetails({ patient }: BatchProcessingPatientDetailsProps) {
  const [activeTab, setActiveTab] = useState('Coding');
  const [aiSuggestedCodes, setAiSuggestedCodes] = useState(() => getAiCodesForPatient(patient?.id || 'P-1001'));
  const [selectedCodes, setSelectedCodes] = useState(() => getSelectedCodesForPatient(patient?.id || 'P-1001'));

  const tabs = ['Coding', 'Conditions', 'Hospital Details', 'Verification', 'Notes'];

  // Dynamic AI suggested codes based on patient
  function getAiCodesForPatient(patientId: string) {
    const codeDatabase: Record<string, any[]> = {
      'P-1001': [
        { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', confidence: 95, needsValidation: false },
        { code: 'I10', description: 'Essential (primary) hypertension', confidence: 88, needsValidation: false },
        { code: 'E78.5', description: 'Hyperlipidemia, unspecified', confidence: 92, needsValidation: false }
      ],
      'P-1002': [
        { code: 'G43.109', description: 'Migraine with aura, not intractable, without status migrainosus', confidence: 91, needsValidation: false },
        { code: 'F41.9', description: 'Anxiety disorder, unspecified', confidence: 76, needsValidation: true },
        { code: 'E55.9', description: 'Vitamin D deficiency, unspecified', confidence: 89, needsValidation: false }
      ],
      'P-1003': [
        { code: 'J44.1', description: 'Chronic obstructive pulmonary disease with acute exacerbation', confidence: 72, needsValidation: true },
        { code: 'I48.91', description: 'Unspecified atrial fibrillation', confidence: 85, needsValidation: false },
        { code: 'M19.90', description: 'Unspecified osteoarthritis, unspecified site', confidence: 67, needsValidation: true }
      ],
      'P-1004': [
        { code: 'J45.9', description: 'Asthma, unspecified', confidence: 93, needsValidation: false },
        { code: 'J30.9', description: 'Allergic rhinitis, unspecified', confidence: 88, needsValidation: false },
        { code: 'L30.9', description: 'Dermatitis, unspecified', confidence: 81, needsValidation: false }
      ],
      'P-1005': [
        { code: 'Z51.11', description: 'Encounter for antineoplastic chemotherapy', confidence: 45, needsValidation: true },
        { code: 'R50.9', description: 'Fever, unspecified', confidence: 52, needsValidation: true }
      ]
    };
    return codeDatabase[patientId] || [];
  }

  function getSelectedCodesForPatient(patientId: string) {
    const selectedDatabase: Record<string, any[]> = {
      'P-1001': [
        { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
        { code: 'I10', description: 'Essential (primary) hypertension' },
        { code: 'E78.5', description: 'Hyperlipidemia, unspecified' }
      ],
      'P-1002': [
        { code: 'G43.109', description: 'Migraine with aura, not intractable, without status migrainosus' },
        { code: 'E55.9', description: 'Vitamin D deficiency, unspecified' }
      ],
      'P-1003': [
        { code: 'I48.91', description: 'Unspecified atrial fibrillation' }
      ],
      'P-1004': [
        { code: 'J45.9', description: 'Asthma, unspecified' },
        { code: 'J30.9', description: 'Allergic rhinitis, unspecified' },
        { code: 'L30.9', description: 'Dermatitis, unspecified' }
      ],
      'P-1005': []
    };
    return selectedDatabase[patientId] || [];
  }

  // Update codes when patient changes
  useEffect(() => {
    if (patient?.id) {
      setAiSuggestedCodes(getAiCodesForPatient(patient.id));
      setSelectedCodes(getSelectedCodesForPatient(patient.id));
    }
  }, [patient?.id]);

  const handleAddCode = (codeToAdd: any) => {
    setSelectedCodes(prev => [...prev, codeToAdd]);
    setAiSuggestedCodes(prev => prev.filter(code => code.code !== codeToAdd.code));
  };

  const handleRemoveCode = (codeToRemove: any) => {
    setSelectedCodes(prev => prev.filter(code => code.code !== codeToRemove.code));
  };

  const medicalConditions = [
    {
      condition: 'Type 2 diabetes mellitus',
      suggestedCode: 'E11.9',
      description: 'Type 2 diabetes mellitus without complications',
      aiConfidence: 95
    },
    {
      condition: 'Essential hypertension',
      suggestedCode: 'I10',
      description: 'Essential (primary) hypertension',
      aiConfidence: 88
    },
    {
      condition: 'Hyperlipidemia',
      suggestedCode: 'E78.5',
      description: 'Hyperlipidemia, unspecified',
      aiConfidence: 92
    }
  ];

  if (!patient) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Select a patient to view details</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Patient Header - Fixed */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="font-semibold text-gray-900">{patient.name}</h2>
            <p className="text-sm text-gray-600">
              {patient.age} years, {patient.gender} | Patient ID: {patient.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-sm text-teal-600 hover:text-teal-700 border border-teal-200 rounded-md hover:bg-teal-50 transition-colors">
              Show All Insights
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Search className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Fixed */}
      <div className="border-b border-gray-200 px-4 flex-shrink-0">
        <nav className="flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'Coding' && (
          <div className="space-y-6">
            {/* AI-Suggested Codes */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">AI-Suggested Codes</h3>
              {aiSuggestedCodes.length > 0 ? (
                <div className="space-y-3">
                  {aiSuggestedCodes.map((code, index) => (
                    <div key={index} className={`border rounded-lg p-4 ${code.needsValidation ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-teal-600">{code.code}</span>
                          {code.needsValidation && (
                            <span className="px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded">
                              Needs Validation
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">AI Confidence</span>
                          <span className="text-sm font-medium text-gray-900">{code.confidence}%</span>
                          <button 
                            onClick={() => handleAddCode(code)}
                            className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center hover:bg-teal-600 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{code.description}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            code.confidence >= 85 ? 'bg-green-500' : 
                            code.confidence >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${code.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No additional AI suggestions available</p>
                </div>
              )}
            </div>

            {/* Selected Codes */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Selected Codes ({selectedCodes.length})</h3>
              {selectedCodes.length > 0 ? (
                <div className="space-y-3">
                  {selectedCodes.map((code, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-green-50">
                      <div>
                        <span className="font-medium text-teal-600 mr-2">{code.code}</span>
                        <span className="text-sm text-gray-700">{code.description}</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveCode(code)}
                        className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <p>No codes selected yet</p>
                  <p className="text-sm">Add codes from AI suggestions above</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Conditions' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Conditions</h3>
            <div className="space-y-4">
              {medicalConditions.map((condition, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{condition.condition}</h4>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Suggested code:</span>
                    <span className="text-teal-600 mx-2">{condition.suggestedCode}</span>
                    <span>{condition.description}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">AI Confidence</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${condition.aiConfidence}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-sm text-gray-600 mt-1">
                    {condition.aiConfidence}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Hospital Details' && (
          <div className="space-y-6">
            {/* Hospital Information */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Hospital Information</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
                    <p className="text-sm text-gray-900">General Hospital</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
                    <p className="text-sm text-gray-900">2023-05-15</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attending Physician</label>
                    <p className="text-sm text-gray-900">Dr. Johnson</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medical Record Number</label>
                    <p className="text-sm text-gray-900">MRN-1001</p>
                  </div>
                </div>
                
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <p className="text-sm text-gray-900">Internal Medicine</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
                    <p className="text-sm text-gray-900">Inpatient</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                    <p className="text-sm text-gray-900">304-B</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
                    <p className="text-sm text-gray-900">Blue Cross Blue Shield</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Treatment Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Treatment Summary</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Patient was admitted with complaints of Type 2 diabetes mellitus, Essential hypertension, Hyperlipidemia. Initial 
                  assessment showed stable vital signs with mild discomfort. Treatment plan includes medication management 
                  and monitoring of symptoms. Patient is responding well to current treatment protocol.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Verification' && (
          <div className="space-y-6">
            {/* Verification Status */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium text-green-900">Verified</span>
                </div>
                <p className="text-sm text-green-700">Coding has been verified for accuracy</p>
              </div>
            </div>

            {/* AI Verification */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Verification</h3>
              
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Accuracy Score</label>
                  <p className="text-2xl font-semibold text-green-600">94%</p>
                </div>
                <p className="text-sm text-gray-600">
                  The AI model has verified the coding with high confidence based on patient conditions and medical guidelines.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Verification Notes</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                    <span>All conditions have appropriate ICD-10 codes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                    <span>Code specificity is appropriate for documented conditions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                    <span>No contradictory or duplicate codes detected</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Coder Notes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Coder Notes</h3>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 italic">No additional notes from the coder.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Notes' && (
          <div>
            <textarea
              placeholder="Add notes for this patient..."
              className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
          </div>
        )}
      </div>

      {/* Bottom Actions - Fixed */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Save Draft
          </button>
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              Reject
            </button>
            <button className="px-4 py-2 text-sm text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors">
              Verify & Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}