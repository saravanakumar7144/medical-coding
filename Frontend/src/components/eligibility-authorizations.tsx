import { useState, useEffect } from 'react';
import { 
  Search,
  Plus,
  RefreshCw,
  Download,
  Upload,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Filter,
  MoreHorizontal,
  User,
  Shield,
  FileText,
  DollarSign,
  Activity,
  Target,
  Send,
  History,
  AlertCircle,
  Info,
  Settings,
  ChevronDown,
  ChevronRight,
  Star,
  Zap
} from 'lucide-react';

interface EligibilityInquiry {
  id: string;
  patientName: string;
  patientId: string;
  memberId: string;
  payer: string;
  requestDate: string;
  responseDate?: string;
  status: 'pending' | 'active' | 'inactive' | 'cancelled' | 'error';
  coverage: {
    active: boolean;
    effectiveDate: string;
    terminationDate?: string;
    planName: string;
    planType: string;
  };
  benefits: {
    copay: number;
    coinsurance: number;
    deductible: number;
    deductibleMet: number;
    outOfPocketMax: number;
    outOfPocketMet: number;
  };
  responsePayload: any;
  linkedClaimId?: string;
}

interface PriorAuthorization {
  id: string;
  authNumber: string;
  patientName: string;
  patientId: string;
  payer: string;
  linkedCodes: string[];
  codeDescriptions: string[];
  status: 'pending' | 'approved' | 'denied' | 'expired' | 'cancelled';
  requestDate: string;
  approvedDate?: string;
  validFrom: string;
  validTo: string;
  units?: number;
  notes: string;
  attachments: string[];
  requestedBy: string;
  priority: 'routine' | 'urgent' | 'stat';
}

export function EligibilityAuthorizations() {
  const [activeTab, setActiveTab] = useState('eligibility');
  const [eligibilityData, setEligibilityData] = useState<EligibilityInquiry[]>([]);
  const [authorizationData, setAuthorizationData] = useState<PriorAuthorization[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    payer: 'all',
    dateRange: 'all',
    expiringOnly: false
  });

  // Sample data
  const sampleEligibilityData: EligibilityInquiry[] = [
    {
      id: 'elig-001',
      patientName: 'John Smith',
      patientId: 'P-2024-001',
      memberId: '1AB2C3D4EF5',
      payer: 'Medicare Part B',
      requestDate: '2024-01-20',
      responseDate: '2024-01-20',
      status: 'active',
      coverage: {
        active: true,
        effectiveDate: '2024-01-01',
        planName: 'Medicare Traditional',
        planType: 'Medicare'
      },
      benefits: {
        copay: 20,
        coinsurance: 20,
        deductible: 250,
        deductibleMet: 150,
        outOfPocketMax: 2000,
        outOfPocketMet: 300
      },
      responsePayload: {},
      linkedClaimId: 'CL-2024-001'
    },
    {
      id: 'elig-002',
      patientName: 'Maria Garcia',
      patientId: 'P-2024-002',
      memberId: '2BC3D4E5FG6',
      payer: 'Blue Cross Blue Shield',
      requestDate: '2024-01-19',
      responseDate: '2024-01-19',
      status: 'active',
      coverage: {
        active: true,
        effectiveDate: '2024-01-01',
        planName: 'BCBS PPO Plus',
        planType: 'Commercial PPO'
      },
      benefits: {
        copay: 30,
        coinsurance: 10,
        deductible: 1000,
        deductibleMet: 500,
        outOfPocketMax: 5000,
        outOfPocketMet: 800
      },
      responsePayload: {},
      linkedClaimId: 'CL-2024-002'
    },
    {
      id: 'elig-003',
      patientName: 'Robert Wilson',
      patientId: 'P-2024-003',
      memberId: '3CD4E5F6GH7',
      payer: 'Aetna',
      requestDate: '2024-01-18',
      status: 'pending',
      coverage: {
        active: false,
        effectiveDate: '2024-01-01',
        planName: 'Aetna HMO',
        planType: 'Commercial HMO'
      },
      benefits: {
        copay: 25,
        coinsurance: 15,
        deductible: 750,
        deductibleMet: 0,
        outOfPocketMax: 3000,
        outOfPocketMet: 0
      },
      responsePayload: {}
    }
  ];

  const sampleAuthorizationData: PriorAuthorization[] = [
    {
      id: 'auth-001',
      authNumber: 'AUTH-2024-001',
      patientName: 'Lisa Davis',
      patientId: 'P-2024-004',
      payer: 'United Healthcare',
      linkedCodes: ['99215', '93000'],
      codeDescriptions: ['Office visit level 5', 'Electrocardiogram'],
      status: 'approved',
      requestDate: '2024-01-15',
      approvedDate: '2024-01-16',
      validFrom: '2024-01-16',
      validTo: '2024-04-16',
      units: 2,
      notes: 'Approved for comprehensive cardiac evaluation',
      attachments: ['ecg-results.pdf', 'physician-notes.pdf'],
      requestedBy: 'Dr. Sarah Johnson',
      priority: 'routine'
    },
    {
      id: 'auth-002',
      authNumber: 'AUTH-2024-002',
      patientName: 'James Brown',
      patientId: 'P-2024-005',
      payer: 'Cigna',
      linkedCodes: ['73721', '73722'],
      codeDescriptions: ['MRI knee w/o contrast', 'MRI knee w/ contrast'],
      status: 'pending',
      requestDate: '2024-01-20',
      validFrom: '2024-01-25',
      validTo: '2024-07-25',
      units: 1,
      notes: 'Pre-surgical evaluation for knee replacement',
      attachments: ['x-ray-results.pdf'],
      requestedBy: 'Dr. Michael Chen',
      priority: 'urgent'
    },
    {
      id: 'auth-003',
      authNumber: 'AUTH-2024-003',
      patientName: 'Sarah Johnson',
      patientId: 'P-2024-006',
      payer: 'Medicare Part B',
      linkedCodes: ['80061'],
      codeDescriptions: ['Lipid panel'],
      status: 'expired',
      requestDate: '2023-12-01',
      approvedDate: '2023-12-02',
      validFrom: '2023-12-02',
      validTo: '2024-01-15',
      units: 4,
      notes: 'Quarterly monitoring for diabetes',
      attachments: [],
      requestedBy: 'Dr. Jennifer Walsh',
      priority: 'routine'
    }
  ];

  useEffect(() => {
    setEligibilityData(sampleEligibilityData);
    setAuthorizationData(sampleAuthorizationData);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      approved: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      denied: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800',
      error: 'bg-red-100 text-red-800'
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'denied':
      case 'cancelled':
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    const colorMap = {
      stat: 'text-red-600',
      urgent: 'text-orange-600',
      routine: 'text-green-600'
    };
    
    return colorMap[priority as keyof typeof colorMap] || colorMap.routine;
  };

  const isExpiringSoon = (validTo: string) => {
    const expiryDate = new Date(validTo);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (validTo: string) => {
    const expiryDate = new Date(validTo);
    const today = new Date();
    return expiryDate < today;
  };

  const runEligibilityCheck = (patientData?: any) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      console.log('Eligibility check completed');
      // Update eligibility data
    }, 2000);
  };

  const submitPriorAuth = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      console.log('Prior authorization submitted');
    }, 1500);
  };

  const exportData = () => {
    console.log('Exporting data...');
  };

  const filteredEligibility = eligibilityData.filter(item => {
    const matchesSearch = 
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.payer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || item.status === filters.status;
    const matchesPayer = filters.payer === 'all' || item.payer.includes(filters.payer);
    
    return matchesSearch && matchesStatus && matchesPayer;
  });

  const filteredAuthorizations = authorizationData.filter(item => {
    const matchesSearch = 
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.authNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.payer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.linkedCodes.some(code => code.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filters.status === 'all' || item.status === filters.status;
    const matchesPayer = filters.payer === 'all' || item.payer.includes(filters.payer);
    const matchesExpiring = !filters.expiringOnly || isExpiringSoon(item.validTo);
    
    return matchesSearch && matchesStatus && matchesPayer && matchesExpiring;
  });

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Eligibility & Authorizations</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage eligibility inquiries and prior authorizations
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setBatchMode(!batchMode)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                batchMode 
                  ? 'bg-[#62d5e4] text-white hover:bg-[#4bc5d6]' 
                  : 'text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Target className="w-4 h-4" />
              Batch Mode
            </button>

            <button 
              onClick={exportData}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            
            <button 
              onClick={() => runEligibilityCheck()}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {activeTab === 'eligibility' ? 'Check Eligibility' : 'Submit Auth'}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={activeTab === 'eligibility' ? "Search patients, members, payers..." : "Search auths, patients, codes..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
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
                <option value="Medicare">Medicare</option>
                <option value="Blue Cross">Blue Cross</option>
                <option value="Aetna">Aetna</option>
                <option value="United">United Healthcare</option>
                <option value="Cigna">Cigna</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>

            {activeTab === 'authorizations' && (
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={filters.expiringOnly}
                    onChange={(e) => setFilters(prev => ({ ...prev, expiringOnly: e.target.checked }))}
                    className="rounded border-gray-300 text-[#62d5e4] focus:ring-[#62d5e4]"
                  />
                  Expiring Soon
                </label>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <nav className="flex space-x-8 mt-4">
          {[
            { id: 'eligibility', label: 'Eligibility Inquiries', icon: Shield },
            { id: 'authorizations', label: 'Prior Authorizations', icon: FileText }
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
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                tab.id === 'eligibility' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {tab.id === 'eligibility' ? filteredEligibility.length : filteredAuthorizations.length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 max-h-96">
        {activeTab === 'eligibility' && (
          <div className="space-y-4">
            {/* Batch Operations */}
            {batchMode && (
              <div className="bg-cyan-50 border border-[#62d5e4] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Batch Eligibility Processing</h3>
                  <button className="text-sm text-[#62d5e4] hover:underline">
                    Upload Patient List
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="block text-gray-700 mb-1">Date of Service</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Provider</label>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent">
                      <option>All Providers</option>
                      <option>Dr. Sarah Johnson</option>
                      <option>Dr. Michael Chen</option>
                      <option>Dr. Jennifer Walsh</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={() => runEligibilityCheck()}
                      className="w-full px-4 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors"
                    >
                      Process Batch
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Eligibility Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden max-h-96">
              <div className="overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Patient</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Member ID</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Payer</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Coverage</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Benefits</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Last Checked</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredEligibility.slice(0, 10).map((item) => (
                      <tr key={item.id} className="h-16 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{item.patientName}</div>
                            <div className="text-sm text-gray-500">{item.patientId}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-mono text-sm text-gray-900">{item.memberId}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.payer}</div>
                            <div className="text-xs text-gray-500">{item.coverage.planName}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {getStatusIcon(item.status)}
                            <span className={`inline-flex items-center h-7 px-3 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <div className={`flex items-center gap-1 ${item.coverage.active ? 'text-green-600' : 'text-red-600'}`}>
                              <div className={`w-2 h-2 rounded-full ${item.coverage.active ? 'bg-green-500' : 'bg-red-500'}`} />
                              {item.coverage.active ? 'Active' : 'Inactive'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Effective: {item.coverage.effectiveDate}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span>Copay:</span>
                              <span className="font-medium">${item.benefits.copay}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Deductible:</span>
                              <span className="font-medium">${item.benefits.deductibleMet}/${item.benefits.deductible}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>OOP Max:</span>
                              <span className="font-medium">${item.benefits.outOfPocketMet}/${item.benefits.outOfPocketMax}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">{item.responseDate || item.requestDate}</div>
                          {item.linkedClaimId && (
                            <div className="text-xs text-blue-600">
                              Linked: {item.linkedClaimId}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => runEligibilityCheck(item)}
                              className="p-1.5 text-gray-400 hover:text-[#62d5e4] transition-colors"
                              title="Re-check eligibility"
                            >
                              <RefreshCw className="w-5 h-5" />
                            </button>
                            <button
                              className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                              title="View details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              className="p-1.5 text-gray-400 hover:text-green-500 transition-colors"
                              title="Link to claim"
                            >
                              <Target className="w-5 h-5" />
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

        {activeTab === 'authorizations' && (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-[#62d5e4] border border-[#62d5e4] rounded-lg hover:bg-cyan-50 transition-colors">
                  <Plus className="w-4 h-4" />
                  New Authorization
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Upload className="w-4 h-4" />
                  Bulk Upload
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span>{authorizationData.filter(auth => isExpiringSoon(auth.validTo)).length} expiring soon</span>
              </div>
            </div>

            {/* Authorizations Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Auth #</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Patient</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Codes</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Valid Period</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Requested By</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Priority</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAuthorizations.slice(0, 10).map((auth) => (
                      <tr key={auth.id} className="h-16 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-mono text-sm font-medium text-gray-900">{auth.authNumber}</div>
                          <div className="text-xs text-gray-500">{auth.payer}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{auth.patientName}</div>
                            <div className="text-sm text-gray-500">{auth.patientId}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            {auth.linkedCodes.map((code, index) => (
                              <div key={code} className="flex items-center gap-2">
                                <span className="font-mono text-xs bg-blue-100 text-blue-800 h-6 px-2.5 rounded inline-flex items-center">
                                  {code}
                                </span>
                                <span className="text-xs text-gray-600 truncate">
                                  {auth.codeDescriptions[index]}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {getStatusIcon(auth.status)}
                            <span className={`inline-flex items-center h-7 px-3 rounded-full text-xs font-medium ${getStatusBadge(auth.status)}`}>
                              {auth.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <div className="text-gray-900">
                              {auth.validFrom} - {auth.validTo}
                            </div>
                            <div className={`text-xs ${
                              isExpired(auth.validTo) 
                                ? 'text-red-600' 
                                : isExpiringSoon(auth.validTo) 
                                  ? 'text-orange-600' 
                                  : 'text-green-600'
                            }`}>
                              {isExpired(auth.validTo) 
                                ? 'Expired' 
                                : isExpiringSoon(auth.validTo) 
                                  ? 'Expires soon' 
                                  : 'Valid'}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">{auth.requestedBy}</div>
                          <div className="text-xs text-gray-500">
                            {auth.requestDate}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center h-7 px-3 rounded-full text-xs font-medium ${
                            auth.priority === 'stat' ? 'bg-red-100 text-red-800' :
                            auth.priority === 'urgent' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {auth.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                              title="View details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              className="p-1.5 text-gray-400 hover:text-green-500 transition-colors"
                              title="Edit authorization"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            {auth.attachments.length > 0 && (
                              <button
                                className="p-1.5 text-gray-400 hover:text-purple-500 transition-colors"
                                title="View attachments"
                              >
                                <FileText className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              className="p-1.5 text-gray-400 hover:text-[#62d5e4] transition-colors"
                              title="Extend authorization"
                            >
                              <Calendar className="w-5 h-5" />
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