import { useState, useEffect } from 'react';
import { 
  Shield,
  Settings,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Save,
  Upload,
  Download,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Bell,
  Clock,
  Target,
  Zap,
  Database,
  GitBranch,
  Code,
  FileText,
  BookOpen,
  Users,
  Building,
  CreditCard,
  Flag,
  Star,
  Hash,
  Tag,
  Layers,
  Link,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  RefreshCw,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Loader,
  HelpCircle,
  MessageSquare,
  Bookmark,
  FileCheck,
  FileX,
  FilePlus,
  Archive,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Lock,
  Unlock,
  ArrowRight,
  ArrowLeft,
  Scissors,
  Merge,
  Split,
  FastForward,
  Rewind,
  SkipBack,
  SkipForward,
  PlayCircle,
  PauseCircle,
  StopCircle
} from 'lucide-react';

interface Rule {
  id: string;
  name: string;
  type: 'NCCI' | 'LCD' | 'NCD' | 'payer_policy' | 'modifier' | 'unit' | 'prior_auth' | 'bundling' | 'coverage';
  scope: 'global' | 'payer' | 'plan' | 'specialty';
  scopeId?: string; // ID of payer, plan, or specialty if not global
  status: 'active' | 'draft' | 'testing' | 'archived';
  priority: number; // 1-100, higher number = higher priority
  version: string;
  description: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  effectiveDate: string;
  expirationDate?: string;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  citations?: string[];
  tags: string[];
  testResults?: TestResult;
  conflictsWith?: string[]; // IDs of conflicting rules
}

interface RuleCondition {
  id: string;
  field: 'diagnosis' | 'procedure' | 'modifier' | 'pos' | 'payer' | 'plan' | 'provider' | 'units' | 'age' | 'gender' | 'date';
  operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'between' | 'exists' | 'not_exists';
  value: string | string[] | number | { min?: number; max?: number };
  logicalOperator?: 'AND' | 'OR';
}

interface RuleAction {
  id: string;
  type: 'require_modifier' | 'deny_claim' | 'warn' | 'require_auth' | 'limit_units' | 'bundle_codes' | 'unbundle_codes' | 'adjust_amount';
  parameters: Record<string, any>;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

interface TestResult {
  id: string;
  ruleId: string;
  testDate: string;
  sampleSize: number;
  hits: number;
  misses: number;
  accuracy: number;
  falsePositives: number;
  falseNegatives: number;
  executionTime: number;
  details: TestDetail[];
}

interface TestDetail {
  claimId: string;
  expected: boolean;
  actual: boolean;
  match: boolean;
  reason?: string;
}

interface RulePack {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  rulesCount: number;
  lastUpdated: string;
  tags: string[];
  citations: string[];
  downloadCount: number;
  rating: number;
}

interface Conflict {
  id: string;
  rule1Id: string;
  rule2Id: string;
  type: 'precedence' | 'contradiction' | 'overlap';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  resolved: boolean;
}

export function RulesScrubbing() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [rulePacks, setRulePacks] = useState<RulePack[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [activeTab, setActiveTab] = useState('rules-library');
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [showTestHarness, setShowTestHarness] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  // Rule editor state
  const [ruleForm, setRuleForm] = useState({
    name: '',
    type: 'payer_policy' as Rule['type'],
    scope: 'global' as Rule['scope'],
    scopeId: '',
    description: '',
    priority: 50,
    effectiveDate: '',
    expirationDate: '',
    tags: [] as string[]
  });

  const [conditions, setConditions] = useState<RuleCondition[]>([]);
  const [actions, setActions] = useState<RuleAction[]>([]);

  // Test harness state
  const [testForm, setTestForm] = useState({
    ruleIds: [] as string[],
    sampleSize: '100',
    claimDateRange: 'last_30_days',
    includeArchived: false
  });

  // Filter states
  const [filters, setFilters] = useState({
    type: 'all',
    scope: 'all',
    status: 'all',
    priority: 'all',
    hasConflicts: 'all'
  });

  // Sample data
  const sampleRules: Rule[] = [
    {
      id: 'rule-001',
      name: 'NCCI Column 1/Column 2 Edit - 99213/93000',
      type: 'NCCI',
      scope: 'global',
      status: 'active',
      priority: 90,
      version: '2024.1',
      description: 'NCCI edit preventing 99213 and 93000 from being billed together on the same date of service',
      conditions: [
        {
          id: 'cond-001',
          field: 'procedure',
          operator: 'equals',
          value: '99213'
        },
        {
          id: 'cond-002',
          field: 'procedure',
          operator: 'equals',
          value: '93000',
          logicalOperator: 'AND'
        }
      ],
      actions: [
        {
          id: 'action-001',
          type: 'deny_claim',
          parameters: { allowOverride: false },
          message: 'NCCI edit: Cannot bill 99213 and 93000 together without appropriate modifier',
          severity: 'error'
        }
      ],
      effectiveDate: '2024-01-01',
      createdBy: 'System Admin',
      createdDate: '2024-01-01',
      lastModifiedBy: 'System Admin',
      lastModifiedDate: '2024-01-01',
      citations: ['NCCI Policy Manual v30.0'],
      tags: ['NCCI', 'Column1/Column2', 'E&M', 'Diagnostic']
    },
    {
      id: 'rule-002',
      name: 'Medicare LCD - Lumbar MRI Prior Auth',
      type: 'LCD',
      scope: 'payer',
      scopeId: 'medicare',
      status: 'active',
      priority: 85,
      version: '2024.1',
      description: 'Medicare LCD requiring prior authorization for lumbar spine MRI with specific diagnosis codes',
      conditions: [
        {
          id: 'cond-003',
          field: 'procedure',
          operator: 'equals',
          value: '72148'
        },
        {
          id: 'cond-004',
          field: 'diagnosis',
          operator: 'in',
          value: ['M54.5', 'M54.2', 'M51.9'],
          logicalOperator: 'AND'
        },
        {
          id: 'cond-005',
          field: 'payer',
          operator: 'equals',
          value: 'medicare',
          logicalOperator: 'AND'
        }
      ],
      actions: [
        {
          id: 'action-002',
          type: 'require_auth',
          parameters: { authType: 'prior_auth', validDays: 90 },
          message: 'Prior authorization required for lumbar MRI per Medicare LCD',
          severity: 'error'
        }
      ],
      effectiveDate: '2024-01-01',
      createdBy: 'Medicare Admin',
      createdDate: '2024-01-01',
      lastModifiedBy: 'Medicare Admin',
      lastModifiedDate: '2024-01-15',
      citations: ['Medicare LCD L33682'],
      tags: ['Medicare', 'LCD', 'MRI', 'Prior Auth', 'Lumbar'],
      testResults: {
        id: 'test-001',
        ruleId: 'rule-002',
        testDate: '2024-01-20',
        sampleSize: 150,
        hits: 12,
        misses: 138,
        accuracy: 92.0,
        falsePositives: 2,
        falseNegatives: 1,
        executionTime: 45,
        details: []
      }
    },
    {
      id: 'rule-003',
      name: 'BCBS Modifier 25 Requirement',
      type: 'modifier',
      scope: 'payer',
      scopeId: 'bcbs',
      status: 'active',
      priority: 70,
      version: '2024.1',
      description: 'Require modifier 25 on E&M services when performed with procedure on same day',
      conditions: [
        {
          id: 'cond-006',
          field: 'procedure',
          operator: 'in',
          value: ['99213', '99214', '99215']
        },
        {
          id: 'cond-007',
          field: 'procedure',
          operator: 'starts_with',
          value: '1',
          logicalOperator: 'AND'
        },
        {
          id: 'cond-008',
          field: 'payer',
          operator: 'equals',
          value: 'bcbs',
          logicalOperator: 'AND'
        }
      ],
      actions: [
        {
          id: 'action-003',
          type: 'require_modifier',
          parameters: { modifier: '25', applyTo: 'em_code' },
          message: 'Modifier 25 required on E&M when performed with procedure on same day',
          severity: 'warning'
        }
      ],
      effectiveDate: '2024-01-01',
      createdBy: 'BCBS Admin',
      createdDate: '2024-01-01',
      lastModifiedBy: 'BCBS Admin',
      lastModifiedDate: '2024-01-10',
      tags: ['BCBS', 'Modifier 25', 'E&M', 'Same Day'],
      conflictsWith: ['rule-004']
    }
  ];

  const sampleRulePacks: RulePack[] = [
    {
      id: 'pack-001',
      name: 'NCCI Edits Q1 2024',
      description: 'Complete NCCI Column 1/Column 2 edits for Q1 2024',
      version: '2024.1',
      author: 'CMS',
      rulesCount: 847,
      lastUpdated: '2024-01-01',
      tags: ['NCCI', 'CMS', 'Q1 2024'],
      citations: ['NCCI Policy Manual v30.0'],
      downloadCount: 2847,
      rating: 4.8
    },
    {
      id: 'pack-002',
      name: 'Medicare LCDs - Diagnostic Imaging',
      description: 'Medicare Local Coverage Determinations for diagnostic imaging procedures',
      version: '2024.1',
      author: 'Medicare',
      rulesCount: 156,
      lastUpdated: '2024-01-15',
      tags: ['Medicare', 'LCD', 'Imaging'],
      citations: ['Various Medicare LCDs'],
      downloadCount: 1234,
      rating: 4.6
    }
  ];

  const sampleConflicts: Conflict[] = [
    {
      id: 'conflict-001',
      rule1Id: 'rule-003',
      rule2Id: 'rule-004',
      type: 'contradiction',
      severity: 'high',
      description: 'Rule 003 requires modifier 25, but Rule 004 prohibits it for the same scenario',
      recommendation: 'Review payer-specific policies and adjust rule precedence',
      resolved: false
    }
  ];

  useEffect(() => {
    setRules(sampleRules);
    setRulePacks(sampleRulePacks);
    setConflicts(sampleConflicts);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      testing: 'bg-blue-100 text-blue-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.active;
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      NCCI: 'bg-red-100 text-red-800',
      LCD: 'bg-blue-100 text-blue-800',
      NCD: 'bg-purple-100 text-purple-800',
      payer_policy: 'bg-green-100 text-green-800',
      modifier: 'bg-yellow-100 text-yellow-800',
      unit: 'bg-orange-100 text-orange-800',
      prior_auth: 'bg-pink-100 text-pink-800',
      bundling: 'bg-indigo-100 text-indigo-800',
      coverage: 'bg-teal-100 text-teal-800'
    };
    
    return typeMap[type as keyof typeof typeMap] || typeMap.payer_policy;
  };

  const getScopeBadge = (scope: string) => {
    const scopeMap = {
      global: 'bg-gray-100 text-gray-800',
      payer: 'bg-blue-100 text-blue-800',
      plan: 'bg-green-100 text-green-800',
      specialty: 'bg-purple-100 text-purple-800'
    };
    
    return scopeMap[scope as keyof typeof scopeMap] || scopeMap.global;
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 90) return 'bg-red-100 text-red-800';
    if (priority >= 70) return 'bg-orange-100 text-orange-800';
    if (priority >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 90) return 'Critical';
    if (priority >= 70) return 'High';
    if (priority >= 50) return 'Medium';
    return 'Low';
  };

  const getConflictBadge = (severity: string) => {
    const severityMap = {
      low: 'bg-yellow-100 text-yellow-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800',
      critical: 'bg-red-200 text-red-900'
    };
    
    return severityMap[severity as keyof typeof severityMap] || severityMap.low;
  };

  const addCondition = () => {
    const newCondition: RuleCondition = {
      id: `cond-${Date.now()}`,
      field: 'procedure',
      operator: 'equals',
      value: '',
      logicalOperator: conditions.length > 0 ? 'AND' : undefined
    };
    setConditions([...conditions, newCondition]);
  };

  const updateCondition = (id: string, updates: Partial<RuleCondition>) => {
    setConditions(conditions.map(condition => 
      condition.id === id ? { ...condition, ...updates } : condition
    ));
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(condition => condition.id !== id));
  };

  const addAction = () => {
    const newAction: RuleAction = {
      id: `action-${Date.now()}`,
      type: 'warn',
      parameters: {},
      message: '',
      severity: 'warning'
    };
    setActions([...actions, newAction]);
  };

  const updateAction = (id: string, updates: Partial<RuleAction>) => {
    setActions(actions.map(action => 
      action.id === id ? { ...action, ...updates } : action
    ));
  };

  const removeAction = (id: string) => {
    setActions(actions.filter(action => action.id !== id));
  };

  const saveRule = () => {
    setLoading(true);
    
    setTimeout(() => {
      const newRule: Rule = {
        id: `rule-${Date.now()}`,
        ...ruleForm,
        conditions,
        actions,
        status: 'draft',
        version: '1.0',
        createdBy: 'Current User',
        createdDate: new Date().toISOString().split('T')[0],
        lastModifiedBy: 'Current User',
        lastModifiedDate: new Date().toISOString().split('T')[0]
      };

      setRules(prev => [...prev, newRule]);
      setShowRuleEditor(false);
      setLoading(false);
      
      // Reset form
      setRuleForm({
        name: '',
        type: 'payer_policy',
        scope: 'global',
        scopeId: '',
        description: '',
        priority: 50,
        effectiveDate: '',
        expirationDate: '',
        tags: []
      });
      setConditions([]);
      setActions([]);
    }, 2000);
  };

  const runTest = () => {
    setLoading(true);
    
    setTimeout(() => {
      // Simulate test results
      const testResults = testForm.ruleIds.map(ruleId => ({
        ruleId,
        hits: Math.floor(Math.random() * 50),
        misses: Math.floor(Math.random() * 100),
        accuracy: 85 + Math.random() * 15
      }));

      console.log('Test results:', testResults);
      setLoading(false);
    }, 5000);
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rule.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filters.type === 'all' || rule.type === filters.type;
    const matchesScope = filters.scope === 'all' || rule.scope === filters.scope;
    const matchesStatus = filters.status === 'all' || rule.status === filters.status;
    const matchesPriority = filters.priority === 'all' || 
                           (filters.priority === 'high' && rule.priority >= 70) ||
                           (filters.priority === 'medium' && rule.priority >= 50 && rule.priority < 70) ||
                           (filters.priority === 'low' && rule.priority < 50);
    const matchesConflicts = filters.hasConflicts === 'all' || 
                            (filters.hasConflicts === 'yes' && rule.conflictsWith && rule.conflictsWith.length > 0) ||
                            (filters.hasConflicts === 'no' && (!rule.conflictsWith || rule.conflictsWith.length === 0));
    
    return matchesSearch && matchesType && matchesScope && matchesStatus && matchesPriority && matchesConflicts;
  });

  const rule = selectedRule ? rules.find(r => r.id === selectedRule) : null;

  return (
    <div className="h-full bg-gray-50 flex flex-col max-w-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Rules & Scrubbing</h1>
            <p className="text-sm text-gray-600 mt-1">
              Control center for NCCI, LCD/NCD, payer policies, and billing rules
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import Rules
            </button>
            
            <button 
              onClick={() => setShowTestHarness(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Play className="w-4 h-4" />
              Test Harness
            </button>
            
            <button 
              onClick={() => setShowRuleEditor(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Rule
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-6 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Rules</p>
                <p className="text-lg font-semibold text-gray-900">
                  {rules.length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Rules</p>
                <p className="text-lg font-semibold text-gray-900">
                  {rules.filter(r => r.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Draft Rules</p>
                <p className="text-lg font-semibold text-gray-900">
                  {rules.filter(r => r.status === 'draft').length}
                </p>
              </div>
              <Edit className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conflicts</p>
                <p className="text-lg font-semibold text-gray-900">
                  {conflicts.filter(c => !c.resolved).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-lg font-semibold text-gray-900">
                  {rules.filter(r => r.priority >= 70).length}
                </p>
              </div>
              <Flag className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Test Coverage</p>
                <p className="text-lg font-semibold text-gray-900">
                  {Math.round((rules.filter(r => r.testResults).length / rules.length) * 100)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Conflict Alert */}
        {conflicts.filter(c => !c.resolved && c.severity === 'critical').length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-900">Critical Rule Conflicts Detected</p>
                <p className="text-sm text-red-700">
                  {conflicts.filter(c => !c.resolved && c.severity === 'critical').length} critical conflicts require immediate attention.
                </p>
              </div>
              <button 
                onClick={() => setShowConflictModal(true)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <nav className="flex space-x-8">
          {[
            { id: 'rules-library', label: 'Rules Library', icon: Database },
            { id: 'rule-editor', label: 'Rule Editor', icon: Edit },
            { id: 'testing-harness', label: 'Testing Harness', icon: Play },
            { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle },
            { id: 'rule-packs', label: 'Rule Packs', icon: Archive }
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
        {activeTab === 'rules-library' && (
          <div className="p-4">
            {/* Search and Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search rules..."
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rule Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
                  >
                    <option value="all">All Types</option>
                    <option value="NCCI">NCCI</option>
                    <option value="LCD">LCD</option>
                    <option value="NCD">NCD</option>
                    <option value="payer_policy">Payer Policy</option>
                    <option value="modifier">Modifier</option>
                    <option value="unit">Unit Rules</option>
                    <option value="prior_auth">Prior Auth</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Scope</label>
                  <select
                    value={filters.scope}
                    onChange={(e) => setFilters(prev => ({ ...prev, scope: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
                  >
                    <option value="all">All Scopes</option>
                    <option value="global">Global</option>
                    <option value="payer">Payer</option>
                    <option value="plan">Plan</option>
                    <option value="specialty">Specialty</option>
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
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="testing">Testing</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
                  >
                    <option value="all">All Priority</option>
                    <option value="high">High (70+)</option>
                    <option value="medium">Medium (50-69)</option>
                    <option value="low">Low (0-49)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Has Conflicts</label>
                  <select
                    value={filters.hasConflicts}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasConflicts: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
                  >
                    <option value="all">All Rules</option>
                    <option value="yes">With Conflicts</option>
                    <option value="no">No Conflicts</option>
                  </select>
                </div>
              </div>
            )}

            {/* Rules Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Rule Name</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Type</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Scope</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Priority</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Last Updated</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Test Results</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">{rule.name}</div>
                            <div className="text-sm text-gray-600 truncate max-w-xs">{rule.description}</div>
                            <div className="flex items-center gap-1 mt-1">
                              {rule.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {tag}
                                </span>
                              ))}
                              {rule.tags.length > 3 && (
                                <span className="text-xs text-gray-500">+{rule.tags.length - 3}</span>
                              )}
                            </div>
                            {rule.conflictsWith && rule.conflictsWith.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                                <span className="text-xs text-red-600">Has conflicts</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(rule.type)}`}>
                            {rule.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScopeBadge(rule.scope)}`}>
                            {rule.scope}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(rule.priority)}`}>
                              {getPriorityLabel(rule.priority)}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">{rule.priority}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(rule.status)}`}>
                            {rule.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{rule.lastModifiedDate}</div>
                          <div className="text-xs text-gray-500">by {rule.lastModifiedBy}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {rule.testResults ? (
                            <div className="text-sm">
                              <div className="font-medium text-green-600">{rule.testResults.accuracy.toFixed(1)}%</div>
                              <div className="text-xs text-gray-500">
                                {rule.testResults.hits}/{rule.testResults.sampleSize}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Not tested</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors" title="View rule">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-green-500 transition-colors" title="Edit rule">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-purple-500 transition-colors" title="Test rule">
                              <Play className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="More actions">
                              <MoreHorizontal className="w-4 h-4" />
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

        {activeTab === 'conflicts' && (
          <div className="p-6">
            <div className="space-y-4">
              {conflicts.map((conflict) => {
                const rule1 = rules.find(r => r.id === conflict.rule1Id);
                const rule2 = rules.find(r => r.id === conflict.rule2Id);
                
                return (
                  <div key={conflict.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConflictBadge(conflict.severity)}`}>
                            {conflict.severity} severity
                          </span>
                          <span className="text-sm text-gray-500 capitalize">{conflict.type}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="p-3 bg-red-50 border border-red-200 rounded">
                            <div className="font-medium text-red-900">Rule 1: {rule1?.name}</div>
                            <div className="text-sm text-red-700">{rule1?.description}</div>
                          </div>
                          <div className="p-3 bg-red-50 border border-red-200 rounded">
                            <div className="font-medium text-red-900">Rule 2: {rule2?.name}</div>
                            <div className="text-sm text-red-700">{rule2?.description}</div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-900 mb-2">
                          <strong>Issue:</strong> {conflict.description}
                        </div>
                        
                        <div className="text-sm text-gray-700 mb-3">
                          <strong>Recommendation:</strong> {conflict.recommendation}
                        </div>
                        
                        {conflict.resolved ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-600">Conflict resolved</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-600">Requires attention</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors" title="View details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-green-500 transition-colors" title="Resolve conflict">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'rule-packs' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rulePacks.map((pack) => (
                <div key={pack.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{pack.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{pack.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">{pack.rating}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Version:</span>
                      <span className="font-medium">{pack.version}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Author:</span>
                      <span className="font-medium">{pack.author}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Rules:</span>
                      <span className="font-medium">{pack.rulesCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Downloads:</span>
                      <span className="font-medium">{pack.downloadCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Updated:</span>
                      <span className="font-medium">{pack.lastUpdated}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {pack.tags.map((tag, index) => (
                      <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors flex-1">
                      <Download className="w-4 h-4" />
                      Import
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rule Editor Modal */}
      {showRuleEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Rule Editor</h3>
              <button 
                onClick={() => setShowRuleEditor(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                  <input
                    type="text"
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    placeholder="Enter rule name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
                  <select
                    value={ruleForm.type}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, type: e.target.value as Rule['type'] }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  >
                    <option value="payer_policy">Payer Policy</option>
                    <option value="NCCI">NCCI</option>
                    <option value="LCD">LCD</option>
                    <option value="NCD">NCD</option>
                    <option value="modifier">Modifier</option>
                    <option value="unit">Unit Rules</option>
                    <option value="prior_auth">Prior Auth</option>
                    <option value="bundling">Bundling</option>
                    <option value="coverage">Coverage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                  <select
                    value={ruleForm.scope}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, scope: e.target.value as Rule['scope'] }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  >
                    <option value="global">Global</option>
                    <option value="payer">Payer</option>
                    <option value="plan">Plan</option>
                    <option value="specialty">Specialty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority (1-100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={ruleForm.priority}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={ruleForm.description}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    rows={3}
                    placeholder="Describe this rule"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
                    <input
                      type="date"
                      value={ruleForm.effectiveDate}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                    <input
                      type="date"
                      value={ruleForm.expirationDate}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, expirationDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Conditions Builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Conditions (IF)</h4>
                  <button
                    onClick={addCondition}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#62d5e4] border border-[#62d5e4] rounded-lg hover:bg-[#62d5e4] hover:text-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Condition
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {conditions.map((condition, index) => (
                    <div key={condition.id} className="p-3 border border-gray-200 rounded-lg">
                      {index > 0 && (
                        <div className="mb-2">
                          <select
                            value={condition.logicalOperator || 'AND'}
                            onChange={(e) => updateCondition(condition.id, { logicalOperator: e.target.value as 'AND' | 'OR' })}
                            className="px-2 py-1 border border-gray-200 rounded text-sm bg-white"
                          >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                          </select>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={condition.field}
                          onChange={(e) => updateCondition(condition.id, { field: e.target.value as RuleCondition['field'] })}
                          className="px-2 py-1 border border-gray-200 rounded text-sm bg-white"
                        >
                          <option value="diagnosis">Diagnosis</option>
                          <option value="procedure">Procedure</option>
                          <option value="modifier">Modifier</option>
                          <option value="pos">Place of Service</option>
                          <option value="payer">Payer</option>
                          <option value="plan">Plan</option>
                          <option value="provider">Provider</option>
                          <option value="units">Units</option>
                          <option value="age">Age</option>
                          <option value="gender">Gender</option>
                        </select>
                        
                        <select
                          value={condition.operator}
                          onChange={(e) => updateCondition(condition.id, { operator: e.target.value as RuleCondition['operator'] })}
                          className="px-2 py-1 border border-gray-200 rounded text-sm bg-white"
                        >
                          <option value="equals">Equals</option>
                          <option value="not_equals">Not Equals</option>
                          <option value="contains">Contains</option>
                          <option value="in">In List</option>
                          <option value="not_in">Not In List</option>
                          <option value="greater_than">Greater Than</option>
                          <option value="less_than">Less Than</option>
                          <option value="between">Between</option>
                        </select>
                        
                        <input
                          type="text"
                          value={Array.isArray(condition.value) ? condition.value.join(', ') : condition.value?.toString() || ''}
                          onChange={(e) => {
                            const value = condition.operator === 'in' || condition.operator === 'not_in' 
                              ? e.target.value.split(',').map(v => v.trim())
                              : e.target.value;
                            updateCondition(condition.id, { value });
                          }}
                          className="px-2 py-1 border border-gray-200 rounded text-sm"
                          placeholder="Value"
                        />
                      </div>
                      
                      <button
                        onClick={() => removeCondition(condition.id)}
                        className="mt-2 p-1 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions Builder */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Actions (THEN)</h4>
                <button
                  onClick={addAction}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#62d5e4] border border-[#62d5e4] rounded-lg hover:bg-[#62d5e4] hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Action
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actions.map((action) => (
                  <div key={action.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <select
                        value={action.type}
                        onChange={(e) => updateAction(action.id, { type: e.target.value as RuleAction['type'] })}
                        className="px-2 py-1 border border-gray-200 rounded text-sm bg-white"
                      >
                        <option value="warn">Warning</option>
                        <option value="deny_claim">Deny Claim</option>
                        <option value="require_modifier">Require Modifier</option>
                        <option value="require_auth">Require Authorization</option>
                        <option value="limit_units">Limit Units</option>
                        <option value="bundle_codes">Bundle Codes</option>
                        <option value="adjust_amount">Adjust Amount</option>
                      </select>
                      
                      <select
                        value={action.severity}
                        onChange={(e) => updateAction(action.id, { severity: e.target.value as RuleAction['severity'] })}
                        className="px-2 py-1 border border-gray-200 rounded text-sm bg-white"
                      >
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    
                    <textarea
                      value={action.message}
                      onChange={(e) => updateAction(action.id, { message: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      rows={2}
                      placeholder="Action message"
                    />
                    
                    <button
                      onClick={() => removeAction(action.id)}
                      className="mt-2 p-1 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={saveRule}
                disabled={!ruleForm.name || conditions.length === 0 || actions.length === 0 || loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Rule
              </button>
              <button
                onClick={() => setShowRuleEditor(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Harness Modal */}
      {showTestHarness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Testing Harness</h3>
              <button 
                onClick={() => setShowTestHarness(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rules to Test</label>
                  <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {rules.map((rule) => (
                      <label key={rule.id} className="flex items-center gap-2 text-sm py-1">
                        <input
                          type="checkbox"
                          checked={testForm.ruleIds.includes(rule.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTestForm(prev => ({ ...prev, ruleIds: [...prev.ruleIds, rule.id] }));
                            } else {
                              setTestForm(prev => ({ ...prev, ruleIds: prev.ruleIds.filter(id => id !== rule.id) }));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="truncate">{rule.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sample Size</label>
                  <input
                    type="number"
                    value={testForm.sampleSize}
                    onChange={(e) => setTestForm(prev => ({ ...prev, sampleSize: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Claim Date Range</label>
                  <select
                    value={testForm.claimDateRange}
                    onChange={(e) => setTestForm(prev => ({ ...prev, claimDateRange: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  >
                    <option value="last_7_days">Last 7 Days</option>
                    <option value="last_30_days">Last 30 Days</option>
                    <option value="last_90_days">Last 90 Days</option>
                    <option value="last_year">Last Year</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={testForm.includeArchived}
                      onChange={(e) => setTestForm(prev => ({ ...prev, includeArchived: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Include archived claims</span>
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Test Configuration</span>
                </div>
                <div className="space-y-2 text-sm text-blue-800">
                  <div>Selected Rules: {testForm.ruleIds.length}</div>
                  <div>Sample Size: {testForm.sampleSize} claims</div>
                  <div>Date Range: {testForm.claimDateRange.replace('_', ' ')}</div>
                  <div>Include Archived: {testForm.includeArchived ? 'Yes' : 'No'}</div>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="text-sm text-yellow-800">
                    <strong>Note:</strong> Testing will run selected rules against the sample claims 
                    to identify hits, misses, and potential conflicts. Results will show rule 
                    accuracy and performance metrics.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={runTest}
                disabled={testForm.ruleIds.length === 0 || loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Run Test
              </button>
              <button
                onClick={() => setShowTestHarness(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}