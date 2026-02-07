import { useState, useEffect } from 'react';
import { 
  Filter,
  Search,
  RefreshCw,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  User,
  FileText,
  Target,
  Lightbulb,
  Brain,
  BookOpen,
  ArrowRight,
  Play,
  Save,
  Send,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  MessageSquare,
  Star,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Info,
  AlertCircle,
  Building,
  Stethoscope,
  ClipboardList,
  History,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Download,
  Upload,
  Paperclip,
  CheckSquare,
  Users,
  X,
  MoreHorizontal
} from 'lucide-react';

interface Denial {
  id: string;
  claimNumber: string;
  patientName: string;
  payer: string;
  provider: string;
  serviceDate: string;
  denialDate: string;
  daysSinceDenial: number;
  carcCode: string;
  rarcCode?: string;
  denialReason: string;
  lineNumber: number;
  procedureCode: string;
  chargedAmount: number;
  valueAtRisk: number;
  severity: 'high' | 'medium' | 'low';
  status: 'new' | 'in_review' | 'fix_staged' | 'resubmitted' | 'appealed' | 'paid' | 'written_off';
  suggestedFix: string;
  fixType: 'modifier' | 'diagnosis' | 'documentation' | 'coding' | 'authorization' | 'appeal';
  aiConfidence: number;
  category: string;
  isRecurrent: boolean;
  relatedDenials: string[];
}

interface DenialPattern {
  id: string;
  pattern: string;
  payer: string;
  frequency: number;
  successRate: number;
  suggestedAction: string;
  examples: string[];
}

interface Playbook {
  id: string;
  carcCode: string;
  title: string;
  description: string;
  commonCauses: string[];
  fixSteps: string[];
  preventionTips: string[];
  successRate: number;
  avgDaysToResolve: number;
}

interface QuickFix {
  id: string;
  type: 'modifier' | 'diagnosis' | 'documentation';
  description: string;
  code?: string;
  value?: string;
  field: string;
}

export function DenialsWorkbench() {
  const [denials, setDenials] = useState<Denial[]>([]);
  const [denialPatterns, setDenialPatterns] = useState<DenialPattern[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedDenial, setSelectedDenial] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showFixPanel, setShowFixPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAppealBuilder, setShowAppealBuilder] = useState(false);
  const [appealData, setAppealData] = useState({
    template: 'medical-necessity',
    evidence: [],
    letterContent: '',
    attachments: []
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    payer: 'all',
    carcCode: 'all',
    severity: 'all',
    provider: 'all',
    dateRange: 'all',
    daysSince: 'all',
    status: 'all'
  });

  // Sample data
  const sampleDenials: Denial[] = [
    {
      id: 'denial-001',
      claimNumber: 'CLM240001',
      patientName: 'John Smith',
      payer: 'Medicare Part B',
      provider: 'Dr. Sarah Johnson',
      serviceDate: '2024-01-15',
      denialDate: '2024-01-18',
      daysSinceDenial: 3,
      carcCode: '59',
      rarcCode: 'M15',
      denialReason: 'Procedure code incidental to primary procedure',
      lineNumber: 2,
      procedureCode: '36415',
      chargedAmount: 25.00,
      valueAtRisk: 25.00,
      severity: 'low',
      status: 'new',
      suggestedFix: 'Add modifier 59 to indicate distinct procedure',
      fixType: 'modifier',
      aiConfidence: 95,
      category: 'Bundling',
      isRecurrent: true,
      relatedDenials: ['denial-003', 'denial-007']
    },
    {
      id: 'denial-002',
      claimNumber: 'CLM240002',
      patientName: 'Maria Garcia',
      payer: 'Blue Cross Blue Shield',
      provider: 'Dr. Michael Chen',
      serviceDate: '2024-01-12',
      denialDate: '2024-01-16',
      daysSinceDenial: 7,
      carcCode: '197',
      denialReason: 'Precertification/authorization/notification absent',
      lineNumber: 1,
      procedureCode: '99213',
      chargedAmount: 150.00,
      valueAtRisk: 150.00,
      severity: 'high',
      status: 'in_review',
      suggestedFix: 'Obtain retroactive authorization or file appeal',
      fixType: 'authorization',
      aiConfidence: 88,
      category: 'Authorization',
      isRecurrent: false,
      relatedDenials: []
    },
    {
      id: 'denial-003',
      claimNumber: 'CLM240003',
      patientName: 'Robert Wilson',
      payer: 'Aetna',
      provider: 'Dr. Lisa Rodriguez',
      serviceDate: '2024-01-10',
      denialDate: '2024-01-14',
      daysSinceDenial: 9,
      carcCode: '11',
      denialReason: 'Diagnosis inconsistent with procedure',
      lineNumber: 1,
      procedureCode: '93000',
      chargedAmount: 85.00,
      valueAtRisk: 85.00,
      severity: 'medium',
      status: 'fix_staged',
      suggestedFix: 'Update diagnosis pointer to match cardiac procedure',
      fixType: 'diagnosis',
      aiConfidence: 92,
      category: 'Coding',
      isRecurrent: true,
      relatedDenials: ['denial-001']
    }
  ];

  const samplePatterns: DenialPattern[] = [
    {
      id: 'pattern-001',
      pattern: 'Medicare denies 36415 (venipuncture) when bundled with office visits',
      payer: 'Medicare Part B',
      frequency: 15,
      successRate: 94,
      suggestedAction: 'Add modifier 59 when performed as separate procedure',
      examples: ['36415 with 99213', '36415 with 99214']
    },
    {
      id: 'pattern-002',
      pattern: 'BCBS requires prior auth for all imaging studies over $200',
      payer: 'Blue Cross Blue Shield',
      frequency: 8,
      successRate: 76,
      suggestedAction: 'Always obtain pre-authorization for high-cost imaging',
      examples: ['71020', '72148', '73721']
    }
  ];

  const samplePlaybooks: Playbook[] = [
    {
      id: 'playbook-59',
      carcCode: '59',
      title: 'Procedure Code Incidental to Primary',
      description: 'When a procedure is considered bundled or incidental to the primary procedure',
      commonCauses: [
        'Procedures performed in same anatomical area',
        'Lab draws during office visits',
        'Missing modifier to indicate distinct procedure'
      ],
      fixSteps: [
        'Review operative report for separate incision/approach',
        'Add modifier 59 if procedures are distinct',
        'Consider modifier XS, XP, XE, or XU for specificity',
        'Document medical necessity in notes'
      ],
      preventionTips: [
        'Use specific modifiers instead of 59 when possible',
        'Document separate sessions clearly',
        'Check payer bundling rules before billing'
      ],
      successRate: 85,
      avgDaysToResolve: 14
    },
    {
      id: 'playbook-197',
      carcCode: '197',
      title: 'Missing Authorization',
      description: 'Service requires precertification or authorization that was not obtained',
      commonCauses: [
        'Failed to check authorization requirements',
        'Authorization expired before service date',
        'Wrong authorization number submitted'
      ],
      fixSteps: [
        'Contact payer to request retroactive authorization',
        'File appeal with supporting documentation',
        'Provide medical necessity justification',
        'Submit corrected claim with auth number'
      ],
      preventionTips: [
        'Always verify authorization requirements',
        'Check authorization validity dates',
        'Maintain authorization tracking system'
      ],
      successRate: 65,
      avgDaysToResolve: 30
    }
  ];

  useEffect(() => {
    setDenials(sampleDenials);
    setDenialPatterns(samplePatterns);
    setPlaybooks(samplePlaybooks);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      new: 'bg-blue-100 text-blue-800',
      in_review: 'bg-yellow-100 text-yellow-800',
      fix_staged: 'bg-purple-100 text-purple-800',
      resubmitted: 'bg-cyan-100 text-cyan-800',
      appealed: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
      written_off: 'bg-red-100 text-red-800'
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.new;
  };

  const getSeverityBadge = (severity: string) => {
    const severityMap = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    
    return severityMap[severity as keyof typeof severityMap] || severityMap.medium;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'written_off':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'appealed':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'resubmitted':
        return <Send className="w-4 h-4 text-cyan-500" />;
      case 'fix_staged':
        return <Edit className="w-4 h-4 text-purple-500" />;
      case 'in_review':
        return <Eye className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const stageFix = (denialId: string, fix: QuickFix) => {
    setLoading(true);
    
    setTimeout(() => {
      setDenials(prev => prev.map(denial => 
        denial.id === denialId 
          ? { ...denial, status: 'fix_staged' as const }
          : denial
      ));
      setLoading(false);
      console.log('Fix staged:', fix);
    }, 1000);
  };

  const resubmitClaim = (denialId: string) => {
    setLoading(true);
    
    setTimeout(() => {
      setDenials(prev => prev.map(denial => 
        denial.id === denialId 
          ? { ...denial, status: 'resubmitted' as const }
          : denial
      ));
      setLoading(false);
      console.log('Claim resubmitted:', denialId);
    }, 2000);
  };

  const updateOutcome = (denialId: string, outcome: 'appealed' | 'paid' | 'written_off') => {
    setDenials(prev => prev.map(denial => 
      denial.id === denialId 
        ? { ...denial, status: outcome }
        : denial
    ));
  };

  const openClaimWorkspace = (claimNumber: string, lineNumber: number) => {
    console.log('Opening claim workspace:', claimNumber, 'Line:', lineNumber);
    // This would navigate to the claim workspace with specific line highlighted
  };

  const filteredDenials = denials.filter(denial => {
    const matchesSearch = denial.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         denial.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         denial.carcCode.includes(searchQuery) ||
                         denial.denialReason.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPayer = filters.payer === 'all' || denial.payer === filters.payer;
    const matchesCarc = filters.carcCode === 'all' || denial.carcCode === filters.carcCode;
    const matchesSeverity = filters.severity === 'all' || denial.severity === filters.severity;
    const matchesStatus = filters.status === 'all' || denial.status === filters.status;
    
    return matchesSearch && matchesPayer && matchesCarc && matchesSeverity && matchesStatus;
  });

  const denial = selectedDenial ? denials.find(d => d.id === selectedDenial) : null;
  const playbook = denial ? playbooks.find(p => p.carcCode === denial.carcCode) : null;

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Denials Workbench</h1>
            <p className="text-sm text-gray-600 mt-1">
              Resolve claim denials quickly with AI-powered guidance and suggested fixes
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === 'cards' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Table
              </button>
            </div>
            
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Brain className="w-4 h-4" />
              AI Insights
            </button>
            
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors">
              <Plus className="w-4 h-4" />
              Bulk Actions
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Denials</p>
                <p className="text-lg font-semibold text-gray-900">{denials.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Severity</p>
                <p className="text-lg font-semibold text-gray-900">
                  {denials.filter(d => d.severity === 'high').length}
                </p>
              </div>
              <Flag className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Value at Risk</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${denials.reduce((sum, d) => sum + d.valueAtRisk, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Days Open</p>
                <p className="text-lg font-semibold text-gray-900">
                  {Math.round(denials.reduce((sum, d) => sum + d.daysSinceDenial, 0) / denials.length)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fix Success Rate</p>
                <p className="text-lg font-semibold text-gray-900">87%</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search denials..."
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
            {showFilters && <span className="text-xs bg-[#62d5e4] text-white px-2 py-1 rounded-full ml-1">ON</span>}
          </button>
          
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-6 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
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
                <option value="United Healthcare">UHC</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">CARC Code</label>
              <select
                value={filters.carcCode}
                onChange={(e) => setFilters(prev => ({ ...prev, carcCode: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
              >
                <option value="all">All Codes</option>
                <option value="59">59 - Bundling</option>
                <option value="197">197 - Auth Missing</option>
                <option value="11">11 - Dx Inconsistent</option>
                <option value="16">16 - Lacks Info</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
              >
                <option value="all">All Levels</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Provider</label>
              <select className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white">
                <option value="all">All Providers</option>
                <option>Dr. Sarah Johnson</option>
                <option>Dr. Michael Chen</option>
                <option>Dr. Lisa Rodriguez</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Days Since</label>
              <select className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white">
                <option value="all">All Time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="in_review">In Review</option>
                <option value="fix_staged">Fix Staged</option>
                <option value="resubmitted">Resubmitted</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto max-h-96">
        <div className="flex h-full">
          {/* Main Content */}
          <div className={`${showFixPanel ? 'w-2/3' : 'w-full'} transition-all duration-300`}>
            <div className="p-3">
              {viewMode === 'cards' ? (
                <div className="grid gap-4">
                  {filteredDenials.slice(0, 8).map((denial) => (
                    <div key={denial.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-mono text-lg font-semibold text-gray-900">{denial.claimNumber}</h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadge(denial.severity)}`}>
                              {denial.severity} severity
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(denial.status)}`}>
                              {denial.status.replace('_', ' ')}
                            </span>
                            {denial.isRecurrent && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Recurrent
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-gray-500">Patient:</span>
                              <div className="font-medium">{denial.patientName}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Payer:</span>
                              <div className="font-medium">{denial.payer}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Service Date:</span>
                              <div className="font-medium">{denial.serviceDate}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Days Open:</span>
                              <div className="font-medium text-orange-600">{denial.daysSinceDenial}</div>
                            </div>
                          </div>
                          
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-sm font-medium text-red-900">CARC {denial.carcCode}</span>
                                  {denial.rarcCode && (
                                    <span className="font-mono text-sm text-red-700">RARC {denial.rarcCode}</span>
                                  )}
                                  <span className="text-sm text-red-700">Line {denial.lineNumber}</span>
                                </div>
                                <div className="text-sm text-red-800">{denial.denialReason}</div>
                                <div className="text-xs text-red-600 mt-1">
                                  Procedure: {denial.procedureCode} | Amount: ${denial.chargedAmount}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-green-600 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-green-900">AI Suggestion</span>
                                  <span className={`text-xs font-medium ${getConfidenceColor(denial.aiConfidence)}`}>
                                    {denial.aiConfidence}% confident
                                  </span>
                                </div>
                                <div className="text-sm text-green-800">{denial.suggestedFix}</div>
                                <div className="text-xs text-green-600 mt-1">
                                  Fix type: {denial.fixType} | Category: {denial.category}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Value at Risk</div>
                            <div className="text-lg font-semibold text-red-600">
                              ${denial.valueAtRisk.toFixed(2)}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => {
                                setSelectedDenial(denial.id);
                                setShowFixPanel(true);
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors"
                            >
                              <Zap className="w-4 h-4" />
                              Quick Fix
                            </button>
                            
                            <button
                              onClick={() => openClaimWorkspace(denial.claimNumber, denial.lineNumber)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Open Claim
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Claim</th>
                          <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Patient</th>
                          <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Denial</th>
                          <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">Suggestion</th>
                          <th className="px-4 py-4 text-right text-sm font-semibold text-gray-900">Value</th>
                          <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                          <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredDenials.map((denial) => (
                          <tr key={denial.id} className="h-16 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4">
                              <div>
                                <div className="font-mono font-medium text-gray-900">{denial.claimNumber}</div>
                                <div className="text-xs text-gray-500">{denial.serviceDate} | Line {denial.lineNumber}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{denial.patientName}</div>
                                <div className="text-xs text-gray-500">{denial.payer}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-sm font-medium text-red-900">CARC {denial.carcCode}</span>
                                  <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium ${getSeverityBadge(denial.severity)}`}>
                                    {denial.severity}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600">{denial.denialReason}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div>
                                <div className="text-sm text-gray-900">{denial.suggestedFix}</div>
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-xs text-gray-500">AI:</span>
                                  <span className={`text-xs font-medium ${getConfidenceColor(denial.aiConfidence)}`}>
                                    {denial.aiConfidence}%
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className="text-sm font-medium text-red-600">
                                ${denial.valueAtRisk.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-2">
                                {getStatusIcon(denial.status)}
                                <span className={`inline-flex items-center h-7 px-3 rounded-full text-xs font-medium ${getStatusBadge(denial.status)}`}>
                                  {denial.status.replace('_', ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => {
                                    setSelectedDenial(denial.id);
                                    setShowFixPanel(true);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-[#62d5e4] transition-colors"
                                  title="Quick fix"
                                >
                                  <Zap className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => openClaimWorkspace(denial.claimNumber, denial.lineNumber)}
                                  className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                                  title="Open in claim workspace"
                                >
                                  <ExternalLink className="w-5 h-5" />
                                </button>
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
              )}
            </div>
          </div>

          {/* Fix Panel */}
          {showFixPanel && denial && (
            <div className="w-1/3 bg-white border-l border-gray-200 overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Fix Panel</h3>
                  <button
                    onClick={() => setShowFixPanel(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Denial Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm font-medium">{denial.claimNumber}</span>
                    <span className="font-mono text-sm text-red-600">CARC {denial.carcCode}</span>
                  </div>
                  <div className="text-sm text-gray-600">{denial.denialReason}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Line {denial.lineNumber} | {denial.procedureCode} | ${denial.valueAtRisk}
                  </div>
                </div>

                {/* Playbook */}
                {playbook && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">{playbook.title}</h4>
                    </div>
                    <p className="text-sm text-blue-800 mb-3">{playbook.description}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-medium text-blue-900 mb-2">Common Causes:</h5>
                        <ul className="text-sm text-blue-800 space-y-1">
                          {playbook.commonCauses.map((cause, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                              {cause}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium text-blue-900 mb-2">Fix Steps:</h5>
                        <ol className="text-sm text-blue-800 space-y-1">
                          {playbook.fixSteps.map((step, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                                {index + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-blue-200">
                      <div className="text-center">
                        <div className="text-sm text-blue-600">Success Rate</div>
                        <div className="text-lg font-semibold text-blue-900">{playbook.successRate}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-blue-600">Avg Resolution</div>
                        <div className="text-lg font-semibold text-blue-900">{playbook.avgDaysToResolve} days</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Suggestion */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-green-900">AI Recommendation</h4>
                    <span className={`text-xs font-medium ${getConfidenceColor(denial.aiConfidence)}`}>
                      {denial.aiConfidence}% confident
                    </span>
                  </div>
                  <p className="text-sm text-green-800 mb-3">{denial.suggestedFix}</p>
                  
                  {denial.fixType === 'modifier' && (
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="text-sm font-medium text-green-900 mb-2">Suggested Modifier</div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg font-semibold text-green-900">59</span>
                          <span className="text-sm text-green-800">Distinct Procedural Service</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => stageFix(denial.id, { 
                          id: 'fix-1', 
                          type: 'modifier', 
                          description: 'Add modifier 59', 
                          code: '59',
                          field: 'procedure_modifier_1'
                        })}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        Stage Fix
                      </button>
                    </div>
                  )}
                  
                  {denial.fixType === 'diagnosis' && (
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="text-sm font-medium text-green-900 mb-2">Diagnosis Pointer Update</div>
                        <div className="text-sm text-green-800">
                          Update pointer from A to B for line {denial.lineNumber}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => stageFix(denial.id, { 
                          id: 'fix-2', 
                          type: 'diagnosis', 
                          description: 'Update diagnosis pointer', 
                          value: 'B',
                          field: 'diagnosis_pointer'
                        })}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        Stage Fix
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {denial.status === 'fix_staged' && (
                    <button
                      onClick={() => resubmitClaim(denial.id)}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Resubmit Claim
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowAppealBuilder(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Build Appeal
                  </button>
                  
                  <button
                    onClick={() => openClaimWorkspace(denial.claimNumber, denial.lineNumber)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Claim Workspace
                  </button>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => updateOutcome(denial.id, 'appealed')}
                      className="flex items-center justify-center gap-1 px-3 py-2 text-xs text-orange-600 border border-orange-200 rounded hover:bg-orange-50 transition-colors"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      Appeal
                    </button>
                    <button
                      onClick={() => updateOutcome(denial.id, 'paid')}
                      className="flex items-center justify-center gap-1 px-3 py-2 text-xs text-green-600 border border-green-200 rounded hover:bg-green-50 transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Paid
                    </button>
                    <button
                      onClick={() => updateOutcome(denial.id, 'written_off')}
                      className="flex items-center justify-center gap-1 px-3 py-2 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                    >
                      <XCircle className="w-3 h-3" />
                      Write Off
                    </button>
                  </div>
                </div>

                {/* Related Patterns */}
                {denialPatterns.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">AI Patterns & Insights</h4>
                    <div className="space-y-3">
                      {denialPatterns.slice(0, 2).map((pattern) => (
                        <div key={pattern.id} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Brain className="w-4 h-4 text-purple-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="text-sm text-purple-900 mb-1">{pattern.pattern}</div>
                              <div className="text-xs text-purple-700">{pattern.suggestedAction}</div>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-xs text-purple-600">
                                  Frequency: {pattern.frequency}x
                                </span>
                                <span className="text-xs text-purple-600">
                                  Success: {pattern.successRate}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Appeal Builder Modal */}
      {showAppealBuilder && selectedDenial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Appeal Builder</h2>
                <button
                  onClick={() => setShowAppealBuilder(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Left Column - Appeal Template */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Appeal Template</h3>
                    <div className="space-y-2">
                      {[
                        { id: 'medical-necessity', label: 'Medical Necessity', description: 'Service was medically necessary' },
                        { id: 'coding-correction', label: 'Coding Correction', description: 'Correct coding or modifier issue' },
                        { id: 'coverage-dispute', label: 'Coverage Dispute', description: 'Service should be covered' },
                        { id: 'timely-filing', label: 'Timely Filing', description: 'Appeal filing deadline extension' }
                      ].map((template) => (
                        <label key={template.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="template"
                            value={template.id}
                            checked={appealData.template === template.id}
                            onChange={(e) => setAppealData({...appealData, template: e.target.value})}
                            className="mt-1 text-[#62d5e4] focus:ring-[#62d5e4]"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{template.label}</div>
                            <div className="text-sm text-gray-600">{template.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Evidence Checklist</h3>
                    <div className="space-y-2">
                      {[
                        { id: 'medical-records', label: 'Medical Records', required: true },
                        { id: 'eob', label: 'EOB/ERA', required: true },
                        { id: 'guidelines', label: 'Clinical Guidelines', required: false },
                        { id: 'lab-results', label: 'Lab Results', required: false },
                        { id: 'prior-auth', label: 'Prior Authorization', required: false }
                      ].map((evidence) => (
                        <label key={evidence.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded">
                          <CheckSquare className={`w-4 h-4 ${evidence.required ? 'text-red-500' : 'text-gray-400'}`} />
                          <span className="text-sm">{evidence.label}</span>
                          {evidence.required && <span className="text-xs text-red-500">*Required</span>}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Middle Column - Letter Preview */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Appeal Letter Preview</h3>
                  <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
                    <div className="text-sm space-y-3">
                      <div>
                        <strong>Date:</strong> {new Date().toLocaleDateString()}
                      </div>
                      <div>
                        <strong>To:</strong> {denials.find(d => d.id === selectedDenial)?.payer} Appeals Department
                      </div>
                      <div>
                        <strong>Re:</strong> Appeal for Claim {denials.find(d => d.id === selectedDenial)?.claimNumber}
                      </div>
                      <div className="pt-4 border-t border-gray-300">
                        <p>Dear Appeals Review Team,</p>
                        <p className="mt-2">
                          I am writing to formally appeal the denial of claim {denials.find(d => d.id === selectedDenial)?.claimNumber} 
                          for patient {denials.find(d => d.id === selectedDenial)?.patientName}, 
                          date of service {denials.find(d => d.id === selectedDenial)?.serviceDate}.
                        </p>
                        <p className="mt-2">
                          The claim was denied with reason code {denials.find(d => d.id === selectedDenial)?.carcCode}: 
                          "{denials.find(d => d.id === selectedDenial)?.denialReason}"
                        </p>
                        {appealData.template === 'medical-necessity' && (
                          <p className="mt-2">
                            The service provided was medically necessary and appropriate for the patient's condition. 
                            Supporting documentation is attached that demonstrates the clinical need for this service.
                          </p>
                        )}
                        {appealData.template === 'coding-correction' && (
                          <p className="mt-2">
                            This appeal addresses a coding issue. The correct code/modifier should be applied 
                            as supported by the attached documentation and coding guidelines.
                          </p>
                        )}
                        <p className="mt-4">
                          Please review the attached evidence and reverse this denial. 
                          If you have any questions, please contact our office.
                        </p>
                        <p className="mt-4">
                          Sincerely,<br/>
                          Billing Department
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Attachments & Actions */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Attachments</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Drag files here or click to upload</p>
                      <button className="px-3 py-1 text-sm bg-[#62d5e4] text-white rounded hover:bg-[#4bc5d6] transition-colors">
                        Select Files
                      </button>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                        <Paperclip className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-800">medical_records.pdf</span>
                        <button className="ml-auto text-green-600 hover:text-green-800">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                        <Paperclip className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-800">eob_denial.pdf</span>
                        <button className="ml-auto text-green-600 hover:text-green-800">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Portal Submission</h3>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          {denials.find(d => d.id === selectedDenial)?.payer} Portal
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Connected
                        </span>
                      </div>
                      <p className="text-xs text-blue-700">
                        Appeal will be submitted directly to payer portal with tracking confirmation.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                      <Eye className="w-4 h-4" />
                      Preview Letter
                    </button>
                    
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[#62d5e4] text-white rounded-lg hover:bg-[#4bc5d6] transition-colors">
                      <Send className="w-4 h-4" />
                      Submit to Portal
                    </button>
                    
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Download className="w-4 h-4" />
                      Save as Draft
                    </button>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-yellow-800">
                          <strong>Filing Deadline:</strong> 45 days from denial date
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Time remaining: 42 days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}