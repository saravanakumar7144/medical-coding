import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  DollarSign,
  Calendar,
  User,
  Phone,
  Mail,
  Building,
  Stethoscope,
  ClipboardList,
  Save,
  Send,
  RefreshCw,
  Download,
  Upload,
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-react';

interface PriorAuth {
  id: string;
  authNumber?: string;
  patientName: string;
  memberId: string;
  payer: string;
  providerName: string;
  serviceRequested: string;
  cptCode: string;
  diagnosisCode: string;
  status: 'Pending' | 'Approved' | 'Denied' | 'Expired' | 'In Review';
  submissionDate: string;
  targetDate: string;
  feeSchedule?: {
    allowedAmount: number;
    copay: number;
    deductible: number;
    coinsurance: number;
  };
  clinicalInfo?: {
    urgency: 'Routine' | 'Urgent' | 'Emergent';
    diagnosis: string;
    clinicalNotes: string;
  };
}

export function EnhancedPriorAuth() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAuth, setSelectedAuth] = useState<string | null>(null);
  const [showNewAuthForm, setShowNewAuthForm] = useState(false);
  const [showFeeScheduleDetails, setShowFeeScheduleDetails] = useState(false);

  const priorAuths: PriorAuth[] = [
    {
      id: 'pa1',
      authNumber: 'PA240001',
      patientName: 'John Smith',
      memberId: 'MB123456789',
      payer: 'Medicare Part B',
      providerName: 'Dr. Johnson',
      serviceRequested: 'Echocardiogram',
      cptCode: '93306',
      diagnosisCode: 'I50.9',
      status: 'Approved',
      submissionDate: '2024-01-10',
      targetDate: '2024-01-17',
      feeSchedule: {
        allowedAmount: 485.00,
        copay: 20.00,
        deductible: 0,
        coinsurance: 0.20
      },
      clinicalInfo: {
        urgency: 'Routine',
        diagnosis: 'Heart failure, unspecified',
        clinicalNotes: 'Patient presents with shortness of breath and suspected heart failure.'
      }
    },
    {
      id: 'pa2',
      patientName: 'Sarah Wilson',
      memberId: 'MB987654321',
      payer: 'Aetna',
      providerName: 'Dr. Martinez',
      serviceRequested: 'MRI Brain',
      cptCode: '70553',
      diagnosisCode: 'R51.9',
      status: 'Pending',
      submissionDate: '2024-01-12',
      targetDate: '2024-01-19',
      feeSchedule: {
        allowedAmount: 1250.00,
        copay: 50.00,
        deductible: 150.00,
        coinsurance: 0.10
      },
      clinicalInfo: {
        urgency: 'Urgent',
        diagnosis: 'Headache, unspecified',
        clinicalNotes: 'Severe headaches with neurological symptoms requiring imaging.'
      }
    },
    {
      id: 'pa3',
      authNumber: 'PA240003',
      patientName: 'Michael Brown',
      memberId: 'MB456789123',
      payer: 'Blue Cross Blue Shield',
      providerName: 'Dr. Thompson',
      serviceRequested: 'Colonoscopy',
      cptCode: '45378',
      diagnosisCode: 'K63.5',
      status: 'Denied',
      submissionDate: '2024-01-08',
      targetDate: '2024-01-15',
      feeSchedule: {
        allowedAmount: 650.00,
        copay: 0,
        deductible: 0,
        coinsurance: 0
      },
      clinicalInfo: {
        urgency: 'Routine',
        diagnosis: 'Polyp of colon',
        clinicalNotes: 'Screening colonoscopy - patient history of polyps.'
      }
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Denied':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'Pending':
      case 'In Review':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Expired':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Denied':
        return 'bg-red-100 text-red-800';
      case 'Pending':
      case 'In Review':
        return 'bg-blue-100 text-blue-800';
      case 'Expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Emergent':
        return 'bg-red-100 text-red-800';
      case 'Urgent':
        return 'bg-yellow-100 text-yellow-800';
      case 'Routine':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAuths = priorAuths.filter(auth => {
    if (statusFilter !== 'all' && auth.status.toLowerCase() !== statusFilter) return false;
    if (searchQuery && 
        !auth.patientName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !auth.authNumber?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !auth.serviceRequested.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const submitAuth = () => {
    console.log('Submitting prior authorization...');
  };

  const checkFeeSchedule = (cptCode: string, payer: string) => {
    console.log(`Checking fee schedule for ${cptCode} with ${payer}`);
    setShowFeeScheduleDetails(true);
  };

  const exportAuth = (authId: string) => {
    console.log(`Exporting prior auth: ${authId}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Prior Authorization Management</h1>
        <p className="text-sm text-gray-600 mt-1">
          Fee-schedule aware prior authorization workflow with automated prompts
        </p>
      </div>

      {/* Header Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient, auth #, or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4]"
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <button 
            onClick={() => setShowNewAuthForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#62d5e4] text-white rounded-lg hover:bg-[#4bc5d6] transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            New Prior Auth
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prior Auth List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-gray-900">Prior Authorizations ({filteredAuths.length})</h2>
          
          {filteredAuths.map((auth) => (
            <div 
              key={auth.id}
              onClick={() => setSelectedAuth(auth.id)}
              className={`bg-white rounded-lg border p-4 cursor-pointer transition-colors ${
                selectedAuth === auth.id ? 'border-[#62d5e4] bg-cyan-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {auth.authNumber ? (
                      <span className="font-mono text-sm font-medium text-gray-900">{auth.authNumber}</span>
                    ) : (
                      <span className="text-sm text-gray-500 italic">Pending Assignment</span>
                    )}
                    {auth.clinicalInfo && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getUrgencyColor(auth.clinicalInfo.urgency)}`}>
                        {auth.clinicalInfo.urgency}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900">{auth.patientName}</p>
                  <p className="text-sm text-gray-600">{auth.serviceRequested}</p>
                </div>
                
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs mb-1 ${getStatusColor(auth.status)}`}>
                    {getStatusIcon(auth.status)}
                    {auth.status}
                  </div>
                  <p className="text-xs text-gray-500">Due: {auth.targetDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Payer:</span>
                  <p className="font-medium text-gray-900">{auth.payer}</p>
                </div>
                <div>
                  <span className="text-gray-600">Provider:</span>
                  <p className="font-medium text-gray-900">{auth.providerName}</p>
                </div>
              </div>

              {auth.feeSchedule && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">Allowed Amount:</span>
                      <span className="font-semibold text-green-600">${auth.feeSchedule.allowedAmount.toFixed(2)}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        checkFeeSchedule(auth.cptCode, auth.payer);
                      }}
                      className="text-xs text-[#62d5e4] hover:text-[#4bc5d6] transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        <div>
          {selectedAuth ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {(() => {
                const auth = priorAuths.find(a => a.id === selectedAuth);
                if (!auth) return null;

                return (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{auth.patientName}</h3>
                        <p className="text-sm text-gray-600">{auth.serviceRequested}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => exportAuth(auth.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-[#62d5e4] transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Patient Information */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Patient Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Member ID:</span>
                          <span className="font-mono text-gray-900">{auth.memberId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payer:</span>
                          <span className="text-gray-900">{auth.payer}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Provider:</span>
                          <span className="text-gray-900">{auth.providerName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Service Details */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Service Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">CPT Code:</span>
                          <span className="font-mono text-gray-900">{auth.cptCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Diagnosis:</span>
                          <span className="font-mono text-gray-900">{auth.diagnosisCode}</span>
                        </div>
                        {auth.clinicalInfo && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Urgency:</span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getUrgencyColor(auth.clinicalInfo.urgency)}`}>
                                {auth.clinicalInfo.urgency}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Clinical Notes:</span>
                              <p className="text-gray-900 mt-1">{auth.clinicalInfo.clinicalNotes}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Fee Schedule Information */}
                    {auth.feeSchedule && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Fee Schedule Details</h4>
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-green-700">Allowed Amount:</span>
                              <span className="font-semibold text-green-900">${auth.feeSchedule.allowedAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Patient Copay:</span>
                              <span className="text-green-900">${auth.feeSchedule.copay.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Deductible:</span>
                              <span className="text-green-900">${auth.feeSchedule.deductible.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Coinsurance:</span>
                              <span className="text-green-900">{(auth.feeSchedule.coinsurance * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status Timeline */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Status Timeline</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#62d5e4] rounded-full flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Submitted</p>
                            <p className="text-xs text-gray-500">{auth.submissionDate}</p>
                          </div>
                        </div>
                        
                        {auth.status === 'Approved' && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Approved</p>
                              <p className="text-xs text-gray-500">{auth.authNumber}</p>
                            </div>
                          </div>
                        )}
                        
                        {auth.status === 'Denied' && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                              <XCircle className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Denied</p>
                              <p className="text-xs text-gray-500">Medical necessity not established</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      {auth.status === 'Pending' && (
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#62d5e4] text-white rounded-lg hover:bg-[#4bc5d6] transition-colors">
                          <RefreshCw className="w-4 h-4" />
                          Check Status
                        </button>
                      )}
                      
                      {auth.status === 'Denied' && (
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                          <Send className="w-4 h-4" />
                          Submit Appeal
                        </button>
                      )}
                      
                      <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <FileText className="w-4 h-4" />
                        View Documentation
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select Prior Auth</h3>
              <p className="text-sm text-gray-600">
                Choose a prior authorization from the list to view details and take actions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fee Schedule Details Modal */}
      {showFeeScheduleDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Fee Schedule Details</h2>
                <button
                  onClick={() => setShowFeeScheduleDetails(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Service Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">CPT Code:</span>
                        <span className="font-mono text-gray-900">93306</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Description:</span>
                        <span className="text-gray-900">Echocardiogram</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payer:</span>
                        <span className="text-gray-900">Medicare Part B</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Financial Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fee Schedule Amount:</span>
                        <span className="font-semibold text-green-600">$485.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Patient Responsibility:</span>
                        <span className="text-orange-600">$117.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Payment:</span>
                        <span className="font-semibold text-blue-600">$368.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Prior Authorization Required</h4>
                  </div>
                  <p className="text-sm text-blue-800">
                    This service requires prior authorization for Medicare Part B. 
                    Authorization typically takes 5-7 business days to process.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Coverage Requirements</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                      <span>Medical necessity must be documented</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                      <span>Prior diagnostic imaging results if applicable</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                      <span>Clinical symptoms and examination findings</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button className="flex-1 px-4 py-2 bg-[#62d5e4] text-white rounded-lg hover:bg-[#4bc5d6] transition-colors">
                  Proceed with Auth
                </button>
                <button 
                  onClick={() => setShowFeeScheduleDetails(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}