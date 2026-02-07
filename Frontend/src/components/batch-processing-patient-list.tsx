import { useState } from 'react';
import { Search, Filter, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { BatchProcessingPatientDetails } from './batch-processing-patient-details';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  conditions: string[];
  suggestedCodes: number;
  status: 'verified' | 'review-needed' | 'pending';
}

interface BatchProcessingPatientListProps {
  onUploadNew: () => void;
}

export function BatchProcessingPatientList({ onUploadNew }: BatchProcessingPatientListProps) {
  const [selectedPatient, setSelectedPatient] = useState('P-1001');

  const patients: Patient[] = [
    {
      id: 'P-1001',
      name: 'John Smith',
      age: 58,
      gender: 'Male',
      conditions: ['Type 2 diabetes mellitus', 'Essential hypertension', 'Hyperlipidemia'],
      suggestedCodes: 3,
      status: 'verified'
    },
    {
      id: 'P-1002',
      name: 'Sarah Williams',
      age: 42,
      gender: 'Female',
      conditions: ['Migraine with aura', 'Anxiety disorder', 'Vitamin D deficiency'],
      suggestedCodes: 3,
      status: 'verified'
    },
    {
      id: 'P-1003',
      name: 'Michael Brown',
      age: 65,
      gender: 'Male',
      conditions: ['COPD', 'Atrial fibrillation', 'Osteoarthritis'],
      suggestedCodes: 3,
      status: 'review-needed'
    },
    {
      id: 'P-1004',
      name: 'Emily Davis',
      age: 34,
      gender: 'Female',
      conditions: ['Asthma', 'Allergic rhinitis', 'Eczema'],
      suggestedCodes: 3,
      status: 'verified'
    },
    {
      id: 'P-1005',
      name: 'Robert Miller',
      age: 71,
      gender: 'Male',
      conditions: [],
      suggestedCodes: 0,
      status: 'pending'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'review-needed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-600';
      case 'review-needed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getConditionColor = (condition: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-yellow-100 text-yellow-800',
      'bg-pink-100 text-pink-800'
    ];
    return colors[condition.length % colors.length];
  };

  const selectedPatientData = patients.find(p => p.id === selectedPatient);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Panel - Patient List */}
      <div className="w-2/5 border-r border-gray-200 flex flex-col bg-white">
        {/* Patient List Header - Fixed */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Patient List</h2>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium text-teal-700 bg-teal-100 rounded">All</span>
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span className="text-xs text-gray-600">Verified</span>
              <AlertTriangle className="w-3 h-3 text-red-500" />
              <span className="text-xs text-gray-600">Issues</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">5 patients processed with AI-suggested codes</p>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search patients..."
              className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </div>

        {/* Patient List - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {patients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => setSelectedPatient(patient.id)}
              className={`px-4 py-3 border-b border-gray-200 cursor-pointer transition-colors ${
                selectedPatient === patient.id ? 'bg-teal-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${selectedPatient === patient.id ? 'text-teal-600' : 'text-gray-600'}`}>
                    {patient.id}
                  </span>
                  {getStatusIcon(patient.status)}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {patient.age} years, {patient.gender}
              </p>
              
              {/* Conditions */}
              {patient.conditions.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {patient.conditions.slice(0, 2).map((condition, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 text-xs rounded-full ${getConditionColor(condition)}`}
                    >
                      {condition.length > 20 ? condition.substring(0, 20) + '...' : condition}
                    </span>
                  ))}
                  {patient.conditions.length > 2 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                      +{patient.conditions.length - 2}
                    </span>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-4 text-xs">
                <span className="text-gray-600">
                  +{patient.suggestedCodes} suggested codes
                </span>
                <span className={`flex items-center gap-1 ${getStatusColor(patient.status)}`}>
                  {patient.status === 'verified' && <CheckCircle className="w-3 h-3" />}
                  {patient.status === 'review-needed' && <span>Review needed</span>}
                  {patient.status === 'pending' && <span>Pending</span>}
                  {patient.status === 'verified' && <span>Verified</span>}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Upload New File Button - Fixed */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onUploadNew}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload New File
          </button>
        </div>
      </div>

      {/* Right Panel - Patient Details */}
      <BatchProcessingPatientDetails patient={selectedPatientData} />
    </div>
  );
}