import { useState, useEffect } from 'react';
import { 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Send,
  FileText,
  Paperclip,
  Mail,
  Printer,
  Globe,
  Download,
  Upload,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Target,
  DollarSign,
  Building,
  User,
  Phone,
  MapPin,
  Signature,
  Copy,
  Save,
  History,
  Bell,
  Flag,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Settings,
  BookOpen,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Zap,
  Info,
  AlertCircle,
  Timer,
  Gauge
} from 'lucide-react';

interface Appeal {
  id: string;
  claimNumber: string;
  patientName: string;
  payer: string;
  denialDate: string;
  appealLevel: 1 | 2 | 3;
  dueDate: string;
  daysLeft: number;
  status: 'pending' | 'submitted' | 'under_review' | 'approved' | 'denied' | 'partial' | 'overdue';
  denialReason: string;
  carcCode: string;
  originalAmount: number;
  requestedAmount: number;
  approvedAmount?: number;
  paymentDelta?: number;
  priority: 'high' | 'medium' | 'low';
  assignedTo: string;
  submissionDate?: string;
  responseDate?: string;
  submissionMethod?: 'fax' | 'portal' | 'mail';
  artifacts: string[];
  notes: string;
}

interface AppealTemplate {
  id: string;
  name: string;
  payer: string;
  denialType: string;
  level: number;
  subject: string;
  content: string;
  mergeFields: string[];
  attachments: string[];
  successRate: number;
  avgDaysToResolve: number;
}

interface PayerContact {
  id: string;
  payer: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phone: string;
  fax: string;
  email: string;
  portalUrl?: string;
  contactPerson: string;
}

interface Artifact {
  id: string;
  appealId: string;
  name: string;
  type: 'medical_record' | 'lab_result' | 'letter' | 'documentation' | 'response';
  size: string;
  uploadDate: string;
  uploadedBy: string;
}

export function AppealsReconsiderations() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [templates, setTemplates] = useState<AppealTemplate[]>([]);
  const [payerContacts, setPayerContacts] = useState<PayerContact[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeTab, setActiveTab] = useState('queue');
  const [selectedAppeal, setSelectedAppeal] = useState<string | null>(null);
  const [showLetterBuilder, setShowLetterBuilder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  // Letter builder state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [letterContent, setLetterContent] = useState('');
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);
  const [submissionMethod, setSubmissionMethod] = useState<'fax' | 'portal' | 'mail'>('fax');

  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    payer: 'all',
    level: 'all',
    priority: 'all',
    dueDate: 'all'
  });

  // Sample data
  const sampleAppeals: Appeal[] = [
    {
      id: 'appeal-001',
      claimNumber: 'CLM240001',
      patientName: 'John Smith',
      payer: 'Medicare Part B',
      denialDate: '2024-01-10',
      appealLevel: 1,
      dueDate: '2024-02-09',
      daysLeft: 18,
      status: 'pending',
      denialReason: 'Medical necessity not established',
      carcCode: '197',
      originalAmount: 450.00,
      requestedAmount: 450.00,
      priority: 'high',
      assignedTo: 'Sarah Johnson',
      artifacts: ['medical-record-001', 'physician-notes-001'],
      notes: 'Requires additional documentation from physician'
    },
    {
      id: 'appeal-002',
      claimNumber: 'CLM240002',
      patientName: 'Maria Garcia',
      payer: 'Blue Cross Blue Shield',
      denialDate: '2024-01-05',
      appealLevel: 2,
      dueDate: '2024-01-25',
      daysLeft: 3,
      status: 'submitted',
      denialReason: 'Procedure not covered',
      carcCode: '167',
      originalAmount: 1250.00,
      requestedAmount: 1250.00,
      priority: 'high',
      assignedTo: 'Mike Chen',
      submissionDate: '2024-01-20',
      submissionMethod: 'portal',
      artifacts: ['appeal-letter-002', 'medical-record-002'],
      notes: 'Second level appeal submitted via payer portal'
    },
    {
      id: 'appeal-003',
      claimNumber: 'CLM240003',
      patientName: 'Robert Wilson',
      payer: 'Aetna',
      denialDate: '2023-12-15',
      appealLevel: 1,
      dueDate: '2024-01-14',
      daysLeft: -8,
      status: 'overdue',
      denialReason: 'Insufficient documentation',
      carcCode: '16',
      originalAmount: 350.00,
      requestedAmount: 350.00,
      priority: 'high',
      assignedTo: 'Lisa Rodriguez',
      artifacts: ['medical-record-003'],
      notes: 'Appeal overdue - needs immediate attention'
    }
  ];

  const sampleTemplates: AppealTemplate[] = [
    {
      id: 'template-001',
      name: 'Medicare Medical Necessity Appeal',
      payer: 'Medicare Part B',
      denialType: 'Medical Necessity',
      level: 1,
      subject: 'First Level Appeal - Medical Necessity Review',
      content: `Dear Appeals Review Team,

I am writing to formally request a first-level appeal for the above-referenced claim. The service was denied based on medical necessity concerns, however, I believe this determination was made in error.

Patient: \{PATIENT_NAME\}
Date of Service: \{SERVICE_DATE\}
Procedure Code: \{PROCEDURE_CODE\}
Diagnosis: \{DIAGNOSIS_CODE\}

\{CLINICAL_NOTES\}

The medical documentation clearly supports the medical necessity of this service. Please find attached supporting documentation including medical records and physician notes.

I respectfully request that you reverse this denial and process payment for the full amount of $\{CLAIM_AMOUNT\}.

Sincerely,
\{PROVIDER_NAME\}
\{PROVIDER_TITLE\}`,
      mergeFields: ['PATIENT_NAME', 'SERVICE_DATE', 'PROCEDURE_CODE', 'DIAGNOSIS_CODE', 'CLINICAL_NOTES', 'CLAIM_AMOUNT', 'PROVIDER_NAME', 'PROVIDER_TITLE'],
      attachments: ['medical_record', 'physician_notes'],
      successRate: 78,
      avgDaysToResolve: 45
    },
    {
      id: 'template-002',
      name: 'Commercial Coverage Appeal',
      payer: 'Blue Cross Blue Shield',
      denialType: 'Coverage',
      level: 1,
      subject: 'Appeal for Coverage Determination',
      content: `Dear Claims Review Department,

I am submitting this formal appeal regarding the denial of coverage for the referenced claim. Based on the patient's policy benefits and medical necessity, this service should be covered.

Claim Details:
- Patient: {{PATIENT_NAME}}
- Member ID: {{MEMBER_ID}}
- Date of Service: {{SERVICE_DATE}}
- Procedure: {{PROCEDURE_CODE}} - {{PROCEDURE_DESCRIPTION}}

{{MEDICAL_JUSTIFICATION}}

Please review the attached clinical documentation and reconsider this coverage determination.

Best regards,
{{PROVIDER_SIGNATURE}}`,
      mergeFields: ['PATIENT_NAME', 'MEMBER_ID', 'SERVICE_DATE', 'PROCEDURE_CODE', 'PROCEDURE_DESCRIPTION', 'MEDICAL_JUSTIFICATION', 'PROVIDER_SIGNATURE'],
      attachments: ['policy_documentation', 'medical_record'],
      successRate: 65,
      avgDaysToResolve: 30
    }
  ];

  const samplePayerContacts: PayerContact[] = [
    {
      id: 'contact-001',
      payer: 'Medicare Part B',
      name: 'Medicare Appeals Department',
      address: {
        street: '123 Medicare Blvd',
        city: 'Baltimore',
        state: 'MD',
        zip: '21244'
      },
      phone: '1-800-MEDICARE',
      fax: '410-555-0123',
      email: 'appeals@medicare.gov',
      contactPerson: 'Appeals Coordinator'
    },
    {
      id: 'contact-002',
      payer: 'Blue Cross Blue Shield',
      name: 'BCBS Appeals Review',
      address: {
        street: '456 Insurance Way',
        city: 'Chicago',
        state: 'IL',
        zip: '60601'
      },
      phone: '1-800-BCBS-APP',
      fax: '312-555-0456',
      email: 'appeals@bcbs.com',
      portalUrl: 'https://provider.bcbs.com/appeals',
      contactPerson: 'Review Manager'
    }
  ];

  useEffect(() => {
    setAppeals(sampleAppeals);
    setTemplates(sampleTemplates);
    setPayerContacts(samplePayerContacts);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      denied: 'bg-red-100 text-red-800',
      partial: 'bg-orange-100 text-orange-800',
      overdue: 'bg-red-100 text-red-800'
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    
    return priorityMap[priority as keyof typeof priorityMap] || priorityMap.medium;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'denied':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'under_review':
        return <Eye className="w-4 h-4 text-purple-500" />;
      case 'submitted':
        return <Send className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getDaysLeftColor = (daysLeft: number) => {
    if (daysLeft < 0) return 'text-red-600';
    if (daysLeft <= 7) return 'text-orange-600';
    if (daysLeft <= 14) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getSLAMeterColor = (daysLeft: number, totalDays: number = 30) => {
    const percentage = (daysLeft / totalDays) * 100;
    if (percentage < 0) return 'bg-red-500';
    if (percentage <= 25) return 'bg-orange-500';
    if (percentage <= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const submitAppeal = (appealId: string) => {
    setLoading(true);
    
    setTimeout(() => {
      setAppeals(prev => prev.map(appeal => 
        appeal.id === appealId 
          ? { 
              ...appeal, 
              status: 'submitted' as const, 
              submissionDate: new Date().toISOString().split('T')[0],
              submissionMethod
            }
          : appeal
      ));
      setLoading(false);
      setShowLetterBuilder(false);
    }, 2000);
  };

  const updateOutcome = (appealId: string, outcome: 'approved' | 'denied' | 'partial', amount?: number) => {
    setAppeals(prev => prev.map(appeal => 
      appeal.id === appealId 
        ? { 
            ...appeal, 
            status: outcome,
            approvedAmount: amount,
            paymentDelta: amount ? amount - appeal.originalAmount : undefined,
            responseDate: new Date().toISOString().split('T')[0]
          }
        : appeal
    ));
  };

  const mergeLetter = (template: AppealTemplate, appeal: Appeal) => {
    let content = template.content;
    
    // Sample merge field replacements
    const mergeData = {
      'PATIENT_NAME': appeal.patientName,
      'SERVICE_DATE': '2024-01-15',
      'PROCEDURE_CODE': '99213',
      'DIAGNOSIS_CODE': 'Z00.00',
      'CLINICAL_NOTES': 'Patient presented with symptoms requiring comprehensive evaluation.',
      'CLAIM_AMOUNT': appeal.requestedAmount.toString(),
      'PROVIDER_NAME': 'Dr. Sarah Johnson',
      'PROVIDER_TITLE': 'Primary Care Physician',
      'MEMBER_ID': '123456789',
      'PROCEDURE_DESCRIPTION': 'Office visit, established patient',
      'MEDICAL_JUSTIFICATION': 'Service was medically necessary based on patient condition.',
      'PROVIDER_SIGNATURE': 'Dr. Sarah Johnson, MD'
    };

    template.mergeFields.forEach(field => {
      const regex = new RegExp(`{{${field}}}`, 'g');
      content = content.replace(regex, mergeData[field as keyof typeof mergeData] || `[${field}]`);
    });

    return content;
  };

  const filteredAppeals = appeals.filter(appeal => {
    const matchesSearch = appeal.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         appeal.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         appeal.payer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || appeal.status === filters.status;
    const matchesPayer = filters.payer === 'all' || appeal.payer === filters.payer;
    const matchesLevel = filters.level === 'all' || appeal.appealLevel.toString() === filters.level;
    const matchesPriority = filters.priority === 'all' || appeal.priority === filters.priority;
    
    return matchesSearch && matchesStatus && matchesPayer && matchesLevel && matchesPriority;
  });

  const appeal = selectedAppeal ? appeals.find(a => a.id === selectedAppeal) : null;
  const payerContact = appeal ? payerContacts.find(p => p.payer === appeal.payer) : null;

  return (
    <div className="h-full bg-gray-50 flex flex-col max-w-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Appeals & Reconsiderations</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage appeal lifecycle with automated deadline tracking and letter generation
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Bell className="w-4 h-4" />
              Reminders
            </button>
            
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <BookOpen className="w-4 h-4" />
              Templates
            </button>
            
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors">
              <Plus className="w-4 h-4" />
              New Appeal
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Appeals</p>
                <p className="text-lg font-semibold text-gray-900">{appeals.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Due This Week</p>
                <p className="text-lg font-semibold text-gray-900">
                  {appeals.filter(a => a.daysLeft <= 7 && a.daysLeft > 0).length}
                </p>
              </div>
              <Timer className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-lg font-semibold text-gray-900">
                  {appeals.filter(a => a.status === 'overdue').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-lg font-semibold text-gray-900">73%</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Value at Risk</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${appeals.reduce((sum, a) => sum + a.requestedAmount, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-8">
          {[
            { id: 'queue', label: 'Appeal Queue', icon: FileText },
            { id: 'letter-builder', label: 'Letter Builder', icon: Edit },
            { id: 'outcome-tracking', label: 'Outcome Tracking', icon: BarChart3 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-[#62d5e4] text-[#62d5e4]'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto max-h-96">
        {activeTab === 'queue' && (
          <div className="p-4">
            {/* Search and Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search appeals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                />
              </div>
              
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payer</label>
                  <select
                    value={filters.payer}
                    onChange={(e) => setFilters(prev => ({ ...prev, payer: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
                  >
                    <option value="all">All Payers</option>
                    <option value="Medicare Part B">Medicare Part B</option>
                    <option value="Blue Cross Blue Shield">BCBS</option>
                    <option value="Aetna">Aetna</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Level</label>
                  <select
                    value={filters.level}
                    onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
                  >
                    <option value="all">All Levels</option>
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                  <select className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white">
                    <option value="all">All Dates</option>
                    <option value="overdue">Overdue</option>
                    <option value="this_week">This Week</option>
                    <option value="next_week">Next Week</option>
                  </select>
                </div>
              </div>
            )}

            {/* Appeals Grid */}
            <div className="grid gap-4">
              {filteredAppeals.slice(0, 6).map((appeal) => (
                <div key={appeal.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-mono text-lg font-semibold text-gray-900">{appeal.claimNumber}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(appeal.status)}`}>
                          {appeal.status.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(appeal.priority)}`}>
                          {appeal.priority} priority
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Level {appeal.appealLevel}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-gray-500">Patient:</span>
                          <div className="font-medium">{appeal.patientName}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Payer:</span>
                          <div className="font-medium">{appeal.payer}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Assigned To:</span>
                          <div className="font-medium">{appeal.assignedTo}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Amount:</span>
                          <div className="font-medium">${appeal.requestedAmount.toFixed(2)}</div>
                        </div>
                      </div>

                      {/* SLA Meter */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Deadline Progress</span>
                          <span className={`text-sm font-medium ${getDaysLeftColor(appeal.daysLeft)}`}>
                            {appeal.daysLeft > 0 ? `${appeal.daysLeft} days left` : 
                             appeal.daysLeft === 0 ? 'Due today' : 
                             `${Math.abs(appeal.daysLeft)} days overdue`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${getSLAMeterColor(appeal.daysLeft)}`}
                            style={{ 
                              width: `${Math.max(0, Math.min(100, (appeal.daysLeft / 30) * 100))}%` 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Filed: {appeal.denialDate}</span>
                          <span>Due: {appeal.dueDate}</span>
                        </div>
                      </div>

                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-orange-900">Denial Reason</div>
                            <div className="text-sm text-orange-800">{appeal.denialReason}</div>
                            <div className="text-xs text-orange-600 mt-1">CARC: {appeal.carcCode}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedAppeal(appeal.id);
                          setShowLetterBuilder(true);
                          setActiveTab('letter-builder');
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Write Appeal
                      </button>
                      
                      <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>

                      {appeal.artifacts.length > 0 && (
                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <Paperclip className="w-4 h-4" />
                          Artifacts ({appeal.artifacts.length})
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'letter-builder' && (
          <div className="p-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Left Panel - Template Selection */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Letter Templates</h3>
                
                {appeal && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">Selected Appeal</div>
                    <div className="text-sm text-blue-800">{appeal.claimNumber} - {appeal.patientName}</div>
                    <div className="text-xs text-blue-600">{appeal.payer} | Level {appeal.appealLevel}</div>
                  </div>
                )}

                <div className="space-y-3">
                  {templates
                    .filter(t => !appeal || t.payer === appeal.payer || t.payer === 'Generic')
                    .map((template) => (
                    <div
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        if (appeal) {
                          setLetterContent(mergeLetter(template, appeal));
                        }
                      }}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate === template.id
                          ? 'border-[#62d5e4] bg-cyan-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-600">{template.payer} | Level {template.level}</div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Success: {template.successRate}%</span>
                        <span>Avg: {template.avgDaysToResolve} days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Center Panel - Letter Content */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Letter Content</h3>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Payer Address */}
                {payerContact && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-900">{payerContact.name}</div>
                    <div className="text-sm text-gray-600">
                      {payerContact.address.street}<br/>
                      {payerContact.address.city}, {payerContact.address.state} {payerContact.address.zip}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>📞 {payerContact.phone}</span>
                      <span>📠 {payerContact.fax}</span>
                    </div>
                  </div>
                )}

                <textarea
                  value={letterContent}
                  onChange={(e) => setLetterContent(e.target.value)}
                  placeholder="Select a template to start writing your appeal letter..."
                  className="w-full h-96 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent resize-none"
                />

                {/* Signature */}
                <div className="mt-4 p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Signature className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Electronic Signature</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Dr. Sarah Johnson, MD<br/>
                    Primary Care Physician<br/>
                    NPI: 1234567890
                  </div>
                </div>
              </div>

              {/* Right Panel - Attachments & Submission */}
              <div className="space-y-4">
                {/* Attachments */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Attachments</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <input type="checkbox" className="rounded" />
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Medical Records</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <input type="checkbox" className="rounded" />
                      <FileText className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Lab Results</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <input type="checkbox" className="rounded" />
                      <FileText className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">Physician Notes</span>
                    </div>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload Attachment
                  </button>
                </div>

                {/* Submission Method */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Submission Method</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="submission"
                        value="fax"
                        checked={submissionMethod === 'fax'}
                        onChange={(e) => setSubmissionMethod(e.target.value as 'fax')}
                        className="text-[#62d5e4] focus:ring-[#62d5e4]"
                      />
                      <Printer className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium">Fax</div>
                        <div className="text-sm text-gray-500">Send via fax ({payerContact?.fax})</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="submission"
                        value="portal"
                        checked={submissionMethod === 'portal'}
                        onChange={(e) => setSubmissionMethod(e.target.value as 'portal')}
                        className="text-[#62d5e4] focus:ring-[#62d5e4]"
                      />
                      <Globe className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium">Online Portal</div>
                        <div className="text-sm text-gray-500">Submit through payer portal</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="submission"
                        value="mail"
                        checked={submissionMethod === 'mail'}
                        onChange={(e) => setSubmissionMethod(e.target.value as 'mail')}
                        className="text-[#62d5e4] focus:ring-[#62d5e4]"
                      />
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium">Mail</div>
                        <div className="text-sm text-gray-500">Send via postal mail</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={() => appeal && submitAppeal(appeal.id)}
                  disabled={!appeal || !letterContent || loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit Appeal
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'outcome-tracking' && (
          <div className="p-6">
            <div className="grid gap-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Submitted</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {appeals.filter(a => ['submitted', 'under_review', 'approved', 'denied', 'partial'].includes(a.status)).length}
                      </p>
                    </div>
                    <Send className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Approved</p>
                      <p className="text-2xl font-semibold text-green-600">
                        {appeals.filter(a => a.status === 'approved').length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Denied</p>
                      <p className="text-2xl font-semibold text-red-600">
                        {appeals.filter(a => a.status === 'denied').length}
                      </p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Recovery Amount</p>
                      <p className="text-2xl font-semibold text-green-600">
                        ${appeals
                          .filter(a => a.approvedAmount)
                          .reduce((sum, a) => sum + (a.approvedAmount || 0), 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              </div>

              {/* Outcome Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Appeal Outcomes</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Claim</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Patient</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Payer</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Level</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Original</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Approved</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Delta</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Outcome</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Response Date</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {appeals
                        .filter(a => ['submitted', 'under_review', 'approved', 'denied', 'partial'].includes(a.status))
                        .map((appeal) => (
                        <tr key={appeal.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-mono font-medium text-gray-900">{appeal.claimNumber}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{appeal.patientName}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{appeal.payer}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Level {appeal.appealLevel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium text-gray-900">
                              ${appeal.originalAmount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {appeal.approvedAmount ? `$${appeal.approvedAmount.toFixed(2)}` : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {appeal.paymentDelta !== undefined && (
                              <span className={`text-sm font-medium ${
                                appeal.paymentDelta > 0 ? 'text-green-600' : 
                                appeal.paymentDelta < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {appeal.paymentDelta > 0 ? '+' : ''}${appeal.paymentDelta.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              {getStatusIcon(appeal.status)}
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(appeal.status)}`}>
                                {appeal.status.replace('_', ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">
                              {appeal.responseDate || 'Pending'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              {appeal.status === 'under_review' && (
                                <>
                                  <button
                                    onClick={() => updateOutcome(appeal.id, 'approved', appeal.requestedAmount)}
                                    className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                                    title="Mark as approved"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => updateOutcome(appeal.id, 'denied')}
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Mark as denied"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => updateOutcome(appeal.id, 'partial', appeal.requestedAmount * 0.5)}
                                    className="p-1 text-gray-400 hover:text-orange-500 transition-colors"
                                    title="Mark as partial"
                                  >
                                    <AlertTriangle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}