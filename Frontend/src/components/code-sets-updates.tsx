import { useState, useEffect } from 'react';
import { 
  Database,
  Calendar,
  Clock,
  Download,
  Upload,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Bell,
  Search,
  Filter,
  RefreshCw,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  FileText,
  BookOpen,
  Code,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowLeft,
  History,
  GitBranch,
  Zap,
  Shield,
  Target,
  Users,
  Star,
  Flag,
  ExternalLink,
  Copy,
  Save,
  Layers,
  Hash,
  Tag,
  BarChart3,
  PieChart,
  Globe,
  Building,
  Stethoscope,
  Heart,
  Brain,
  Bone,
  Eye as EyeIcon,
  Baby,
  Pill,
  Scissors,
  Radiation,
  Microscope,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  PlayCircle,
  PauseCircle,
  FastForward,
  Rewind,
  SkipBack,
  SkipForward,
  Loader,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Link,
  Paperclip,
  FileCheck,
  FilePlus,
  FileX,
  Folder,
  FolderOpen,
  Archive,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';

interface CodeSet {
  id: string;
  name: string;
  type: 'ICD10' | 'CPT' | 'HCPCS';
  currentVersion: string;
  releaseDate: string;
  effectiveDate: string;
  status: 'active' | 'upcoming' | 'archived';
  totalCodes: number;
  updatedCodes: number;
  newCodes: number;
  retiredCodes: number;
  description: string;
  updateSchedule: UpdateSchedule;
  lastSyncDate?: string;
  nextSyncDate?: string;
}

interface UpdateSchedule {
  type: 'annual' | 'quarterly' | 'manual';
  months: number[]; // 1-12, representing months when updates occur
  autoSync: boolean;
  syncWindow: {
    start: string; // Time in HH:MM format
    end: string;
  };
  enabled: boolean;
}

interface CodeChange {
  id: string;
  codeSetId: string;
  codeSetType: 'ICD10' | 'CPT' | 'HCPCS';
  code: string;
  changeType: 'added' | 'retired' | 'renamed' | 'modified';
  oldValue?: string;
  newValue?: string;
  description: string;
  effectiveDate: string;
  impact: 'low' | 'medium' | 'high' | 'breaking';
  specialty?: string[];
  reason: string;
  replacementCode?: string;
  isBreaking: boolean;
}

interface Specialty {
  id: string;
  name: string;
  codes: string[];
  watchedCodeSets: string[];
  practitioners: number;
  icon: string;
}

interface UpdateNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'critical';
  codeSetId: string;
  changes: CodeChange[];
  created: string;
  dismissed: boolean;
  actionRequired: boolean;
}

interface SandboxValidation {
  id: string;
  name: string;
  codeSetVersion: string;
  sampleClaims: number;
  validClaims: number;
  invalidClaims: number;
  warnings: number;
  errors: ValidationError[];
  warnings_list: ValidationWarning[];
  status: 'running' | 'completed' | 'failed';
  created: string;
  completed?: string;
}

interface ValidationError {
  claimId: string;
  code: string;
  codeSet: string;
  message: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

interface ValidationWarning {
  claimId: string;
  code: string;
  codeSet: string;
  message: string;
  impact: string;
}

export function CodeSetsUpdates() {
  const [codeSets, setCodeSets] = useState<CodeSet[]>([]);
  const [codeChanges, setCodeChanges] = useState<CodeChange[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [notifications, setNotifications] = useState<UpdateNotification[]>([]);
  const [sandboxValidations, setSandboxValidations] = useState<SandboxValidation[]>([]);
  const [activeTab, setActiveTab] = useState('current-versions');
  const [selectedCodeSet, setSelectedCodeSet] = useState<string | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    codeSetType: 'all',
    changeType: 'all',
    impact: 'all',
    specialty: 'all',
    dateRange: 'all'
  });

  // Sandbox form
  const [sandboxForm, setSandboxForm] = useState({
    name: '',
    codeSetVersion: '',
    sampleSize: '100'
  });

  // Sample data
  const sampleCodeSets: CodeSet[] = [
    {
      id: 'icd10-2024',
      name: 'ICD-10-CM',
      type: 'ICD10',
      currentVersion: '2024',
      releaseDate: '2023-09-01',
      effectiveDate: '2023-10-01',
      status: 'active',
      totalCodes: 72816,
      updatedCodes: 298,
      newCodes: 395,
      retiredCodes: 287,
      description: 'International Classification of Diseases, 10th Revision, Clinical Modification',
      updateSchedule: {
        type: 'annual',
        months: [10], // October
        autoSync: true,
        syncWindow: {
          start: '02:00',
          end: '06:00'
        },
        enabled: true
      },
      lastSyncDate: '2023-10-01',
      nextSyncDate: '2024-10-01'
    },
    {
      id: 'cpt-2024',
      name: 'CPT',
      type: 'CPT',
      currentVersion: '2024',
      releaseDate: '2023-11-01',
      effectiveDate: '2024-01-01',
      status: 'active',
      totalCodes: 10155,
      updatedCodes: 156,
      newCodes: 230,
      retiredCodes: 89,
      description: 'Current Procedural Terminology',
      updateSchedule: {
        type: 'quarterly',
        months: [1, 4, 7, 10], // January, April, July, October
        autoSync: true,
        syncWindow: {
          start: '01:00',
          end: '05:00'
        },
        enabled: true
      },
      lastSyncDate: '2024-01-01',
      nextSyncDate: '2024-04-01'
    },
    {
      id: 'hcpcs-2024',
      name: 'HCPCS Level II',
      type: 'HCPCS',
      currentVersion: '2024',
      releaseDate: '2023-11-15',
      effectiveDate: '2024-01-01',
      status: 'active',
      totalCodes: 4873,
      updatedCodes: 89,
      newCodes: 156,
      retiredCodes: 67,
      description: 'Healthcare Common Procedure Coding System Level II',
      updateSchedule: {
        type: 'quarterly',
        months: [1, 4, 7, 10], // January, April, July, October
        autoSync: true,
        syncWindow: {
          start: '03:00',
          end: '07:00'
        },
        enabled: true
      },
      lastSyncDate: '2024-01-01',
      nextSyncDate: '2024-04-01'
    }
  ];

  const sampleSpecialties: Specialty[] = [
    {
      id: 'cardiology',
      name: 'Cardiology',
      codes: ['93000', '93005', '93010', 'I25.9', 'I50.9'],
      watchedCodeSets: ['cpt-2024', 'icd10-2024'],
      practitioners: 12,
      icon: 'heart'
    },
    {
      id: 'orthopedics',
      name: 'Orthopedics',
      codes: ['29881', '27447', '25600', 'M79.3', 'S72.001A'],
      watchedCodeSets: ['cpt-2024', 'icd10-2024'],
      practitioners: 8,
      icon: 'bone'
    },
    {
      id: 'ophthalmology',
      name: 'Ophthalmology',
      codes: ['92004', '92014', '66984', 'H25.9', 'H40.9'],
      watchedCodeSets: ['cpt-2024', 'icd10-2024'],
      practitioners: 5,
      icon: 'eye'
    }
  ];

  const sampleCodeChanges: CodeChange[] = [
    {
      id: 'change-001',
      codeSetId: 'icd10-2024',
      codeSetType: 'ICD10',
      code: 'Z87.891',
      changeType: 'added',
      newValue: 'Personal history of nicotine dependence',
      description: 'New code for tracking personal history of nicotine dependence',
      effectiveDate: '2024-10-01',
      impact: 'low',
      specialty: ['family-medicine', 'internal-medicine'],
      reason: 'Added to support tobacco cessation tracking',
      isBreaking: false
    },
    {
      id: 'change-002',
      codeSetId: 'cpt-2024',
      codeSetType: 'CPT',
      code: '99XXX',
      changeType: 'added',
      newValue: 'Remote therapeutic monitoring, physician review',
      description: 'New code for remote patient monitoring physician time',
      effectiveDate: '2024-01-01',
      impact: 'medium',
      specialty: ['cardiology', 'endocrinology'],
      reason: 'Support for remote patient monitoring programs',
      isBreaking: false
    },
    {
      id: 'change-003',
      codeSetId: 'cpt-2024',
      codeSetType: 'CPT',
      code: '99201',
      changeType: 'retired',
      oldValue: 'Office or other outpatient visit, new patient (Level 1)',
      description: 'Retired code, replaced by 99202-99205 time-based coding',
      effectiveDate: '2021-01-01',
      impact: 'breaking',
      specialty: ['all'],
      reason: 'E/M code revisions - use time-based or MDM-based coding',
      replacementCode: '99202',
      isBreaking: true
    }
  ];

  const sampleNotifications: UpdateNotification[] = [
    {
      id: 'notif-001',
      title: 'ICD-10 2024 Updates Available',
      message: '395 new codes and 287 retired codes will be effective October 1, 2024. Review changes before auto-sync.',
      type: 'warning',
      priority: 'high',
      codeSetId: 'icd10-2024',
      changes: sampleCodeChanges.filter(c => c.codeSetId === 'icd10-2024'),
      created: '2024-09-01',
      dismissed: false,
      actionRequired: true
    },
    {
      id: 'notif-002',
      title: 'Breaking Changes in CPT 2024',
      message: 'Several E/M codes have been retired. Claims using these codes will be rejected.',
      type: 'error',
      priority: 'critical',
      codeSetId: 'cpt-2024',
      changes: sampleCodeChanges.filter(c => c.isBreaking),
      created: '2023-12-15',
      dismissed: false,
      actionRequired: true
    }
  ];

  useEffect(() => {
    setCodeSets(sampleCodeSets);
    setCodeChanges(sampleCodeChanges);
    setSpecialties(sampleSpecialties);
    setNotifications(sampleNotifications);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: 'bg-green-100 text-green-800',
      upcoming: 'bg-blue-100 text-blue-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.active;
  };

  const getChangeBadge = (changeType: string) => {
    const changeMap = {
      added: 'bg-green-100 text-green-800',
      retired: 'bg-red-100 text-red-800',
      renamed: 'bg-yellow-100 text-yellow-800',
      modified: 'bg-blue-100 text-blue-800'
    };
    
    return changeMap[changeType as keyof typeof changeMap] || changeMap.modified;
  };

  const getImpactBadge = (impact: string) => {
    const impactMap = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      breaking: 'bg-red-100 text-red-800'
    };
    
    return impactMap[impact as keyof typeof impactMap] || impactMap.low;
  };

  const getNotificationBadge = (type: string) => {
    const typeMap = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      success: 'bg-green-100 text-green-800'
    };
    
    return typeMap[type as keyof typeof typeMap] || typeMap.info;
  };

  const getSpecialtyIcon = (iconName: string) => {
    switch (iconName) {
      case 'heart':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'bone':
        return <Bone className="w-5 h-5 text-gray-600" />;
      case 'eye':
        return <EyeIcon className="w-5 h-5 text-blue-500" />;
      case 'brain':
        return <Brain className="w-5 h-5 text-purple-500" />;
      default:
        return <Stethoscope className="w-5 h-5 text-green-500" />;
    }
  };

  const syncCodeSet = (codeSetId: string) => {
    setLoading(true);
    
    setTimeout(() => {
      setCodeSets(prev => prev.map(cs => 
        cs.id === codeSetId 
          ? { 
              ...cs, 
              lastSyncDate: new Date().toISOString().split('T')[0],
              nextSyncDate: getNextSyncDate(cs.updateSchedule)
            }
          : cs
      ));
      setLoading(false);
    }, 3000);
  };

  const getNextSyncDate = (schedule: UpdateSchedule): string => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Find next scheduled month
    const nextMonth = schedule.months.find(month => month > currentMonth) || 
                     schedule.months[0]; // If no month this year, use first month next year
    
    const nextYear = nextMonth > currentMonth ? currentYear : currentYear + 1;
    
    return new Date(nextYear, nextMonth - 1, 1).toISOString().split('T')[0];
  };

  const runSandboxValidation = () => {
    setLoading(true);
    
    setTimeout(() => {
      const newValidation: SandboxValidation = {
        id: `sandbox-${Date.now()}`,
        name: sandboxForm.name,
        codeSetVersion: sandboxForm.codeSetVersion,
        sampleClaims: parseInt(sandboxForm.sampleSize),
        validClaims: Math.floor(parseInt(sandboxForm.sampleSize) * 0.92),
        invalidClaims: Math.floor(parseInt(sandboxForm.sampleSize) * 0.08),
        warnings: Math.floor(parseInt(sandboxForm.sampleSize) * 0.15),
        errors: [],
        warnings_list: [],
        status: 'completed',
        created: new Date().toISOString(),
        completed: new Date().toISOString()
      };

      setSandboxValidations(prev => [...prev, newValidation]);
      setShowSandboxModal(false);
      setLoading(false);
      
      setSandboxForm({
        name: '',
        codeSetVersion: '',
        sampleSize: '100'
      });
    }, 5000);
  };

  const filteredCodeSets = codeSets.filter(codeSet => {
    const matchesSearch = codeSet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         codeSet.currentVersion.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filters.codeSetType === 'all' || codeSet.type === filters.codeSetType;
    
    return matchesSearch && matchesType;
  });

  const filteredCodeChanges = codeChanges.filter(change => {
    const matchesSearch = change.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         change.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filters.codeSetType === 'all' || change.codeSetType === filters.codeSetType;
    const matchesChange = filters.changeType === 'all' || change.changeType === filters.changeType;
    const matchesImpact = filters.impact === 'all' || change.impact === filters.impact;
    const matchesSpecialty = selectedSpecialty === null || 
                            change.specialty?.includes(selectedSpecialty) ||
                            change.specialty?.includes('all');
    
    return matchesSearch && matchesType && matchesChange && matchesImpact && matchesSpecialty;
  });

  const codeSet = selectedCodeSet ? codeSets.find(cs => cs.id === selectedCodeSet) : null;

  return (
    <div className="h-full bg-gray-50 flex flex-col max-w-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Code Sets & Updates</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage ICD-10, CPT, and HCPCS code updates with automated scheduling
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowWatchlistModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Star className="w-4 h-4" />
              Specialty Watchlist
            </button>
            
            <button 
              onClick={() => setShowSandboxModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Play className="w-4 h-4" />
              Sandbox Test
            </button>
            
            <button 
              onClick={() => setShowSchedulerModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors"
            >
              <Settings className="w-4 h-4" />
              Configure Sync
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Code Sets</p>
                <p className="text-lg font-semibold text-gray-900">
                  {codeSets.filter(cs => cs.status === 'active').length}
                </p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Codes</p>
                <p className="text-lg font-semibold text-gray-900">
                  {codeSets.reduce((sum, cs) => sum + cs.totalCodes, 0).toLocaleString()}
                </p>
              </div>
              <Code className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Changes</p>
                <p className="text-lg font-semibold text-gray-900">
                  {codeChanges.filter(c => new Date(c.effectiveDate) > new Date()).length}
                </p>
              </div>
              <GitBranch className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Breaking Changes</p>
                <p className="text-lg font-semibold text-gray-900">
                  {codeChanges.filter(c => c.isBreaking).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Notifications</p>
                <p className="text-lg font-semibold text-gray-900">
                  {notifications.filter(n => !n.dismissed).length}
                </p>
              </div>
              <Bell className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Notification Banner */}
        {notifications.filter(n => !n.dismissed && n.priority === 'critical').length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-900">Critical Code Set Updates Required</p>
                <p className="text-sm text-red-700">
                  Breaking changes detected that may affect claim processing. Review immediately.
                </p>
              </div>
              <button className="text-red-600 hover:text-red-800 transition-colors">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <nav className="flex space-x-8">
          {[
            { id: 'current-versions', label: 'Current Versions', icon: Database },
            { id: 'upcoming-updates', label: 'Upcoming Updates', icon: Calendar },
            { id: 'change-log', label: 'Change Log', icon: History },
            { id: 'scheduler', label: 'Scheduler', icon: Clock },
            { id: 'notifications', label: 'Notifications', icon: Bell }
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
        {activeTab === 'current-versions' && (
          <div className="p-4">
            {/* Search and Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search code sets..."
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
              <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Code Set Type</label>
                  <select
                    value={filters.codeSetType}
                    onChange={(e) => setFilters(prev => ({ ...prev, codeSetType: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
                  >
                    <option value="all">All Types</option>
                    <option value="ICD10">ICD-10</option>
                    <option value="CPT">CPT</option>
                    <option value="HCPCS">HCPCS</option>
                  </select>
                </div>
              </div>
            )}

            {/* Code Sets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCodeSets.map((codeSet) => (
                <div key={codeSet.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{codeSet.name}</h3>
                      <p className="text-sm text-gray-600">Version {codeSet.currentVersion}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(codeSet.status)}`}>
                      {codeSet.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Codes:</span>
                      <span className="font-medium">{codeSet.totalCodes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">{codeSet.lastSyncDate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Next Sync:</span>
                      <span className="font-medium">{codeSet.nextSyncDate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Auto Sync:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        codeSet.updateSchedule.autoSync ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {codeSet.updateSchedule.autoSync ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  {/* Change Summary */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                    <div className="bg-green-50 p-2 rounded text-center">
                      <div className="font-medium text-green-800">{codeSet.newCodes}</div>
                      <div className="text-green-600">New</div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded text-center">
                      <div className="font-medium text-blue-800">{codeSet.updatedCodes}</div>
                      <div className="text-blue-600">Updated</div>
                    </div>
                    <div className="bg-red-50 p-2 rounded text-center">
                      <div className="font-medium text-red-800">{codeSet.retiredCodes}</div>
                      <div className="text-red-600">Retired</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => syncCodeSet(codeSet.id)}
                      disabled={loading}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50 flex-1"
                    >
                      {loading ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Sync Now
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Settings className="w-4 h-4" />
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

        {activeTab === 'change-log' && (
          <div className="p-6">
            {/* Search and Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search changes..."
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
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {/* Specialty Filter */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-gray-600">Filter by specialty:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedSpecialty(null)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    selectedSpecialty === null 
                      ? 'bg-[#62d5e4] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {specialties.map((specialty) => (
                  <button
                    key={specialty.id}
                    onClick={() => setSelectedSpecialty(specialty.id)}
                    className={`flex items-center gap-2 px-3 py-1 text-sm rounded-lg transition-colors ${
                      selectedSpecialty === specialty.id 
                        ? 'bg-[#62d5e4] text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getSpecialtyIcon(specialty.icon)}
                    {specialty.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Code Set Type</label>
                  <select
                    value={filters.codeSetType}
                    onChange={(e) => setFilters(prev => ({ ...prev, codeSetType: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
                  >
                    <option value="all">All Types</option>
                    <option value="ICD10">ICD-10</option>
                    <option value="CPT">CPT</option>
                    <option value="HCPCS">HCPCS</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Change Type</label>
                  <select
                    value={filters.changeType}
                    onChange={(e) => setFilters(prev => ({ ...prev, changeType: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
                  >
                    <option value="all">All Changes</option>
                    <option value="added">Added</option>
                    <option value="retired">Retired</option>
                    <option value="renamed">Renamed</option>
                    <option value="modified">Modified</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Impact Level</label>
                  <select
                    value={filters.impact}
                    onChange={(e) => setFilters(prev => ({ ...prev, impact: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
                  >
                    <option value="all">All Impact</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="breaking">Breaking</option>
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
                    <option value="last-30">Last 30 Days</option>
                    <option value="last-90">Last 90 Days</option>
                    <option value="last-year">Last Year</option>
                  </select>
                </div>
              </div>
            )}

            {/* Changes List */}
            <div className="space-y-4">
              {filteredCodeChanges.map((change) => (
                <div key={change.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono font-medium text-gray-900">{change.code}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChangeBadge(change.changeType)}`}>
                          {change.changeType}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getImpactBadge(change.impact)}`}>
                          {change.impact}
                        </span>
                        <span className="text-xs text-gray-500 uppercase">{change.codeSetType}</span>
                        {change.isBreaking && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Breaking
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-900 mb-2">{change.description}</div>
                      
                      {change.oldValue && (
                        <div className="text-sm mb-2">
                          <span className="text-gray-600">Old: </span>
                          <span className="line-through text-red-600">{change.oldValue}</span>
                        </div>
                      )}
                      
                      {change.newValue && (
                        <div className="text-sm mb-2">
                          <span className="text-gray-600">New: </span>
                          <span className="text-green-600">{change.newValue}</span>
                        </div>
                      )}
                      
                      {change.replacementCode && (
                        <div className="text-sm mb-2">
                          <span className="text-gray-600">Replacement: </span>
                          <span className="font-mono text-blue-600">{change.replacementCode}</span>
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-600 mb-2">{change.reason}</div>
                      
                      {change.specialty && change.specialty.length > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-500">Affects:</span>
                          <div className="flex flex-wrap gap-1">
                            {change.specialty.map((spec, index) => (
                              <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Effective: {change.effectiveDate}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors" title="View details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Copy code">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="p-6">
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className={`bg-white rounded-lg border-l-4 p-4 ${
                  notification.type === 'error' ? 'border-red-500' :
                  notification.type === 'warning' ? 'border-yellow-500' :
                  notification.type === 'success' ? 'border-green-500' :
                  'border-blue-500'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">{notification.title}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getNotificationBadge(notification.type)}`}>
                          {notification.type}
                        </span>
                        <span className="text-xs text-gray-500">{notification.priority} priority</span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">{notification.message}</p>
                      
                      <div className="text-xs text-gray-500 mb-3">
                        Created: {notification.created} • {notification.changes.length} changes
                      </div>
                      
                      {notification.actionRequired && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-900">Action Required</span>
                          </div>
                          <p className="text-sm text-yellow-800 mt-1">
                            Review changes and update your billing procedures before the effective date.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors" title="View changes">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Dismiss">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sandbox Modal */}
      {showSandboxModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sandbox Validation</h3>
              <button 
                onClick={() => setShowSandboxModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Validation Name</label>
                <input
                  type="text"
                  value={sandboxForm.name}
                  onChange={(e) => setSandboxForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  placeholder="Enter validation name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code Set Version</label>
                <select
                  value={sandboxForm.codeSetVersion}
                  onChange={(e) => setSandboxForm(prev => ({ ...prev, codeSetVersion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                >
                  <option value="">Select code set version</option>
                  {codeSets.map(cs => (
                    <option key={cs.id} value={cs.id}>{cs.name} v{cs.currentVersion}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sample Size</label>
                <input
                  type="number"
                  value={sandboxForm.sampleSize}
                  onChange={(e) => setSandboxForm(prev => ({ ...prev, sampleSize: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  placeholder="100"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Sandbox Preview</span>
                </div>
                <div className="text-sm text-blue-800">
                  This will validate a sample of recent claims against the selected code set version 
                  to identify potential issues before going live.
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={runSandboxValidation}
                  disabled={!sandboxForm.name || !sandboxForm.codeSetVersion || loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Run Validation
                </button>
                <button
                  onClick={() => setShowSandboxModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Specialty Watchlist Modal */}
      {showWatchlistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Specialty Watchlist</h3>
              <button 
                onClick={() => setShowWatchlistModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {specialties.map((specialty) => (
                <div key={specialty.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getSpecialtyIcon(specialty.icon)}
                      <div>
                        <h4 className="font-medium text-gray-900">{specialty.name}</h4>
                        <p className="text-sm text-gray-600">{specialty.practitioners} practitioners</p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-[#62d5e4] transition-colors">
                      <Star className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Watched Codes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {specialty.codes.slice(0, 5).map((code, index) => (
                          <span key={index} className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {code}
                          </span>
                        ))}
                        {specialty.codes.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{specialty.codes.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-700">Monitored Code Sets:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {specialty.watchedCodeSets.map((csId, index) => {
                          const cs = codeSets.find(c => c.id === csId);
                          return cs ? (
                            <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {cs.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Recent relevant changes: {filteredCodeChanges.filter(c => 
                          c.specialty?.includes(specialty.id) || 
                          specialty.codes.some(code => c.code.includes(code))
                        ).length}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowWatchlistModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}