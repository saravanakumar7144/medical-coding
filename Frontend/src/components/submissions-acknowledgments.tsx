import { useState, useEffect } from 'react';
import { 
  Send,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Play,
  Pause,
  Calendar,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  FileText,
  Activity,
  Zap,
  Settings,
  Bell,
  Mail,
  Slack,
  ChevronDown,
  ChevronRight,
  Plus,
  ArrowRight,
  History,
  Target,
  Users,
  Building,
  DollarSign,
  Hash,
  User,
  AlertCircle,
  Info,
  ExternalLink
} from 'lucide-react';

interface BatchItem {
  id: string;
  claimId: string;
  patientName: string;
  claimNumber: string;
  payer: string;
  chargeAmount: number;
  status: 'ready' | 'pending' | 'submitted' | 'acknowledged' | 'rejected';
  dateOfService: string;
}

interface Batch {
  id: string;
  name: string;
  payer: string;
  clearinghouse: string;
  createdDate: string;
  submittedDate?: string;
  status: 'building' | 'ready' | 'submitted' | 'acknowledged' | 'partial' | 'rejected';
  claimCount: number;
  totalAmount: number;
  items: BatchItem[];
  createdBy: string;
}

interface TransmissionLog {
  id: string;
  fileName: string;
  batchId: string;
  batchNumber: string;
  claimCount: number;
  totalAmount: number;
  transmissionTime: string;
  user: string;
  status: 'sent' | 'delivered' | 'acknowledged' | 'rejected' | 'error';
  clearinghouse: string;
  acknowledgmentTime?: string;
  errorMessage?: string;
}

interface AckStatus {
  id: string;
  claimId: string;
  claimNumber: string;
  patientName: string;
  batchId: string;
  transactionType: '999' | '277CA';
  status: 'accepted' | 'rejected' | 'pending';
  statusCode: string;
  statusDescription: string;
  errorField?: string;
  errorLine?: number;
  receivedDate: string;
  responseData: any;
}

interface ScheduledSubmission {
  id: string;
  name: string;
  payer: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  time: string;
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
}

export function SubmissionsAcknowledments() {
  const [activeTab, setActiveTab] = useState('batch-builder');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [transmissionLogs, setTransmissionLogs] = useState<TransmissionLog[]>([]);
  const [ackStatuses, setAckStatuses] = useState<AckStatus[]>([]);
  const [scheduledSubmissions, setScheduledSubmissions] = useState<ScheduledSubmission[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    payer: 'all',
    dateRange: 'all',
    clearinghouse: 'all'
  });

  // Sample data
  const sampleBatches: Batch[] = [
    {
      id: 'batch-001',
      name: 'Medicare Batch - Jan 20',
      payer: 'Medicare Part B',
      clearinghouse: 'Availity',
      createdDate: '2024-01-20',
      submittedDate: '2024-01-20',
      status: 'acknowledged',
      claimCount: 45,
      totalAmount: 67500.00,
      items: [],
      createdBy: 'Jennifer Walsh'
    },
    {
      id: 'batch-002',
      name: 'BCBS Batch - Jan 19',
      payer: 'Blue Cross Blue Shield',
      clearinghouse: 'Change Healthcare',
      createdDate: '2024-01-19',
      submittedDate: '2024-01-19',
      status: 'partial',
      claimCount: 32,
      totalAmount: 48750.00,
      items: [],
      createdBy: 'Mike Chen'
    },
    {
      id: 'batch-003',
      name: 'Aetna Batch - Building',
      payer: 'Aetna',
      clearinghouse: 'Availity',
      createdDate: '2024-01-21',
      status: 'building',
      claimCount: 18,
      totalAmount: 27300.00,
      items: [],
      createdBy: 'Lisa Rodriguez'
    }
  ];

  const sampleTransmissionLogs: TransmissionLog[] = [
    {
      id: 'trans-001',
      fileName: 'BATCH_001_20240120_143022.837',
      batchId: 'batch-001',
      batchNumber: 'B001-2024',
      claimCount: 45,
      totalAmount: 67500.00,
      transmissionTime: '2024-01-20 14:30:22',
      user: 'Jennifer Walsh',
      status: 'acknowledged',
      clearinghouse: 'Availity',
      acknowledgmentTime: '2024-01-20 15:45:10'
    },
    {
      id: 'trans-002',
      fileName: 'BATCH_002_20240119_091045.837',
      batchId: 'batch-002',
      batchNumber: 'B002-2024',
      claimCount: 32,
      totalAmount: 48750.00,
      transmissionTime: '2024-01-19 09:10:45',
      user: 'Mike Chen',
      status: 'acknowledged',
      clearinghouse: 'Change Healthcare',
      acknowledgmentTime: '2024-01-19 10:22:33'
    },
    {
      id: 'trans-003',
      fileName: 'BATCH_003_20240118_163011.837',
      batchId: 'batch-003',
      batchNumber: 'B003-2024',
      claimCount: 28,
      totalAmount: 42200.00,
      transmissionTime: '2024-01-18 16:30:11',
      user: 'Sarah Kim',
      status: 'rejected',
      clearinghouse: 'Availity',
      errorMessage: 'Invalid provider NPI in segment PRV'
    }
  ];

  const sampleAckStatuses: AckStatus[] = [
    {
      id: 'ack-001',
      claimId: 'CL-2024-001',
      claimNumber: 'CLM240001',
      patientName: 'John Smith',
      batchId: 'batch-001',
      transactionType: '999',
      status: 'accepted',
      statusCode: 'A1',
      statusDescription: 'Claim accepted for processing',
      receivedDate: '2024-01-20 15:45:10',
      responseData: {}
    },
    {
      id: 'ack-002',
      claimId: 'CL-2024-002',
      claimNumber: 'CLM240002',
      patientName: 'Maria Garcia',
      batchId: 'batch-002',
      transactionType: '277CA',
      status: 'rejected',
      statusCode: 'R1',
      statusDescription: 'Missing required field',
      errorField: 'SBR01',
      errorLine: 145,
      receivedDate: '2024-01-19 10:22:33',
      responseData: {}
    },
    {
      id: 'ack-003',
      claimId: 'CL-2024-003',
      claimNumber: 'CLM240003',
      patientName: 'Robert Wilson',
      batchId: 'batch-001',
      transactionType: '999',
      status: 'accepted',
      statusCode: 'A1',
      statusDescription: 'Claim accepted for processing',
      receivedDate: '2024-01-20 15:45:10',
      responseData: {}
    }
  ];

  const sampleScheduledSubmissions: ScheduledSubmission[] = [
    {
      id: 'sched-001',
      name: 'Medicare Daily Submission',
      payer: 'Medicare Part B',
      frequency: 'daily',
      time: '14:00',
      enabled: true,
      lastRun: '2024-01-20 14:00:00',
      nextRun: '2024-01-21 14:00:00'
    },
    {
      id: 'sched-002',
      name: 'Commercial Weekly Batch',
      payer: 'Blue Cross Blue Shield',
      frequency: 'weekly',
      time: '09:00',
      enabled: true,
      lastRun: '2024-01-19 09:00:00',
      nextRun: '2024-01-26 09:00:00'
    }
  ];

  useEffect(() => {
    setBatches(sampleBatches);
    setTransmissionLogs(sampleTransmissionLogs);
    setAckStatuses(sampleAckStatuses);
    setScheduledSubmissions(sampleScheduledSubmissions);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      building: 'bg-gray-100 text-gray-800',
      ready: 'bg-blue-100 text-blue-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      acknowledged: 'bg-green-100 text-green-800',
      partial: 'bg-orange-100 text-orange-800',
      rejected: 'bg-red-100 text-red-800',
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-cyan-100 text-cyan-800',
      error: 'bg-red-100 text-red-800',
      accepted: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'acknowledged':
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'building':
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'ready':
      case 'sent':
        return <Activity className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const submitBatch = (batchId: string) => {
    setLoading(true);
    
    setTimeout(() => {
      setBatches(prev => prev.map(batch => 
        batch.id === batchId 
          ? { ...batch, status: 'submitted' as const, submittedDate: new Date().toISOString().split('T')[0] }
          : batch
      ));
      setLoading(false);
      console.log('Batch submitted:', batchId);
    }, 2000);
  };

  const retryRejectedClaims = (batchId: string) => {
    console.log('Retrying rejected claims for batch:', batchId);
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      // Update status and create new transmission log entry
    }, 1500);
  };

  const openClaimWorkspace = (claimId: string, errorField?: string, errorLine?: number) => {
    console.log('Opening claim workspace:', claimId, 'Field:', errorField, 'Line:', errorLine);
    // This would navigate to the claim workspace with specific field/line highlighted
  };

  const createNewBatch = () => {
    const newBatch: Batch = {
      id: `batch-${Date.now()}`,
      name: `New Batch - ${new Date().toLocaleDateString()}`,
      payer: '',
      clearinghouse: '',
      createdDate: new Date().toISOString().split('T')[0],
      status: 'building',
      claimCount: 0,
      totalAmount: 0,
      items: [],
      createdBy: 'Current User'
    };
    
    setBatches(prev => [newBatch, ...prev]);
    setSelectedBatch(newBatch.id);
  };

  const sendWebhookNotification = (type: 'slack' | 'email', message: string) => {
    console.log(`Sending ${type} notification:`, message);
    // This would send actual webhook notifications
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Submissions & Acknowledgments</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage claim submissions and monitor EDI acknowledgments
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => sendWebhookNotification('slack', 'Test notification')}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Bell className="w-4 h-4" />
              Notifications
            </button>

            <button 
              onClick={createNewBatch}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Batch
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Submission</p>
                <p className="text-lg font-semibold text-gray-900">
                  {batches.filter(b => b.status === 'ready').length}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Awaiting Ack</p>
                <p className="text-lg font-semibold text-gray-900">
                  {transmissionLogs.filter(t => t.status === 'sent').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected Claims</p>
                <p className="text-lg font-semibold text-gray-900">
                  {ackStatuses.filter(a => a.status === 'rejected').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Claims Today</p>
                <p className="text-lg font-semibold text-gray-900">
                  {transmissionLogs.reduce((sum, log) => sum + log.claimCount, 0)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-8">
          {[
            { id: 'batch-builder', label: 'Batch Builder', icon: Package },
            { id: 'transmission-log', label: 'Transmission Log', icon: Send },
            { id: 'acknowledgments', label: 'Acknowledgments', icon: CheckCircle },
            { id: 'scheduled', label: 'Scheduled', icon: Calendar }
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
      <div className="flex-1 min-h-0 overflow-auto p-4">
        {activeTab === 'batch-builder' && (
          <div className="space-y-6">
            {/* Batch Building Controls */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-4">Batch Building Options</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent">
                    <option>Payer</option>
                    <option>Plan</option>
                    <option>Clearinghouse</option>
                    <option>Provider</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payer Filter</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent">
                    <option>All Payers</option>
                    <option>Medicare Part B</option>
                    <option>Blue Cross Blue Shield</option>
                    <option>Aetna</option>
                    <option>United Healthcare</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <button className="w-full px-4 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors">
                    Build Batches
                  </button>
                </div>
              </div>
            </div>

            {/* Batches List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Current Batches</h3>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto max-h-80">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Batch Name</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Payer</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Clearinghouse</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Claims</th>
                      <th className="px-4 py-4 text-right text-sm font-semibold text-gray-900">Amount</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Created</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {batches.slice(0, 8).map((batch) => (
                      <tr key={batch.id} className="h-16 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{batch.name}</div>
                            <div className="text-sm text-gray-500">ID: {batch.id}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-900">{batch.payer}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-900">{batch.clearinghouse}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-medium text-gray-900">{batch.claimCount}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            ${batch.totalAmount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {getStatusIcon(batch.status)}
                            <span className={`inline-flex items-center h-7 px-3 rounded-full text-xs font-medium ${getStatusBadge(batch.status)}`}>
                              {batch.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">{batch.createdDate}</div>
                          <div className="text-xs text-gray-500">by {batch.createdBy}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                              title="View details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {(batch.status === 'ready' || batch.status === 'building') && (
                              <button
                                onClick={() => submitBatch(batch.id)}
                                disabled={loading}
                                className="p-1.5 text-gray-400 hover:text-[#62d5e4] transition-colors disabled:opacity-50"
                                title="Submit batch"
                              >
                                <Send className="w-5 h-5" />
                              </button>
                            )}
                            {batch.status === 'rejected' && (
                              <button
                                onClick={() => retryRejectedClaims(batch.id)}
                                className="p-1.5 text-gray-400 hover:text-green-500 transition-colors"
                                title="Retry rejected"
                              >
                                <RefreshCw className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                              title="More actions"
                            >
                              <MoreHorizontal className="w-5 h-5" />
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

        {activeTab === 'transmission-log' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Transmission Log</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search transmissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Export Log
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">File Name</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Batch #</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Claims</th>
                      <th className="px-4 py-4 text-right text-sm font-semibold text-gray-900">Amount</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Transmitted</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">User</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transmissionLogs.map((log) => (
                      <tr key={log.id} className="h-16 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-mono text-sm text-gray-900">{log.fileName}</div>
                            <div className="text-xs text-gray-500">{log.clearinghouse}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-mono text-sm text-gray-900">{log.batchNumber}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-medium text-gray-900">{log.claimCount}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            ${log.totalAmount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">{log.transmissionTime}</div>
                          {log.acknowledgmentTime && (
                            <div className="text-xs text-green-600">Ack: {log.acknowledgmentTime}</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-900">{log.user}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {getStatusIcon(log.status)}
                            <span className={`inline-flex items-center h-7 px-3 rounded-full text-xs font-medium ${getStatusBadge(log.status)}`}>
                              {log.status}
                            </span>
                          </div>
                          {log.errorMessage && (
                            <div className="text-xs text-red-600 mt-1">{log.errorMessage}</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                              title="View transmission details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              className="p-1.5 text-gray-400 hover:text-green-500 transition-colors"
                              title="Download file"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                            {log.status === 'rejected' && (
                              <button
                                onClick={() => retryRejectedClaims(log.batchId)}
                                className="p-1.5 text-gray-400 hover:text-[#62d5e4] transition-colors"
                                title="Retry transmission"
                              >
                                <RefreshCw className="w-5 h-5" />
                              </button>
                            )}
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

        {activeTab === 'acknowledgments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Acknowledgment Status (999/277CA)</h2>
              <div className="flex items-center gap-2">
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
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Type</label>
                  <select className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white">
                    <option value="all">All Types</option>
                    <option value="999">999 - Functional Ack</option>
                    <option value="277CA">277CA - Claim Ack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                  <select className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white">
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rejected Only</label>
                  <input
                    type="checkbox"
                    className="mt-2 rounded border-gray-300 text-[#62d5e4] focus:ring-[#62d5e4]"
                  />
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Claim #</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Patient</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Type</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Code</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Description</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Error Field</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Received</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ackStatuses.map((ack) => (
                      <tr key={ack.id} className="h-16 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-mono text-sm font-medium text-gray-900">{ack.claimNumber}</div>
                            <div className="text-xs text-gray-500">Batch: {ack.batchId}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-900">{ack.patientName}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center h-6 px-2.5 rounded text-xs font-mono bg-blue-100 text-blue-800">
                            {ack.transactionType}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {getStatusIcon(ack.status)}
                            <span className={`inline-flex items-center h-7 px-3 rounded-full text-xs font-medium ${getStatusBadge(ack.status)}`}>
                              {ack.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-mono text-sm text-gray-900">{ack.statusCode}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-900">{ack.statusDescription}</span>
                        </td>
                        <td className="px-4 py-4">
                          {ack.errorField && (
                            <div>
                              <span className="font-mono text-sm text-red-600">{ack.errorField}</span>
                              {ack.errorLine && (
                                <div className="text-xs text-gray-500">Line: {ack.errorLine}</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-900">{ack.receivedDate}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => openClaimWorkspace(ack.claimId, ack.errorField, ack.errorLine)}
                              className="p-1.5 text-gray-400 hover:text-[#62d5e4] transition-colors"
                              title="Open in Claim Workspace"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </button>
                            <button
                              className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                              title="View response details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {ack.status === 'rejected' && (
                              <button
                                className="p-1.5 text-gray-400 hover:text-green-500 transition-colors"
                                title="Retry claim"
                              >
                                <RefreshCw className="w-5 h-5" />
                              </button>
                            )}
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

        {activeTab === 'scheduled' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Scheduled Submissions</h2>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-[#62d5e4] border border-[#62d5e4] rounded-lg hover:bg-cyan-50 transition-colors">
                <Plus className="w-4 h-4" />
                Add Schedule
              </button>
            </div>

            <div className="grid gap-4">
              {scheduledSubmissions.map((schedule) => (
                <div key={schedule.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">{schedule.name}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          schedule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {schedule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Payer:</span> {schedule.payer}
                        </div>
                        <div>
                          <span className="font-medium">Frequency:</span> {schedule.frequency}
                        </div>
                        <div>
                          <span className="font-medium">Time:</span> {schedule.time}
                        </div>
                        <div>
                          <span className="font-medium">Next Run:</span> {schedule.nextRun}
                        </div>
                      </div>
                      {schedule.lastRun && (
                        <div className="mt-2 text-xs text-gray-500">
                          Last run: {schedule.lastRun}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit schedule"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                        title="Run now"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-4">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Slack className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="font-medium text-gray-900">Slack Notifications</div>
                      <div className="text-sm text-gray-600">Send alerts to #claims-processing</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => sendWebhookNotification('slack', 'Test Slack notification')}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    Test
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">Email Notifications</div>
                      <div className="text-sm text-gray-600">Send to billing team</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => sendWebhookNotification('email', 'Test email notification')}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}