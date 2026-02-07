import { useState } from 'react';
import {
  X, User, Calendar, CreditCard, FileText, AlertTriangle,
  DollarSign, Clock, MapPin, Phone, Mail, Building2,
  Heart, Activity, CheckCircle, XCircle, Brain, Zap,
  TrendingUp, ArrowRight, Eye, MessageSquare, Download,
  History, ClipboardList, Pill, Stethoscope, Upload,
  ChevronRight, Award, Timer
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export interface PatientClaimDetailsProps {
  claimId: string;
  onClose: () => void;
  onOpenDenial?: (claimId: string) => void;
}

export function PatientClaimDetails({ claimId, onClose, onOpenDenial }: PatientClaimDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock patient and claim data based on claimId
  const getPatientData = (id: string) => {
    const patients = {
      'CLM-2024-1003': {
        patient: {
          name: 'Emily Rodriguez',
          patientId: 'PT-88293',
          dob: '03/15/1985',
          age: 39,
          gender: 'Female',
          address: '456 Oak Avenue, Suite 12',
          city: 'San Diego, CA 92101',
          phone: '(619) 555-0142',
          email: 'emily.rodriguez@email.com',
          insurance: {
            primary: {
              payer: 'Aetna',
              memberId: 'AET8829300456',
              groupNumber: 'GRP-455821',
              planType: 'PPO',
              effectiveDate: '01/01/24',
              status: 'Active'
            }
          }
        },
        claim: {
          id: 'CLM-2024-1003',
          accountNumber: 'ACC-2024-003',
          invoiceNumber: 'INV-2024-A0052',
          status: 'denied',
          dos: '10/13/24',
          submittedDate: '10/14/24',
          denialDate: '10/20/24',
          provider: 'Dr. Sarah Mitchell, MD',
          facility: 'City Medical Center',
          serviceType: 'Outpatient Surgery',
          billedAmount: 875.5,
          allowedAmount: 0,
          paidAmount: 0,
          balance: 875.5,
          denialCode: 'CO-197',
          denialReason: 'Precertification/authorization/notification absent',
          priority: 'high',
          daysOpen: 3,
          procedures: [
            { code: '29881', description: 'Arthroscopy, knee, surgical', amount: 675.5 },
            { code: '99213', description: 'Office visit, established patient', amount: 200.0 }
          ],
          diagnoses: [
            { code: 'M23.205', description: 'Derangement of medial meniscus, left knee' },
            { code: 'M25.562', description: 'Pain in left knee' }
          ]
        },
        claimHistory: [
          { date: '10/20/24', event: 'Claim Denied', user: 'System', detail: 'CO-197: Authorization absent' },
          { date: '10/18/24', event: 'Payer Received', user: 'System', detail: 'Claim acknowledged by Aetna' },
          { date: '10/14/24', event: 'Claim Submitted', user: 'Maria S.', detail: 'Electronic submission to payer' },
          { date: '10/13/24', event: 'Claim Created', user: 'John D.', detail: 'Initial claim entry' }
        ],
        aiAnalysis: {
          suggestedAction: 'Request retroactive authorization from Aetna. Include medical necessity documentation and surgeon\'s notes.',
          confidence: 88,
          predictedSuccess: 75,
          estimatedResolution: 15,
          category: 'Authorization',
          autoFixAvailable: false,
          appealRecommended: true,
          similarCases: 12,
          similarSuccessRate: 82
        }
      },
      'CLM-2024-1008': {
        patient: {
          name: 'James Wilson',
          patientId: 'PT-88298',
          dob: '07/22/1962',
          age: 62,
          gender: 'Male',
          address: '789 Maple Street',
          city: 'Phoenix, AZ 85001',
          phone: '(602) 555-0189',
          email: 'j.wilson@email.com',
          insurance: {
            primary: {
              payer: 'Aetna',
              memberId: 'AET8829800789',
              groupNumber: 'GRP-556782',
              planType: 'HMO',
              effectiveDate: '01/01/24',
              status: 'Active'
            }
          }
        },
        claim: {
          id: 'CLM-2024-1008',
          accountNumber: 'ACC-2024-008',
          invoiceNumber: 'INV-2024-A0098',
          status: 'denied',
          dos: '10/08/24',
          submittedDate: '10/09/24',
          denialDate: '10/18/24',
          provider: 'Dr. Michael Chen, MD',
          facility: 'Valley Heart Institute',
          serviceType: 'Diagnostic Cardiology',
          billedAmount: 1450.0,
          allowedAmount: 0,
          paidAmount: 0,
          balance: 1450.0,
          denialCode: 'CO-11',
          denialReason: 'Diagnosis inconsistent with procedure',
          priority: 'urgent',
          daysOpen: 5,
          procedures: [
            { code: '93000', description: 'Electrocardiogram (EKG), complete', amount: 125.0 },
            { code: '93306', description: 'Echocardiography, complete', amount: 825.0 },
            { code: '93015', description: 'Cardiovascular stress test', amount: 500.0 }
          ],
          diagnoses: [
            { code: 'I10', description: 'Essential hypertension' },
            { code: 'R00.1', description: 'Bradycardia, unspecified' }
          ]
        },
        claimHistory: [
          { date: '10/18/24', event: 'Claim Denied', user: 'System', detail: 'CO-11: Diagnosis inconsistent' },
          { date: '10/15/24', event: 'Under Review', user: 'System', detail: 'Payer reviewing claim' },
          { date: '10/09/24', event: 'Claim Submitted', user: 'Lisa T.', detail: 'Electronic submission' },
          { date: '10/08/24', event: 'Claim Created', user: 'Tom R.', detail: 'Initial claim entry' }
        ],
        aiAnalysis: {
          suggestedAction: 'Update diagnosis pointer to I48.91 (Atrial fibrillation) based on ECG findings. Add supporting documentation from physician notes.',
          confidence: 94,
          predictedSuccess: 89,
          estimatedResolution: 7,
          category: 'Coding Error',
          autoFixAvailable: true,
          appealRecommended: false,
          similarCases: 8,
          similarSuccessRate: 91
        }
      },
      // Default data for other claims
      'default': {
        patient: {
          name: 'Unknown Patient',
          patientId: 'PT-00000',
          dob: '01/01/1980',
          age: 44,
          gender: 'Unknown',
          address: 'N/A',
          city: 'N/A',
          phone: 'N/A',
          email: 'N/A',
          insurance: {
            primary: {
              payer: 'Unknown',
              memberId: 'N/A',
              groupNumber: 'N/A',
              planType: 'N/A',
              effectiveDate: 'N/A',
              status: 'Unknown'
            }
          }
        },
        claim: {
          id: claimId,
          accountNumber: 'ACC-0000',
          invoiceNumber: 'INV-0000',
          status: 'denied',
          dos: '10/01/24',
          submittedDate: '10/02/24',
          denialDate: '10/10/24',
          provider: 'Unknown Provider',
          facility: 'Unknown Facility',
          serviceType: 'Unknown',
          billedAmount: 0,
          allowedAmount: 0,
          paidAmount: 0,
          balance: 0,
          denialCode: 'N/A',
          denialReason: 'N/A',
          priority: 'medium',
          daysOpen: 0,
          procedures: [],
          diagnoses: []
        },
        claimHistory: [],
        aiAnalysis: {
          suggestedAction: 'Review claim details and contact payer for clarification.',
          confidence: 70,
          predictedSuccess: 60,
          estimatedResolution: 14,
          category: 'Unknown',
          autoFixAvailable: false,
          appealRecommended: false,
          similarCases: 0,
          similarSuccessRate: 0
        }
      }
    };

    return patients[claimId as keyof typeof patients] || patients['default'];
  };

  const data = getPatientData(claimId);
  const { patient, claim, claimHistory, aiAnalysis } = data;

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-[#62d5e4] text-white px-8 py-6 flex items-center justify-between rounded-t-lg flex-shrink-0">
          <div>
            <h2 className="text-xl flex items-center gap-2">
              <User className="w-6 h-6" />
              Patient & Claim Details
            </h2>
            <p className="text-sm opacity-90 mt-1">
              {patient.name} • {claim.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-red-700">Status</span>
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-lg font-medium text-red-900">Denied</p>
              <p className="text-xs text-red-600 mt-1">{claim.daysOpen} days open</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-orange-700">Balance</span>
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-lg font-medium text-orange-900">${claim.balance.toFixed(2)}</p>
              <p className="text-xs text-orange-600 mt-1">At risk</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-700">DOS</span>
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-lg font-medium text-blue-900">{claim.dos}</p>
              <p className="text-xs text-blue-600 mt-1">{claim.serviceType}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-700">Priority</span>
                <AlertTriangle className="w-5 h-5 text-purple-600" />
              </div>
              <Badge className={getPriorityColor(claim.priority)} variant="outline">
                {claim.priority.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* AI Analysis Banner */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200 mb-8">
            <div className="flex items-start gap-4">
              <Brain className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-purple-900">AI Analysis & Recommendation</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {aiAnalysis.confidence}% confidence
                    </span>
                    <span className="text-xs text-blue-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {aiAnalysis.predictedSuccess}% success rate
                    </span>
                    <span className="text-xs text-orange-600 flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      ~{aiAnalysis.estimatedResolution} days
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-900 mb-4">{aiAnalysis.suggestedAction}</p>
                <div className="flex items-center gap-3">
                  {aiAnalysis.autoFixAvailable && (
                    <Button size="sm" className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700">
                      <Zap className="w-4 h-4 mr-2" />
                      Apply Auto-Fix
                    </Button>
                  )}
                  {aiAnalysis.appealRecommended && (
                    <Button size="sm" className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700">
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Appeal
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ask AI Expert
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="patient">Patient Info</TabsTrigger>
              <TabsTrigger value="clinical">Clinical Details</TabsTrigger>
              <TabsTrigger value="history">Claim History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Claim Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#62d5e4]" />
                  Claim Information
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <span className="text-xs text-gray-500">Claim Number</span>
                    <p className="text-sm font-medium text-gray-900 font-mono">{claim.id}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Account Number</span>
                    <p className="text-sm font-medium text-gray-900">{claim.accountNumber}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Invoice Number</span>
                    <p className="text-sm font-medium text-gray-900">{claim.invoiceNumber}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Date of Service</span>
                    <p className="text-sm font-medium text-gray-900">{claim.dos}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Submitted Date</span>
                    <p className="text-sm font-medium text-gray-900">{claim.submittedDate}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Denial Date</span>
                    <p className="text-sm font-medium text-gray-900">{claim.denialDate}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Provider</span>
                    <p className="text-sm font-medium text-gray-900">{claim.provider}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Facility</span>
                    <p className="text-sm font-medium text-gray-900">{claim.facility}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Service Type</span>
                    <p className="text-sm font-medium text-gray-900">{claim.serviceType}</p>
                  </div>
                </div>
              </div>

              {/* Denial Information */}
              <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                <h3 className="text-sm font-medium text-red-900 mb-6 pb-3 border-b border-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Denial Information
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-xs text-red-700">Denial Code</span>
                    <p className="text-sm font-medium text-red-900 font-mono">{claim.denialCode}</p>
                  </div>
                  <div>
                    <span className="text-xs text-red-700">Category</span>
                    <p className="text-sm font-medium text-red-900">{aiAnalysis.category}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-red-700">Denial Reason</span>
                    <p className="text-sm font-medium text-red-900">{claim.denialReason}</p>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#62d5e4]" />
                  Financial Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Billed Amount</span>
                    <span className="text-sm font-medium text-gray-900">${claim.billedAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Allowed Amount</span>
                    <span className="text-sm font-medium text-gray-900">${claim.allowedAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Paid Amount</span>
                    <span className="text-sm font-medium text-gray-900">${claim.paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Balance Due</span>
                    <span className="text-lg font-medium text-red-600">${claim.balance.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Patient Info Tab */}
            <TabsContent value="patient" className="space-y-6 mt-6">
              {/* Demographics */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#62d5e4]" />
                  Patient Demographics
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-xs text-gray-500">Patient Name</span>
                    <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Patient ID</span>
                    <p className="text-sm font-medium text-gray-900 font-mono">{patient.patientId}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Date of Birth</span>
                    <p className="text-sm font-medium text-gray-900">{patient.dob}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Age</span>
                    <p className="text-sm font-medium text-gray-900">{patient.age} years</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Gender</span>
                    <p className="text-sm font-medium text-gray-900">{patient.gender}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-[#62d5e4]" />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-900">{patient.address}</p>
                      <p className="text-sm text-gray-600">{patient.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{patient.phone}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{patient.email}</p>
                  </div>
                </div>
              </div>

              {/* Insurance Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#62d5e4]" />
                  Primary Insurance
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-xs text-gray-500">Payer</span>
                    <p className="text-sm font-medium text-gray-900">{patient.insurance.primary.payer}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Member ID</span>
                    <p className="text-sm font-medium text-gray-900 font-mono">{patient.insurance.primary.memberId}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Group Number</span>
                    <p className="text-sm font-medium text-gray-900">{patient.insurance.primary.groupNumber}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Plan Type</span>
                    <p className="text-sm font-medium text-gray-900">{patient.insurance.primary.planType}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Effective Date</span>
                    <p className="text-sm font-medium text-gray-900">{patient.insurance.primary.effectiveDate}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Status</span>
                    <Badge className="bg-green-100 text-green-700" variant="secondary">
                      {patient.insurance.primary.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Clinical Details Tab */}
            <TabsContent value="clinical" className="space-y-6 mt-6">
              {/* Procedures */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-[#62d5e4]" />
                  Procedures
                </h3>
                <div className="space-y-4">
                  {claim.procedures.map((proc, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 font-mono">{proc.code}</p>
                        <p className="text-xs text-gray-600 mt-1">{proc.description}</p>
                      </div>
                      <span className="text-sm font-medium text-gray-900">${proc.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagnoses */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#62d5e4]" />
                  Diagnoses
                </h3>
                <div className="space-y-3">
                  {claim.diagnoses.map((diag, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 font-mono">{diag.code}</p>
                        <p className="text-xs text-gray-600 mt-1">{diag.description}</p>
                      </div>
                      {index === 0 && (
                        <Badge className="bg-blue-100 text-blue-700" variant="secondary">
                          Primary
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Claim History Tab */}
            <TabsContent value="history" className="space-y-6 mt-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#62d5e4]" />
                  Timeline
                </h3>
                <div className="space-y-4">
                  {claimHistory.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          {index === 0 ? (
                            <XCircle className="w-4 h-4 text-red-600" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        {index < claimHistory.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900">{item.event}</p>
                          <span className="text-xs text-gray-500">{item.date}</span>
                        </div>
                        <p className="text-xs text-gray-600">{item.detail}</p>
                        <p className="text-xs text-gray-500 mt-1">by {item.user}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Similar Cases */}
              {aiAnalysis.similarCases > 0 && (
                <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                  <h3 className="text-sm font-medium text-purple-900 mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    Similar Cases Analysis
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-purple-700">Similar Cases Found</span>
                      <p className="text-lg font-medium text-purple-900">{aiAnalysis.similarCases}</p>
                    </div>
                    <div>
                      <span className="text-xs text-purple-700">Success Rate</span>
                      <p className="text-lg font-medium text-green-600">{aiAnalysis.similarSuccessRate}%</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50 rounded-b-lg flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Upload Documents
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download Claim
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              className="bg-[#62d5e4] hover:bg-[#4fc5d4] text-white"
              onClick={() => {
                if (onOpenDenial) {
                  onOpenDenial(claim.id);
                }
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Open Denial Workspace
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
