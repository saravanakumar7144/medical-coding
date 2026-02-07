import { useState, useEffect } from 'react';
import { 
  Building,
  CreditCard,
  DollarSign,
  Upload,
  Download,
  FileText,
  Settings,
  Edit,
  Eye,
  Trash2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Globe,
  Shield,
  Lock,
  Unlock,
  ArrowRight,
  ArrowLeft,
  Copy,
  Save,
  RotateCcw,
  History,
  GitBranch,
  Database,
  FileSpreadsheet,
  Columns,
  Users,
  Star,
  Flag,
  Target,
  Zap,
  Activity,
  BarChart3,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Link,
  FileCheck,
  Layers,
  Code,
  Hash,
  MapPin,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Diff,
  Split,
  Merge
} from 'lucide-react';

interface Payer {
  id: string;
  name: string;
  type: 'government' | 'commercial' | 'managed_care';
  payerIds: {
    primary: string;
    secondary?: string;
    npi?: string;
  };
  ediIdentifiers: {
    submitterId: string;
    receiverId: string;
    tradingPartnerId?: string;
  };
  portalInfo?: {
    url: string;
    username?: string;
    apiEndpoint?: string;
    apiKey?: string;
  };
  contactInfo: {
    address: string;
    phone: string;
    email: string;
    contactPerson: string;
  };
  status: 'active' | 'inactive' | 'suspended';
  effectiveDate: string;
  terminationDate?: string;
  createdDate: string;
  updatedDate: string;
}

interface Plan {
  id: string;
  payerId: string;
  name: string;
  planCode: string;
  planType: 'hmo' | 'ppo' | 'pos' | 'epo' | 'medicare' | 'medicaid';
  feeScheduleId?: string;
  effectiveDate: string;
  terminationDate?: string;
  copayRules: {
    primaryCare: number;
    specialist: number;
    emergency: number;
    urgentCare: number;
  };
  deductible: {
    individual: number;
    family: number;
  };
  status: 'active' | 'inactive' | 'draft';
  createdDate: string;
  updatedDate: string;
}

interface FeeSchedule {
  id: string;
  name: string;
  version: string;
  codeSetYear: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'active' | 'inactive' | 'draft' | 'pending_activation';
  uploadDate: string;
  uploadedBy: string;
  totalCodes: number;
  validationStatus: 'passed' | 'failed' | 'warning' | 'pending';
  validationReport?: ValidationReport;
  fileInfo: {
    filename: string;
    size: string;
    format: 'csv' | 'xlsx' | 'json';
  };
}

interface FeeScheduleEntry {
  id: string;
  feeScheduleId: string;
  code: string;
  modifier?: string;
  pos?: string;
  allowedAmount: number;
  description: string;
  effectiveFrom: string;
  effectiveTo?: string;
  createdDate: string;
}

interface ValidationReport {
  id: string;
  feeScheduleId: string;
  summary: {
    totalRecords: number;
    validRecords: number;
    errorRecords: number;
    warningRecords: number;
  };
  errors: ValidationError[];
  warnings: ValidationWarning[];
  duplicates: DuplicateEntry[];
  dateOverlaps: DateOverlap[];
  missingCodes: string[];
}

interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationWarning {
  row: number;
  field: string;
  value: string;
  message: string;
  suggestion?: string;
}

interface DuplicateEntry {
  code: string;
  modifier?: string;
  pos?: string;
  rows: number[];
  count: number;
}

interface DateOverlap {
  code: string;
  modifier?: string;
  pos?: string;
  overlappingPeriods: Array<{
    from: string;
    to: string;
    rows: number[];
  }>;
}

interface PlanRule {
  id: string;
  planId: string;
  ruleType: 'lcd' | 'ncd' | 'prior_auth' | 'bundling' | 'medical_necessity';
  procedureCode: string;
  diagnosisCodes?: string[];
  description: string;
  requirements: string;
  lcdNcdLink?: string;
  effectiveDate: string;
  terminationDate?: string;
  notes: string;
  status: 'active' | 'inactive';
}

export function PayersPlansFeeSschedules() {
  const [payers, setPayers] = useState<Payer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [feeSchedules, setFeeSchedules] = useState<FeeSchedule[]>([]);
  const [feeScheduleEntries, setFeeScheduleEntries] = useState<FeeScheduleEntry[]>([]);
  const [planRules, setPlanRules] = useState<PlanRule[]>([]);
  const [activeTab, setActiveTab] = useState('payers-plans');
  const [selectedPayer, setSelectedPayer] = useState<string | null>(null);
  const [selectedFeeSchedule, setSelectedFeeSchedule] = useState<string | null>(null);
  const [showNewPayerModal, setShowNewPayerModal] = useState(false);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showValidationReport, setShowValidationReport] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [payerForm, setPayerForm] = useState({
    name: '',
    type: 'commercial' as 'government' | 'commercial' | 'managed_care',
    primaryPayerId: '',
    submitterId: '',
    receiverId: '',
    portalUrl: '',
    address: '',
    phone: '',
    email: '',
    contactPerson: '',
    effectiveDate: ''
  });

  const [planForm, setPlanForm] = useState({
    name: '',
    planCode: '',
    planType: 'ppo' as 'hmo' | 'ppo' | 'pos' | 'epo' | 'medicare' | 'medicaid',
    feeScheduleId: '',
    effectiveDate: '',
    primaryCareCopay: '',
    specialistCopay: '',
    emergencyCopay: '',
    urgentCareCopay: '',
    individualDeductible: '',
    familyDeductible: ''
  });

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    payerType: 'all',
    planType: 'all',
    status: 'all',
    effectiveDate: 'all'
  });

  // Sample data
  const samplePayers: Payer[] = [
    {
      id: 'payer-001',
      name: 'Medicare Part B',
      type: 'government',
      payerIds: {
        primary: '00120',
        npi: '1234567890'
      },
      ediIdentifiers: {
        submitterId: 'MEDPB001',
        receiverId: 'MEDICARE',
        tradingPartnerId: 'TP001'
      },
      contactInfo: {
        address: '123 Medicare Blvd, Baltimore, MD 21244',
        phone: '1-800-MEDICARE',
        email: 'provider@medicare.gov',
        contactPerson: 'Provider Relations'
      },
      status: 'active',
      effectiveDate: '2024-01-01',
      createdDate: '2023-12-01',
      updatedDate: '2024-01-15'
    },
    {
      id: 'payer-002',
      name: 'Blue Cross Blue Shield',
      type: 'commercial',
      payerIds: {
        primary: 'BCBS001',
        secondary: 'BC001'
      },
      ediIdentifiers: {
        submitterId: 'BCBS001',
        receiverId: 'BCBSREC',
        tradingPartnerId: 'TP002'
      },
      portalInfo: {
        url: 'https://provider.bcbs.com',
        username: 'clinic_portal',
        apiEndpoint: 'https://api.bcbs.com/v1',
        apiKey: 'bcbs_api_key_encrypted'
      },
      contactInfo: {
        address: '456 Insurance Way, Chicago, IL 60601',
        phone: '1-800-BCBS-PRO',
        email: 'provider@bcbs.com',
        contactPerson: 'Provider Services'
      },
      status: 'active',
      effectiveDate: '2024-01-01',
      createdDate: '2023-11-15',
      updatedDate: '2024-01-20'
    }
  ];

  const samplePlans: Plan[] = [
    {
      id: 'plan-001',
      payerId: 'payer-002',
      name: 'BCBS Blue Choice PPO',
      planCode: 'BC-PPO-001',
      planType: 'ppo',
      feeScheduleId: 'fs-001',
      effectiveDate: '2024-01-01',
      copayRules: {
        primaryCare: 25,
        specialist: 50,
        emergency: 150,
        urgentCare: 75
      },
      deductible: {
        individual: 1500,
        family: 3000
      },
      status: 'active',
      createdDate: '2023-12-01',
      updatedDate: '2024-01-10'
    },
    {
      id: 'plan-002',
      payerId: 'payer-001',
      name: 'Medicare Part B Standard',
      planCode: 'MED-B-STD',
      planType: 'medicare',
      feeScheduleId: 'fs-002',
      effectiveDate: '2024-01-01',
      copayRules: {
        primaryCare: 0,
        specialist: 0,
        emergency: 0,
        urgentCare: 0
      },
      deductible: {
        individual: 240,
        family: 0
      },
      status: 'active',
      createdDate: '2023-11-01',
      updatedDate: '2024-01-01'
    }
  ];

  const sampleFeeSchedules: FeeSchedule[] = [
    {
      id: 'fs-001',
      name: 'BCBS PPO Fee Schedule 2024',
      version: '2024.1',
      codeSetYear: '2024',
      effectiveFrom: '2024-01-01',
      effectiveTo: '2024-12-31',
      status: 'active',
      uploadDate: '2023-12-15',
      uploadedBy: 'John Admin',
      totalCodes: 8450,
      validationStatus: 'passed',
      fileInfo: {
        filename: 'bcbs_fee_schedule_2024.xlsx',
        size: '2.4 MB',
        format: 'xlsx'
      }
    },
    {
      id: 'fs-002',
      name: 'Medicare RBRVS 2024',
      version: '2024.1',
      codeSetYear: '2024',
      effectiveFrom: '2024-01-01',
      status: 'active',
      uploadDate: '2023-11-30',
      uploadedBy: 'Sarah Manager',
      totalCodes: 12500,
      validationStatus: 'passed',
      fileInfo: {
        filename: 'medicare_rbrvs_2024.csv',
        size: '5.1 MB',
        format: 'csv'
      }
    },
    {
      id: 'fs-003',
      name: 'BCBS PPO Fee Schedule 2024.2 (Draft)',
      version: '2024.2',
      codeSetYear: '2024',
      effectiveFrom: '2024-07-01',
      status: 'draft',
      uploadDate: '2024-01-20',
      uploadedBy: 'Mike Editor',
      totalCodes: 8475,
      validationStatus: 'warning',
      fileInfo: {
        filename: 'bcbs_fee_schedule_2024_v2.xlsx',
        size: '2.5 MB',
        format: 'xlsx'
      }
    }
  ];

  const samplePlanRules: PlanRule[] = [
    {
      id: 'rule-001',
      planId: 'plan-001',
      ruleType: 'prior_auth',
      procedureCode: '72148',
      diagnosisCodes: ['M54.5', 'M54.2'],
      description: 'MRI Lumbar Spine - Prior Authorization Required',
      requirements: 'Prior authorization required for all MRI lumbar spine studies. Must have failed conservative treatment for 6 weeks.',
      effectiveDate: '2024-01-01',
      notes: 'Conservative treatment includes PT, medications, or injections',
      status: 'active'
    },
    {
      id: 'rule-002',
      planId: 'plan-002',
      ruleType: 'lcd',
      procedureCode: '93000',
      description: 'Electrocardiogram LCD',
      requirements: 'Must meet Medicare LCD requirements for ECG',
      lcdNcdLink: 'https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?lcdid=33682',
      effectiveDate: '2024-01-01',
      notes: 'Refer to CMS LCD for complete coverage criteria',
      status: 'active'
    }
  ];

  useEffect(() => {
    setPayers(samplePayers);
    setPlans(samplePlans);
    setFeeSchedules(sampleFeeSchedules);
    setPlanRules(samplePlanRules);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      draft: 'bg-yellow-100 text-yellow-800',
      pending_activation: 'bg-blue-100 text-blue-800'
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.active;
  };

  const getValidationBadge = (status: string) => {
    const statusMap = {
      passed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-blue-100 text-blue-800'
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const getPayerTypeIcon = (type: string) => {
    switch (type) {
      case 'government':
        return <Building className="w-4 h-4 text-blue-600" />;
      case 'commercial':
        return <CreditCard className="w-4 h-4 text-green-600" />;
      case 'managed_care':
        return <Users className="w-4 h-4 text-purple-600" />;
      default:
        return <Building className="w-4 h-4 text-gray-600" />;
    }
  };

  const createPayer = () => {
    setLoading(true);
    
    setTimeout(() => {
      const newPayer: Payer = {
        id: `payer-${Date.now()}`,
        name: payerForm.name,
        type: payerForm.type,
        payerIds: {
          primary: payerForm.primaryPayerId
        },
        ediIdentifiers: {
          submitterId: payerForm.submitterId,
          receiverId: payerForm.receiverId
        },
        portalInfo: payerForm.portalUrl ? {
          url: payerForm.portalUrl
        } : undefined,
        contactInfo: {
          address: payerForm.address,
          phone: payerForm.phone,
          email: payerForm.email,
          contactPerson: payerForm.contactPerson
        },
        status: 'active',
        effectiveDate: payerForm.effectiveDate,
        createdDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0]
      };

      setPayers(prev => [...prev, newPayer]);
      setShowNewPayerModal(false);
      setLoading(false);
      
      // Reset form
      setPayerForm({
        name: '',
        type: 'commercial',
        primaryPayerId: '',
        submitterId: '',
        receiverId: '',
        portalUrl: '',
        address: '',
        phone: '',
        email: '',
        contactPerson: '',
        effectiveDate: ''
      });
    }, 2000);
  };

  const createPlan = () => {
    if (!selectedPayer) return;
    
    setLoading(true);
    
    setTimeout(() => {
      const newPlan: Plan = {
        id: `plan-${Date.now()}`,
        payerId: selectedPayer,
        name: planForm.name,
        planCode: planForm.planCode,
        planType: planForm.planType,
        feeScheduleId: planForm.feeScheduleId || undefined,
        effectiveDate: planForm.effectiveDate,
        copayRules: {
          primaryCare: parseFloat(planForm.primaryCareCopay) || 0,
          specialist: parseFloat(planForm.specialistCopay) || 0,
          emergency: parseFloat(planForm.emergencyCopay) || 0,
          urgentCare: parseFloat(planForm.urgentCareCopay) || 0
        },
        deductible: {
          individual: parseFloat(planForm.individualDeductible) || 0,
          family: parseFloat(planForm.familyDeductible) || 0
        },
        status: 'active',
        createdDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0]
      };

      setPlans(prev => [...prev, newPlan]);
      setShowNewPlanModal(false);
      setLoading(false);
      
      // Reset form
      setPlanForm({
        name: '',
        planCode: '',
        planType: 'ppo',
        feeScheduleId: '',
        effectiveDate: '',
        primaryCareCopay: '',
        specialistCopay: '',
        emergencyCopay: '',
        urgentCareCopay: '',
        individualDeductible: '',
        familyDeductible: ''
      });
    }, 2000);
  };

  const uploadFeeSchedule = () => {
    if (!uploadFile) return;
    
    setLoading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          
          // Simulate validation
          setTimeout(() => {
            const newFeeSchedule: FeeSchedule = {
              id: `fs-${Date.now()}`,
              name: `Fee Schedule - ${uploadFile.name}`,
              version: '2024.3',
              codeSetYear: '2024',
              effectiveFrom: '2024-07-01',
              status: 'draft',
              uploadDate: new Date().toISOString().split('T')[0],
              uploadedBy: 'Current User',
              totalCodes: Math.floor(Math.random() * 10000) + 5000,
              validationStatus: Math.random() > 0.3 ? 'passed' : 'warning',
              fileInfo: {
                filename: uploadFile.name,
                size: `${(uploadFile.size / 1024 / 1024).toFixed(1)} MB`,
                format: uploadFile.name.endsWith('.xlsx') ? 'xlsx' : 
                       uploadFile.name.endsWith('.csv') ? 'csv' : 'json'
              }
            };

            setFeeSchedules(prev => [...prev, newFeeSchedule]);
            setShowUploadModal(false);
            setUploadFile(null);
            setUploadProgress(0);
            setLoading(false);
          }, 1000);
          
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  const activateFeeSchedule = (scheduleId: string) => {
    setFeeSchedules(prev => prev.map(fs => 
      fs.id === scheduleId 
        ? { ...fs, status: 'active' as const }
        : fs
    ));
  };

  const rollbackFeeSchedule = (scheduleId: string) => {
    setFeeSchedules(prev => prev.map(fs => 
      fs.id === scheduleId 
        ? { ...fs, status: 'inactive' as const }
        : fs
    ));
  };

  const filteredPayers = payers.filter(payer => {
    const matchesSearch = payer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payer.payerIds.primary.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filters.payerType === 'all' || payer.type === filters.payerType;
    const matchesStatus = filters.status === 'all' || payer.status === filters.status;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredPlans = plans.filter(plan => {
    if (selectedPayer && plan.payerId !== selectedPayer) return false;
    
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plan.planCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filters.planType === 'all' || plan.planType === filters.planType;
    const matchesStatus = filters.status === 'all' || plan.status === filters.status;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const payer = selectedPayer ? payers.find(p => p.id === selectedPayer) : null;
  const feeSchedule = selectedFeeSchedule ? feeSchedules.find(fs => fs.id === selectedFeeSchedule) : null;

  return (
    <div className="h-full bg-gray-50 flex flex-col max-w-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Payers, Plans & Fee Schedules</h1>
            <p className="text-sm text-gray-600 mt-1">
              Administer master data that drives pricing and billing rules
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Export Data
            </button>
            
            <button 
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Fee Schedule
            </button>
            
            <button 
              onClick={() => {
                if (activeTab === 'payers-plans') {
                  setShowNewPayerModal(true);
                } else if (activeTab === 'fee-schedules') {
                  setShowUploadModal(true);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors"
            >
              <Plus className="w-4 h-4" />
              {activeTab === 'payers-plans' ? 'Add Payer' : 'Upload Schedule'}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Payers</p>
                <p className="text-lg font-semibold text-gray-900">
                  {payers.filter(p => p.status === 'active').length}
                </p>
              </div>
              <Building className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Plans</p>
                <p className="text-lg font-semibold text-gray-900">
                  {plans.filter(p => p.status === 'active').length}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fee Schedules</p>
                <p className="text-lg font-semibold text-gray-900">
                  {feeSchedules.filter(fs => fs.status === 'active').length}
                </p>
              </div>
              <FileSpreadsheet className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Codes</p>
                <p className="text-lg font-semibold text-gray-900">
                  {feeSchedules.reduce((sum, fs) => sum + fs.totalCodes, 0).toLocaleString()}
                </p>
              </div>
              <Database className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Plan Rules</p>
                <p className="text-lg font-semibold text-gray-900">
                  {planRules.filter(r => r.status === 'active').length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-8">
          {[
            { id: 'payers-plans', label: 'Payers & Plans', icon: Building },
            { id: 'fee-schedules', label: 'Fee Schedules', icon: FileSpreadsheet },
            { id: 'plan-rules', label: 'Plan Rules', icon: Shield }
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
        {activeTab === 'payers-plans' && (
          <div className="p-4">
            <div className="grid grid-cols-3 gap-6">
              {/* Payers List */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Payers</h3>
                    <button 
                      onClick={() => setShowNewPayerModal(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Payer
                    </button>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search payers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 h-11 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {filteredPayers.map((payer) => (
                    <div
                      key={payer.id}
                      onClick={() => setSelectedPayer(payer.id)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedPayer === payer.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getPayerTypeIcon(payer.type)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{payer.name}</div>
                          <div className="text-sm text-gray-600">ID: {payer.payerIds.primary}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(payer.status)}`}>
                              {payer.status}
                            </span>
                            <span className="text-xs text-gray-500">{payer.type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payer Details */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">
                    {payer ? 'Payer Details' : 'Select a Payer'}
                  </h3>
                </div>
                
                {payer ? (
                  <div className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 pb-2 border-b border-gray-200">Basic Information</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium">{payer.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium capitalize">{payer.type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(payer.status)}`}>
                            {payer.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payer IDs */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Payer IDs</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Primary ID:</span>
                          <span className="font-mono">{payer.payerIds.primary}</span>
                        </div>
                        {payer.payerIds.secondary && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Secondary ID:</span>
                            <span className="font-mono">{payer.payerIds.secondary}</span>
                          </div>
                        )}
                        {payer.payerIds.npi && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">NPI:</span>
                            <span className="font-mono">{payer.payerIds.npi}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* EDI Identifiers */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">EDI Identifiers</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Submitter ID:</span>
                          <span className="font-mono">{payer.ediIdentifiers.submitterId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Receiver ID:</span>
                          <span className="font-mono">{payer.ediIdentifiers.receiverId}</span>
                        </div>
                        {payer.ediIdentifiers.tradingPartnerId && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Trading Partner:</span>
                            <span className="font-mono">{payer.ediIdentifiers.tradingPartnerId}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Portal Info */}
                    {payer.portalInfo && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Portal Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Portal URL:</span>
                            <a 
                              href={payer.portalInfo.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              Visit Portal
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button 
                          onClick={() => setShowNewPlanModal(true)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Plan
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>Select a payer to view details and manage plans</p>
                  </div>
                )}
              </div>

              {/* Plans List */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">
                    {payer ? `Plans - ${payer.name}` : 'Plans'}
                  </h3>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {filteredPlans.length > 0 ? (
                    filteredPlans.map((plan) => (
                      <div key={plan.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <div>
                          <div className="font-medium text-gray-900">{plan.name}</div>
                          <div className="text-sm text-gray-600">Code: {plan.planCode}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(plan.status)}`}>
                              {plan.status}
                            </span>
                            <span className="text-xs text-gray-500 uppercase">{plan.planType}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Effective: {plan.effectiveDate}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p>{payer ? 'No plans for this payer' : 'Select a payer to view plans'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fee-schedules' && (
          <div className="p-6">
            {/* Search and Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search fee schedules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                />
              </div>
              
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                Filters
              </button>
              
              <button 
                onClick={() => setShowDiffModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Diff className="w-4 h-4" />
                Compare Versions
              </button>
            </div>

            {/* Fee Schedules Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Name & Version</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">File Info</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Total Codes</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Effective Period</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Status</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Validation</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {feeSchedules.map((schedule) => (
                      <tr key={schedule.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">{schedule.name}</div>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <GitBranch className="w-3 h-3" />
                              Version {schedule.version}
                            </div>
                            <div className="text-xs text-gray-500">
                              Uploaded by {schedule.uploadedBy} on {schedule.uploadDate}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{schedule.fileInfo.filename}</div>
                            <div className="text-sm text-gray-600">{schedule.fileInfo.size}</div>
                            <div className="text-xs text-gray-500 uppercase">{schedule.fileInfo.format}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-medium text-gray-900">
                            {schedule.totalCodes.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            From: {schedule.effectiveFrom}
                          </div>
                          {schedule.effectiveTo && (
                            <div className="text-sm text-gray-600">
                              To: {schedule.effectiveTo}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(schedule.status)}`}>
                              {schedule.status.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getValidationBadge(schedule.validationStatus)}`}>
                              {schedule.validationStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedFeeSchedule(schedule.id);
                                setShowValidationReport(true);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                              title="View validation report"
                            >
                              <FileCheck className="w-4 h-4" />
                            </button>
                            {schedule.status === 'draft' && (
                              <button
                                onClick={() => activateFeeSchedule(schedule.id)}
                                className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                                title="Activate schedule"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {schedule.status === 'active' && (
                              <button
                                onClick={() => rollbackFeeSchedule(schedule.id)}
                                className="p-1 text-gray-400 hover:text-orange-500 transition-colors"
                                title="Rollback schedule"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
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

        {activeTab === 'plan-rules' && (
          <div className="p-6">
            {/* Search and Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search plan rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                />
              </div>
              
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                Filters
              </button>
              
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors">
                <Plus className="w-4 h-4" />
                Add Rule
              </button>
            </div>

            {/* Plan Rules Grid */}
            <div className="grid gap-4">
              {planRules.map((rule) => {
                const rulePlan = plans.find(p => p.id === rule.planId);
                const rulePayer = rulePlan ? payers.find(p => p.id === rulePlan.payerId) : null;
                
                return (
                  <div key={rule.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            {rule.ruleType === 'lcd' && <BookOpen className="w-4 h-4 text-blue-500" />}
                            {rule.ruleType === 'ncd' && <Shield className="w-4 h-4 text-purple-500" />}
                            {rule.ruleType === 'prior_auth' && <Lock className="w-4 h-4 text-orange-500" />}
                            {rule.ruleType === 'bundling' && <Layers className="w-4 h-4 text-green-500" />}
                            {rule.ruleType === 'medical_necessity' && <Target className="w-4 h-4 text-red-500" />}
                            <span className="font-medium text-gray-900 capitalize">
                              {rule.ruleType.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {rule.procedureCode}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(rule.status)}`}>
                            {rule.status}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>{rulePayer?.name}</strong> - {rulePlan?.name}
                        </div>
                        
                        <div className="text-sm text-gray-900 mb-2">{rule.description}</div>
                        
                        <div className="text-sm text-gray-600 mb-3">{rule.requirements}</div>
                        
                        {rule.diagnosisCodes && rule.diagnosisCodes.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs text-gray-500">Diagnosis Codes:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {rule.diagnosisCodes.map((code, index) => (
                                <span key={index} className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {code}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {rule.lcdNcdLink && (
                          <div className="mb-2">
                            <a 
                              href={rule.lcdNcdLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                            >
                              View LCD/NCD Documentation
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          Effective: {rule.effectiveDate}
                          {rule.terminationDate && ` - ${rule.terminationDate}`}
                        </div>
                        
                        {rule.notes && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                            <strong>Notes:</strong> {rule.notes}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors" title="Edit rule">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Delete rule">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* New Payer Modal */}
      {showNewPayerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Payer</h3>
              <button 
                onClick={() => setShowNewPayerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payer Name</label>
                  <input
                    type="text"
                    value={payerForm.name}
                    onChange={(e) => setPayerForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    placeholder="Enter payer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payer Type</label>
                  <select
                    value={payerForm.type}
                    onChange={(e) => setPayerForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  >
                    <option value="commercial">Commercial</option>
                    <option value="government">Government</option>
                    <option value="managed_care">Managed Care</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Payer ID</label>
                  <input
                    type="text"
                    value={payerForm.primaryPayerId}
                    onChange={(e) => setPayerForm(prev => ({ ...prev, primaryPayerId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    placeholder="Enter primary payer ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitter ID</label>
                  <input
                    type="text"
                    value={payerForm.submitterId}
                    onChange={(e) => setPayerForm(prev => ({ ...prev, submitterId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    placeholder="EDI submitter ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receiver ID</label>
                  <input
                    type="text"
                    value={payerForm.receiverId}
                    onChange={(e) => setPayerForm(prev => ({ ...prev, receiverId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    placeholder="EDI receiver ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Portal URL</label>
                  <input
                    type="url"
                    value={payerForm.portalUrl}
                    onChange={(e) => setPayerForm(prev => ({ ...prev, portalUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    placeholder="https://portal.payer.com"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={payerForm.address}
                    onChange={(e) => setPayerForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    rows={3}
                    placeholder="Enter complete address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={payerForm.phone}
                    onChange={(e) => setPayerForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={payerForm.email}
                    onChange={(e) => setPayerForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    placeholder="contact@payer.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={payerForm.contactPerson}
                    onChange={(e) => setPayerForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    placeholder="Contact person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={payerForm.effectiveDate}
                    onChange={(e) => setPayerForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={createPayer}
                disabled={!payerForm.name || !payerForm.primaryPayerId || loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create Payer
              </button>
              <button
                onClick={() => setShowNewPayerModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Plan Modal */}
      {showNewPlanModal && payer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Plan - {payer.name}</h3>
              <button 
                onClick={() => setShowNewPlanModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={planForm.name}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    placeholder="Enter plan name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Code</label>
                  <input
                    type="text"
                    value={planForm.planCode}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, planCode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    placeholder="Enter plan code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
                  <select
                    value={planForm.planType}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, planType: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  >
                    <option value="hmo">HMO</option>
                    <option value="ppo">PPO</option>
                    <option value="pos">POS</option>
                    <option value="epo">EPO</option>
                    <option value="medicare">Medicare</option>
                    <option value="medicaid">Medicaid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Schedule</label>
                  <select
                    value={planForm.feeScheduleId}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, feeScheduleId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  >
                    <option value="">Select fee schedule</option>
                    {feeSchedules.filter(fs => fs.status === 'active').map(fs => (
                      <option key={fs.id} value={fs.id}>{fs.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={planForm.effectiveDate}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Copay Rules</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Primary Care</label>
                      <input
                        type="number"
                        step="0.01"
                        value={planForm.primaryCareCopay}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, primaryCareCopay: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Specialist</label>
                      <input
                        type="number"
                        step="0.01"
                        value={planForm.specialistCopay}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, specialistCopay: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Emergency</label>
                      <input
                        type="number"
                        step="0.01"
                        value={planForm.emergencyCopay}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, emergencyCopay: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Urgent Care</label>
                      <input
                        type="number"
                        step="0.01"
                        value={planForm.urgentCareCopay}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, urgentCareCopay: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Deductibles</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Individual</label>
                      <input
                        type="number"
                        step="0.01"
                        value={planForm.individualDeductible}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, individualDeductible: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Family</label>
                      <input
                        type="number"
                        step="0.01"
                        value={planForm.familyDeductible}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, familyDeductible: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={createPlan}
                disabled={!planForm.name || !planForm.planCode || loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create Plan
              </button>
              <button
                onClick={() => setShowNewPlanModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Fee Schedule Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Fee Schedule</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.json"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <div className="text-sm text-gray-600">
                      {uploadFile ? (
                        <div>
                          <div className="font-medium text-gray-900">{uploadFile.name}</div>
                          <div className="text-gray-500">{(uploadFile.size / 1024 / 1024).toFixed(1)} MB</div>
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium text-[#62d5e4] hover:text-[#4bc5d6]">
                            Click to upload
                          </span> or drag and drop
                          <div className="text-xs text-gray-500 mt-1">
                            CSV, XLSX, or JSON files only
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Format Requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Required Columns</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div><strong>Code:</strong> Procedure code (required)</div>
                  <div><strong>Modifier:</strong> Procedure modifier (optional)</div>
                  <div><strong>POS:</strong> Place of service (optional)</div>
                  <div><strong>Allowed:</strong> Allowed amount (required)</div>
                  <div><strong>Effective From:</strong> Start date (required)</div>
                  <div><strong>Effective To:</strong> End date (optional)</div>
                  <div><strong>Version:</strong> Version identifier (required)</div>
                  <div><strong>Code-set Year:</strong> Code set year (required)</div>
                </div>
              </div>

              {/* Upload Progress */}
              {loading && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Uploading and validating...</span>
                    <span className="text-sm text-gray-700">{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#62d5e4] h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={uploadFeeSchedule}
                  disabled={!uploadFile || loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload & Validate
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}