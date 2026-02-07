import { useState, useEffect } from 'react';
import { 
  Download,
  Upload,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  DollarSign,
  Calendar,
  User,
  FileText,
  Activity,
  Target,
  Zap,
  Settings,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Clock,
  Info,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Building,
  CreditCard,
  Receipt,
  Gauge,
  Hash,
  Percent,
  History
} from 'lucide-react';

interface ERAFile {
  id: string;
  fileName: string;
  payer: string;
  checkNumber: string;
  checkDate: string;
  totalAmount: number;
  claimCount: number;
  dosRange: string;
  receivedDate: string;
  status: 'pending' | 'processing' | 'posted' | 'exception' | 'partial';
  processedBy?: string;
  processedDate?: string;
}

interface ClaimMatch {
  id: string;
  eraClaimId: string;
  claimNumber: string;
  patientName: string;
  icn: string;
  dateOfService: string;
  chargedAmount: number;
  allowedAmount: number;
  paidAmount: number;
  patientResponsibility: number;
  adjustments: Adjustment[];
  confidence: number;
  matchStatus: 'exact' | 'probable' | 'manual' | 'unmatched';
  exceptions: string[];
}

interface Adjustment {
  id: string;
  type: 'contractual' | 'copay' | 'coinsurance' | 'deductible' | 'takeback' | 'other';
  amount: number;
  reasonCode: string;
  remarkCode?: string;
  description: string;
}

interface PostingLine {
  id: string;
  serviceDate: string;
  procedureCode: string;
  chargedAmount: number;
  allowedAmount: number;
  paidAmount: number;
  patientResponsibility: {
    copay: number;
    coinsurance: number;
    deductible: number;
  };
  adjustments: Adjustment[];
  takebacks: number;
  writeOff: number;
  status: 'ready' | 'posted' | 'exception' | 'review';
}

interface Exception {
  id: string;
  type: 'partial_match' | 'missing_claim' | 'overpayment' | 'underpayment' | 'duplicate';
  severity: 'high' | 'medium' | 'low';
  description: string;
  eraClaimId: string;
  claimNumber?: string;
  amount: number;
  suggestedAction: string;
  createdDate: string;
}

interface Refund {
  id: string;
  type: 'payer' | 'patient';
  amount: number;
  reason: string;
  claimNumber: string;
  patientName: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'processed' | 'denied';
  processedBy?: string;
  notes?: string;
}

interface WriteOffRule {
  id: string;
  name: string;
  payer: string;
  conditions: {
    amountRange: { min: number; max: number };
    reasonCodes: string[];
    autoApply: boolean;
  };
  action: 'write_off' | 'review' | 'deny';
  enabled: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: 'era' | 'posting' | 'adjustment' | 'refund';
  entityId: string;
  details: string;
  amount?: number;
  user: string;
  timestamp: string;
  reversible: boolean;
}

export function ERAsPaymentPosting() {
  const [activeTab, setActiveTab] = useState('era-inbox');
  const [eraFiles, setERAFiles] = useState<ERAFile[]>([]);
  const [claimMatches, setClaimMatches] = useState<ClaimMatch[]>([]);
  const [postingLines, setPostingLines] = useState<PostingLine[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [writeOffRules, setWriteOffRules] = useState<WriteOffRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [selectedERA, setSelectedERA] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoPostEnabled, setAutoPostEnabled] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Sample data
  const sampleERAFiles: ERAFile[] = [
    {
      id: 'era-001',
      fileName: 'ERA_MEDICARE_20240120_001.835',
      payer: 'Medicare Part B',
      checkNumber: 'EFT240120001',
      checkDate: '2024-01-20',
      totalAmount: 45750.00,
      claimCount: 23,
      dosRange: '2024-01-15 - 2024-01-18',
      receivedDate: '2024-01-20 09:30:00',
      status: 'pending',
    },
    {
      id: 'era-002',
      fileName: 'ERA_BCBS_20240119_002.835',
      payer: 'Blue Cross Blue Shield',
      checkNumber: 'ACH240119002',
      checkDate: '2024-01-19',
      totalAmount: 32400.00,
      claimCount: 18,
      dosRange: '2024-01-12 - 2024-01-16',
      receivedDate: '2024-01-19 14:15:00',
      status: 'processing',
      processedBy: 'Lisa Rodriguez'
    },
    {
      id: 'era-003',
      fileName: 'ERA_AETNA_20240118_003.835',
      payer: 'Aetna',
      checkNumber: 'EFT240118003',
      checkDate: '2024-01-18',
      totalAmount: 28650.00,
      claimCount: 15,
      dosRange: '2024-01-10 - 2024-01-14',
      receivedDate: '2024-01-18 11:45:00',
      status: 'posted',
      processedBy: 'Mike Chen',
      processedDate: '2024-01-18 16:20:00'
    }
  ];

  const sampleClaimMatches: ClaimMatch[] = [
    {
      id: 'match-001',
      eraClaimId: 'era-001-claim-01',
      claimNumber: 'CLM240001',
      patientName: 'John Smith',
      icn: '1234567890123456',
      dateOfService: '2024-01-15',
      chargedAmount: 250.00,
      allowedAmount: 200.00,
      paidAmount: 160.00,
      patientResponsibility: 40.00,
      adjustments: [
        {
          id: 'adj-001',
          type: 'contractual',
          amount: 50.00,
          reasonCode: 'CO-45',
          description: 'Contractual adjustment'
        }
      ],
      confidence: 100,
      matchStatus: 'exact',
      exceptions: []
    },
    {
      id: 'match-002',
      eraClaimId: 'era-001-claim-02',
      claimNumber: 'CLM240002',
      patientName: 'Maria Garcia',
      icn: '2345678901234567',
      dateOfService: '2024-01-16',
      chargedAmount: 180.00,
      allowedAmount: 150.00,
      paidAmount: 120.00,
      patientResponsibility: 30.00,
      adjustments: [],
      confidence: 85,
      matchStatus: 'probable',
      exceptions: ['Different patient DOB']
    }
  ];

  const sampleExceptions: Exception[] = [
    {
      id: 'exc-001',
      type: 'partial_match',
      severity: 'medium',
      description: 'Claim found but patient details differ',
      eraClaimId: 'era-001-claim-05',
      claimNumber: 'CLM240005',
      amount: 320.00,
      suggestedAction: 'Review patient demographics',
      createdDate: '2024-01-20 10:15:00'
    },
    {
      id: 'exc-002',
      type: 'missing_claim',
      severity: 'high',
      description: 'No matching claim found in system',
      eraClaimId: 'era-001-claim-08',
      amount: 450.00,
      suggestedAction: 'Verify claim submission status',
      createdDate: '2024-01-20 10:20:00'
    }
  ];

  const sampleRefunds: Refund[] = [
    {
      id: 'ref-001',
      type: 'payer',
      amount: 150.00,
      reason: 'Duplicate payment received',
      claimNumber: 'CLM240003',
      patientName: 'Robert Wilson',
      requestDate: '2024-01-19',
      status: 'pending'
    },
    {
      id: 'ref-002',
      type: 'patient',
      amount: 45.00,
      reason: 'Overpayment - copay adjustment',
      claimNumber: 'CLM240007',
      patientName: 'Lisa Davis',
      requestDate: '2024-01-18',
      status: 'approved',
      processedBy: 'Jennifer Walsh'
    }
  ];

  useEffect(() => {
    setERAFiles(sampleERAFiles);
    setClaimMatches(sampleClaimMatches);
    setExceptions(sampleExceptions);
    setRefunds(sampleRefunds);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      posted: 'bg-green-100 text-green-800',
      exception: 'bg-red-100 text-red-800',
      partial: 'bg-orange-100 text-orange-800',
      exact: 'bg-green-100 text-green-800',
      probable: 'bg-yellow-100 text-yellow-800',
      manual: 'bg-blue-100 text-blue-800',
      unmatched: 'bg-red-100 text-red-800',
      ready: 'bg-cyan-100 text-cyan-800',
      review: 'bg-orange-100 text-orange-800',
      approved: 'bg-green-100 text-green-800',
      denied: 'bg-red-100 text-red-800'
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'posted':
      case 'exact':
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
      case 'processing':
      case 'probable':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'exception':
      case 'unmatched':
      case 'denied':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'partial':
      case 'review':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'ready':
        return <Activity className="w-4 h-4 text-cyan-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const processERA = (eraId: string) => {
    setLoading(true);
    
    setTimeout(() => {
      setERAFiles(prev => prev.map(era => 
        era.id === eraId 
          ? { ...era, status: 'processing' as const, processedBy: 'Current User' }
          : era
      ));
      setLoading(false);
    }, 2000);
  };

  const autoPostPayments = (eraId: string) => {
    setLoading(true);
    
    setTimeout(() => {
      setERAFiles(prev => prev.map(era => 
        era.id === eraId 
          ? { 
              ...era, 
              status: 'posted' as const, 
              processedBy: 'Auto-Post System',
              processedDate: new Date().toISOString()
            }
          : era
      ));
      
      // Add audit log entry
      const newAuditLog: AuditLog = {
        id: `audit-${Date.now()}`,
        action: 'Auto-posted ERA payments',
        entityType: 'era',
        entityId: eraId,
        details: 'Automatically posted all matching claims',
        amount: eraFiles.find(era => era.id === eraId)?.totalAmount,
        user: 'Auto-Post System',
        timestamp: new Date().toISOString(),
        reversible: true
      };
      
      setAuditLogs(prev => [newAuditLog, ...prev]);
      setLoading(false);
    }, 3000);
  };

  const reversePosting = (auditLogId: string) => {
    console.log('Reversing posting:', auditLogId);
    
    const newAuditLog: AuditLog = {
      id: `audit-${Date.now()}`,
      action: 'Reversed payment posting',
      entityType: 'era',
      entityId: auditLogId,
      details: 'Reversed previous posting due to error',
      user: 'Current User',
      timestamp: new Date().toISOString(),
      reversible: false
    };
    
    setAuditLogs(prev => [newAuditLog, ...prev]);
  };

  const resolveException = (exceptionId: string) => {
    setExceptions(prev => prev.filter(exc => exc.id !== exceptionId));
    console.log('Exception resolved:', exceptionId);
  };

  const processRefund = (refundId: string, action: 'approve' | 'deny') => {
    setRefunds(prev => prev.map(refund => 
      refund.id === refundId 
        ? { 
            ...refund, 
            status: action === 'approve' ? 'approved' as const : 'denied' as const,
            processedBy: 'Current User'
          }
        : refund
    ));
  };

  const importPatientPayments = () => {
    console.log('Importing patient payments from gateway...');
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      // Add new payment records
    }, 2000);
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col max-w-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">ERAs & Payment Posting</h1>
            <p className="text-sm text-gray-600 mt-1">
              Automate payment posting from Electronic Remittance Advice (835) files
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Auto-Post:</span>
              <button
                onClick={() => setAutoPostEnabled(!autoPostEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoPostEnabled ? 'bg-[#62d5e4]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoPostEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <button 
              onClick={importPatientPayments}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              Import Payments
            </button>
            
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors">
              <Upload className="w-4 h-4" />
              Upload ERA
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending ERAs</p>
                <p className="text-lg font-semibold text-gray-900">
                  {eraFiles.filter(era => era.status === 'pending').length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-lg font-semibold text-gray-900">
                  {eraFiles.filter(era => era.status === 'processing').length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Exceptions</p>
                <p className="text-lg font-semibold text-gray-900">
                  {exceptions.length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Refunds</p>
                <p className="text-lg font-semibold text-gray-900">
                  {refunds.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <RotateCcw className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Posted Today</p>
                <p className="text-lg font-semibold text-gray-900">
                  {eraFiles.filter(era => era.status === 'posted').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-8">
          {[
            { id: 'era-inbox', label: 'ERA Inbox', icon: FileText },
            { id: 'match-panel', label: 'Match Panel', icon: Target },
            { id: 'posting-grid', label: 'Posting Grid', icon: Receipt },
            { id: 'exceptions', label: 'Exceptions', icon: AlertTriangle },
            { id: 'refunds', label: 'Refunds', icon: RotateCcw },
            { id: 'audit-log', label: 'Audit Log', icon: History }
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
              {tab.id === 'exceptions' && exceptions.length > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                  {exceptions.length}
                </span>
              )}
              {tab.id === 'refunds' && refunds.filter(r => r.status === 'pending').length > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                  {refunds.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto p-4 max-h-96">
        {activeTab === 'era-inbox' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">ERA Files Awaiting Processing</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search ERA files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-y-auto max-h-80">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">File Name</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Payer</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Check Info</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Claims</th>
                      <th className="px-4 py-4 text-right text-sm font-semibold text-gray-900">Amount</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">DOS Range</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Received</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {eraFiles.map((era) => (
                      <tr key={era.id} className="h-16 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-mono text-sm font-medium text-gray-900">{era.fileName}</div>
                            <div className="text-xs text-gray-500">835 Format</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-900">{era.payer}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{era.checkNumber}</div>
                            <div className="text-xs text-gray-500">{era.checkDate}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-medium text-gray-900">{era.claimCount}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            ${era.totalAmount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-900">{era.dosRange}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {getStatusIcon(era.status)}
                            <span className={`inline-flex items-center h-7 px-3 rounded-full text-xs font-medium ${getStatusBadge(era.status)}`}>
                              {era.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">{era.receivedDate}</div>
                          {era.processedBy && (
                            <div className="text-xs text-gray-500">by {era.processedBy}</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => setSelectedERA(era.id)}
                              className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                              title="View details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            
                            {era.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => processERA(era.id)}
                                  disabled={loading}
                                  className="p-1.5 text-gray-400 hover:text-[#62d5e4] transition-colors disabled:opacity-50"
                                  title="Process ERA"
                                >
                                  <Play className="w-5 h-5" />
                                </button>
                                
                                {autoPostEnabled && (
                                  <button
                                    onClick={() => autoPostPayments(era.id)}
                                    disabled={loading}
                                    className="p-1 text-gray-400 hover:text-green-500 transition-colors disabled:opacity-50"
                                    title="Auto-post payments"
                                  >
                                    <Zap className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                            
                            <button
                              className="p-1 text-gray-400 hover:text-purple-500 transition-colors"
                              title="Download file"
                            >
                              <Download className="w-4 h-4" />
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
        )}

        {activeTab === 'match-panel' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Claim Matching</h2>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Settings className="w-4 h-4" />
                  Match Rules
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-[#62d5e4] border border-[#62d5e4] rounded-lg hover:bg-cyan-50 transition-colors">
                  <Target className="w-4 h-4" />
                  Auto-Match
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">ERA Claim</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Patient</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Match Details</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Confidence</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Amounts</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Exceptions</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {claimMatches.map((match) => (
                      <tr key={match.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-mono text-sm font-medium text-gray-900">{match.claimNumber}</div>
                            <div className="text-xs text-gray-500">ICN: {match.icn}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{match.patientName}</div>
                            <div className="text-xs text-gray-500">DOS: {match.dateOfService}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Charged:</span>
                              <span className="font-medium">${match.chargedAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Allowed:</span>
                              <span className="font-medium">${match.allowedAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Paid:</span>
                              <span className="font-medium text-green-600">${match.paidAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(match.confidence)}`}>
                              <Gauge className="w-3 h-3" />
                              {match.confidence}%
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="space-y-1 text-xs">
                            <div>
                              <span className="text-green-600 font-medium">+${match.paidAmount.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-orange-600">PR: ${match.patientResponsibility.toFixed(2)}</span>
                            </div>
                            {match.adjustments.length > 0 && (
                              <div>
                                <span className="text-red-600">Adj: ${match.adjustments.reduce((sum, adj) => sum + adj.amount, 0).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {getStatusIcon(match.matchStatus)}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(match.matchStatus)}`}>
                              {match.matchStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {match.exceptions.length > 0 ? (
                            <div className="space-y-1">
                              {match.exceptions.slice(0, 2).map((exception, index) => (
                                <div key={index} className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                  {exception}
                                </div>
                              ))}
                              {match.exceptions.length > 2 && (
                                <div className="text-xs text-gray-500">+{match.exceptions.length - 2} more</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-green-600">No issues</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                              title="Accept match"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              title="Reject match"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                              title="Manual review"
                            >
                              <Edit className="w-4 h-4" />
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
        )}

        {activeTab === 'posting-grid' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Payment Posting Grid</h2>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Settings className="w-4 h-4" />
                  Write-off Rules
                </button>
                <button 
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Receipt className="w-4 h-4" />
                  )}
                  Post All
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Posting Summary</h3>
                <div className="grid grid-cols-6 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-blue-600 font-medium">Total Allowed</div>
                    <div className="text-lg font-semibold text-blue-900">$8,450.00</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-green-600 font-medium">Paid Amount</div>
                    <div className="text-lg font-semibold text-green-900">$6,760.00</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-orange-600 font-medium">Patient Resp.</div>
                    <div className="text-lg font-semibold text-orange-900">$845.00</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-red-600 font-medium">Adjustments</div>
                    <div className="text-lg font-semibold text-red-900">$675.00</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-purple-600 font-medium">Write-offs</div>
                    <div className="text-lg font-semibold text-purple-900">$170.00</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-600 font-medium">Variance</div>
                    <div className="text-lg font-semibold text-gray-900">$0.00</div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">Code</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-900">Charged</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-900">Allowed</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-900">Paid</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-900">Patient Responsibility</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-900">Adjustments</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-900">Write-off</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-2">2024-01-15</td>
                      <td className="px-3 py-2 font-mono">99213</td>
                      <td className="px-3 py-2 text-right">$150.00</td>
                      <td className="px-3 py-2 text-right">$120.00</td>
                      <td className="px-3 py-2 text-right text-green-600 font-medium">$96.00</td>
                      <td className="px-3 py-2">
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          <div className="text-center">
                            <div className="text-gray-500">Copay</div>
                            <div className="font-medium">$20.00</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500">Coins</div>
                            <div className="font-medium">$4.00</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500">Deduct</div>
                            <div className="font-medium">$0.00</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between bg-red-50 px-2 py-1 rounded">
                            <span>CO-45</span>
                            <span className="font-medium">$30.00</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">$0.00</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Ready
                        </span>
                      </td>
                    </tr>
                    
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-2">2024-01-15</td>
                      <td className="px-3 py-2 font-mono">36415</td>
                      <td className="px-3 py-2 text-right">$25.00</td>
                      <td className="px-3 py-2 text-right">$18.00</td>
                      <td className="px-3 py-2 text-right text-green-600 font-medium">$18.00</td>
                      <td className="px-3 py-2">
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          <div className="text-center">
                            <div className="text-gray-500">Copay</div>
                            <div className="font-medium">$0.00</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500">Coins</div>
                            <div className="font-medium">$0.00</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500">Deduct</div>
                            <div className="font-medium">$0.00</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between bg-red-50 px-2 py-1 rounded">
                            <span>CO-45</span>
                            <span className="font-medium">$7.00</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">$0.00</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Ready
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'exceptions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Payment Exceptions</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {exceptions.map((exception) => (
                <div key={exception.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          exception.severity === 'high' ? 'bg-red-100 text-red-800' :
                          exception.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {exception.type.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          exception.severity === 'high' ? 'bg-red-100 text-red-800' :
                          exception.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {exception.severity} priority
                        </span>
                        <span className="text-sm text-gray-500">{exception.createdDate}</span>
                      </div>
                      
                      <h3 className="font-medium text-gray-900 mb-2">{exception.description}</h3>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">ERA Claim:</span>
                          <div className="font-mono">{exception.eraClaimId}</div>
                        </div>
                        {exception.claimNumber && (
                          <div>
                            <span className="text-gray-500">System Claim:</span>
                            <div className="font-mono">{exception.claimNumber}</div>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <div className="font-medium">${exception.amount.toFixed(2)}</div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-blue-900">Suggested Action</div>
                            <div className="text-sm text-blue-800">{exception.suggestedAction}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => resolveException(exception.id)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Resolve
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Edit className="w-4 h-4" />
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'refunds' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Refunds Queue</h2>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-[#62d5e4] border border-[#62d5e4] rounded-lg hover:bg-cyan-50 transition-colors">
                <Plus className="w-4 h-4" />
                New Refund
              </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Claim</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Patient</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Reason</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Requested</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {refunds.map((refund) => (
                      <tr key={refund.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            refund.type === 'payer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {refund.type === 'payer' ? 'Payer' : 'Patient'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-gray-900">{refund.claimNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{refund.patientName}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            ${refund.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{refund.reason}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {getStatusIcon(refund.status)}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(refund.status)}`}>
                              {refund.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{refund.requestDate}</div>
                          {refund.processedBy && (
                            <div className="text-xs text-gray-500">by {refund.processedBy}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {refund.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => processRefund(refund.id, 'approve')}
                                  className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                                  title="Approve refund"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => processRefund(refund.id, 'deny')}
                                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                  title="Deny refund"
                                >
                                  <X className="w-4 h-4" />
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
        )}

        {activeTab === 'audit-log' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Audit Log</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search audit logs..."
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Timestamp</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Action</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Entity</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Details</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">User</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{log.timestamp}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">{log.action}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-sm text-gray-900">{log.entityType}</span>
                            <div className="text-xs text-gray-500 font-mono">{log.entityId}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{log.details}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {log.amount && (
                            <span className="text-sm font-medium text-gray-900">
                              ${log.amount.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{log.user}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {log.reversible && (
                              <button
                                onClick={() => reversePosting(log.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Reverse posting"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
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
        )}
      </div>
    </div>
  );
}