import { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft,
  Save,
  Check,
  AlertTriangle,
  Send,
  Printer,
  MoreHorizontal,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Copy,
  Lock,
  Archive,
  Eye,
  EyeOff,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  DollarSign,
  FileText,
  Shield,
  Lightbulb,
  Zap,
  Target,
  AlertCircle,
  Star,
  Filter,
  RefreshCw,
  Settings,
  BookOpen,
  Activity,
  Calculator,
  Banknote,
  TrendingUp,
  Bell,
  Workflow,
  Brain,
  HelpCircle,
  CheckSquare,
  AlertOctagon,
  BarChart3
} from 'lucide-react';

interface ClaimData {
  id: string;
  claimNumber: string;
  patient: {
    name: string;
    mrn: string;
    dob: string;
    gender: string;
    address: string;
  };
  encounter: {
    dateOfService: string;
    location: string;
    posCode: string;
    renderingProvider: string;
    billingProvider: string;
  };
  insurance: {
    payer: string;
    plan: string;
    memberId: string;
    groupNumber: string;
    policyNumber: string;
    subscriber: string;
    relationship: string;
    copay: number;
    deductible: number;
    eligibilityStatus: string;
  };
  amounts: {
    totalCharge: number;
    allowedAmount?: number;
    patientResponsibility?: number;
  };
  status: string;
}

interface DiagnosisCode {
  id: string;
  code: string;
  description: string;
  specificity: 'low' | 'medium' | 'high';
  source: string;
  primary: boolean;
  pointers: number[];
}

interface ProcedureCode {
  id: string;
  code: string;
  description: string;
  inHouse: boolean;
  units: number;
  modifiers: string[];
  dxPointers: number[];
  charge: number;
  allowedAmount?: number;
  ncciConflicts: string[];
  lcdRequirements: string[];
  priorAuthNumber?: string;
}

interface QualityMeasure {
  id: string;
  code: string;
  description: string;
  category: string;
  suggested: boolean;
  rationale: string;
  source: string;
}

interface ProgressNote {
  id: string;
  section: string;
  content: string;
  highlighted: boolean;
  relevantCodes: string[];
}

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  field: string;
  oldValue: string;
  newValue: string;
  ruleApplied?: string;
}

interface FeeScheduleSuggestion {
  id: string;
  code: string;
  description: string;
  units: number;
  modifiers: string[];
  allowedAmount: number;
  patientOOP: number;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  payer: string;
  policy: string;
  feeVersion: string;
  effectiveDate: string;
  isTopPick: boolean;
}

interface HCCCondition {
  id: string;
  hccCode: string;
  condition: string;
  icdCode: string;
  rafValue: number;
  confidence: number;
  evidence: {
    noteSpans: string[];
    labs: string[];
    problemList: string[];
  };
  status: 'suspected' | 'accepted' | 'rejected';
  reason?: string;
}

interface UnitCalculation {
  drugName: string;
  ndcCode: string;
  jCode: string;
  doseOrdered: number;
  concentration: number;
  vials: number;
  roundingRule: string;
  wastage: boolean;
  calculatedUnits: number;
  modifiers: string[];
}

interface PriorAuthPrompt {
  id: string;
  code: string;
  description: string;
  required: boolean;
  reason: string;
  payer: string;
  policyLink: string;
  clinicalCriteria: string[];
  status: 'pending' | 'started' | 'approved' | 'denied';
}

export function ClaimWorkspace({ claimId, onClose }: { claimId: string; onClose: () => void }) {
  const [mode, setMode] = useState<'coding' | 'billing'>('coding');
  const [activeTab, setActiveTab] = useState('diagnoses');
  const [claimData, setClaimData] = useState<ClaimData | null>(null);
  const [diagnoses, setDiagnoses] = useState<DiagnosisCode[]>([]);
  const [procedures, setProcedures] = useState<ProcedureCode[]>([]);
  const [qualityMeasures, setQualityMeasures] = useState<QualityMeasure[]>([]);
  const [progressNotes, setProgressNotes] = useState<ProgressNote[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [selectedCodeId, setSelectedCodeId] = useState<string | null>(null);
  const [showSidecar, setShowSidecar] = useState(true);
  const [autoSaving, setAutoSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [currentStep, setCurrentStep] = useState(1);
  
  // New feature states
  const [feeSuggestions, setFeeSuggestions] = useState<FeeScheduleSuggestion[]>([]);
  const [hccConditions, setHccConditions] = useState<HCCCondition[]>([]);
  const [currentRAF, setCurrentRAF] = useState(0);
  const [unitCalculations, setUnitCalculations] = useState<UnitCalculation[]>([]);
  const [priorAuthPrompts, setPriorAuthPrompts] = useState<PriorAuthPrompt[]>([]);
  const [showHCCPanel, setShowHCCPanel] = useState(false);
  const [showUnitCalculator, setShowUnitCalculator] = useState(false);
  const [loadingFeeSuggestions, setLoadingFeeSuggestions] = useState(false);
  const [showPAPrompt, setShowPAPrompt] = useState(false);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Sample data initialization
  useEffect(() => {
    // Initialize with sample data
    setClaimData({
      id: claimId,
      claimNumber: 'CLM240001',
      patient: {
        name: 'John Smith',
        mrn: 'MRN-2024-001',
        dob: '1975-06-15',
        gender: 'Male',
        address: '123 Main St, City, State 12345'
      },
      encounter: {
        dateOfService: '2024-01-15',
        location: 'Main Clinic',
        posCode: '11',
        renderingProvider: 'Dr. Sarah Johnson',
        billingProvider: 'Main Medical Group'
      },
      insurance: {
        payer: 'Medicare Part B',
        plan: 'Medicare Traditional',
        memberId: '1AB2C3D4EF5',
        groupNumber: 'N/A',
        policyNumber: 'POL-123456',
        subscriber: 'John Smith',
        relationship: 'Self',
        copay: 20,
        deductible: 250,
        eligibilityStatus: 'Active'
      },
      amounts: {
        totalCharge: 2450.00,
        allowedAmount: 1960.00,
        patientResponsibility: 390.00
      },
      status: 'In Progress'
    });

    setDiagnoses([
      {
        id: 'dx1',
        code: 'I10',
        description: 'Essential (primary) hypertension',
        specificity: 'high',
        source: 'Assessment',
        primary: true,
        pointers: [1]
      },
      {
        id: 'dx2',
        code: 'E11.9',
        description: 'Type 2 diabetes mellitus without complications',
        specificity: 'medium',
        source: 'History',
        primary: false,
        pointers: [2]
      }
    ]);

    setProcedures([
      {
        id: 'proc1',
        code: '99213',
        description: 'Office visit, established patient, level 3',
        inHouse: false,
        units: 1,
        modifiers: [],
        dxPointers: [1, 2],
        charge: 150.00,
        allowedAmount: 120.00,
        ncciConflicts: [],
        lcdRequirements: ['Medical necessity documentation'],
        priorAuthNumber: undefined
      }
    ]);

    setQualityMeasures([
      {
        id: 'qual1',
        code: '3074F',
        description: 'Most recent systolic blood pressure documented',
        category: 'Hypertension',
        suggested: true,
        rationale: 'Patient has hypertension diagnosis and BP was recorded',
        source: 'Vitals'
      }
    ]);

    setProgressNotes([
      {
        id: 'note1',
        section: 'Chief Complaint',
        content: 'Patient presents for routine follow-up of hypertension and diabetes.',
        highlighted: false,
        relevantCodes: ['I10', 'E11.9']
      },
      {
        id: 'note2',
        section: 'Assessment & Plan',
        content: 'Continue current medications for hypertension. Diabetes well controlled. Follow up in 3 months.',
        highlighted: false,
        relevantCodes: ['I10', 'E11.9', '99213']
      }
    ]);

    // Initialize new feature data
    setFeeSuggestions([
      {
        id: 'fs1',
        code: '99213',
        description: 'Office visit, established patient, level 3',
        units: 1,
        modifiers: ['25'],
        allowedAmount: 120.00,
        patientOOP: 24.00,
        confidence: 'high',
        reason: 'Based on Medicare Part B fee schedule and documented complexity',
        payer: 'Medicare Part B',
        policy: 'Traditional Medicare',
        feeVersion: '2024',
        effectiveDate: '2024-01-01',
        isTopPick: true
      }
    ]);

    setHccConditions([
      {
        id: 'hcc1',
        hccCode: 'HCC18',
        condition: 'Diabetes with complications',
        icdCode: 'E11.9',
        rafValue: 0.104,
        confidence: 85,
        evidence: {
          noteSpans: ['diabetes well controlled', 'continue medications'],
          labs: ['HbA1c: 7.2%'],
          problemList: ['Type 2 diabetes mellitus']
        },
        status: 'suspected'
      },
      {
        id: 'hcc2',
        hccCode: 'HCC85',
        condition: 'Hypertension',
        icdCode: 'I10',
        rafValue: 0.323,
        confidence: 92,
        evidence: {
          noteSpans: ['routine follow-up of hypertension'],
          labs: ['BP: 140/90'],
          problemList: ['Essential hypertension']
        },
        status: 'suspected'
      }
    ]);

    setCurrentRAF(0.427);

    setPriorAuthPrompts([
      {
        id: 'pa1',
        code: '93306',
        description: 'Echocardiography, transthoracic',
        required: true,
        reason: 'Requires prior authorization for Medicare patients',
        payer: 'Medicare Part B',
        policyLink: 'https://cms.gov/pa-requirements',
        clinicalCriteria: ['Documented heart failure', 'Abnormal EKG', 'Chest pain workup'],
        status: 'pending'
      }
    ]);
  }, [claimId]);

  const claimJourneySteps = [
    { id: 1, name: 'Clinical', status: 'complete', errors: 0, warnings: 0 },
    { id: 2, name: 'Codes', status: 'active', errors: 1, warnings: 2 },
    { id: 3, name: 'Price', status: 'pending', errors: 0, warnings: 0 },
    { id: 4, name: 'Validate', status: 'pending', errors: 0, warnings: 0 },
    { id: 5, name: 'Submit', status: 'pending', errors: 0, warnings: 0 },
    { id: 6, name: 'Post', status: 'pending', errors: 0, warnings: 0 },
    { id: 7, name: 'Resolve', status: 'pending', errors: 0, warnings: 0 },
    { id: 8, name: 'Close', status: 'pending', errors: 0, warnings: 0 }
  ];

  const getStepIcon = (step: typeof claimJourneySteps[0]) => {
    if (step.status === 'complete') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (step.status === 'active') return <Clock className="w-4 h-4 text-[#62d5e4]" />;
    if (step.errors > 0) return <XCircle className="w-4 h-4 text-red-500" />;
    if (step.warnings > 0) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
  };

  const handleAutoSave = () => {
    setAutoSaving(true);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      setAutoSaving(false);
      // Simulate save
      console.log('Auto-saved claim data');
    }, 1000);
  };

  const addDiagnosis = () => {
    const newDx: DiagnosisCode = {
      id: `dx${Date.now()}`,
      code: '',
      description: '',
      specificity: 'medium',
      source: 'Manual',
      primary: false,
      pointers: []
    };
    setDiagnoses(prev => [...prev, newDx]);
    handleAutoSave();
  };

  const addProcedure = () => {
    const newProc: ProcedureCode = {
      id: `proc${Date.now()}`,
      code: '',
      description: '',
      inHouse: false,
      units: 1,
      modifiers: [],
      dxPointers: [],
      charge: 0,
      ncciConflicts: [],
      lcdRequirements: []
    };
    setProcedures(prev => [...prev, newProc]);
    handleAutoSave();
  };

  const highlightProgressNote = (noteId: string, codeId: string) => {
    setProgressNotes(prev => prev.map(note => ({
      ...note,
      highlighted: note.id === noteId && note.relevantCodes.includes(codeId)
    })));
  };

  const validateClaim = () => {
    const errors: Record<string, string[]> = {};
    
    // Sample validation logic
    if (diagnoses.length === 0) {
      errors.diagnoses = ['At least one diagnosis is required'];
    }
    
    if (procedures.length === 0) {
      errors.procedures = ['At least one procedure is required'];
    }
    
    procedures.forEach((proc, index) => {
      if (!proc.code) {
        if (!errors.procedures) errors.procedures = [];
        errors.procedures.push(`Procedure ${index + 1}: Code is required`);
      }
      if (proc.dxPointers.length === 0) {
        if (!errors.procedures) errors.procedures = [];
        errors.procedures.push(`Procedure ${index + 1}: Diagnosis pointers required`);
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkEligibility = () => {
    console.log('Checking eligibility for patient...');
    // This would trigger eligibility check and update claim data
  };

  const checkPriorAuth = () => {
    // Check if procedures require prior authorization
    const requiresAuth = procedures.some(proc => 
      proc.lcdRequirements.some(req => req.toLowerCase().includes('authorization'))
    );
    
    if (requiresAuth) {
      console.log('Prior authorization required for this claim');
      return false;
    }
    return true;
  };

  const submitClaim = () => {
    if (validateClaim() && checkPriorAuth()) {
      console.log('Submitting claim...');
      // Handle submission
    } else {
      console.log('Cannot submit: validation failed or authorization required');
    }
  };

  // Fee Schedule Suggestions
  const fetchFeeSuggestions = async (procedureCode: string) => {
    setLoadingFeeSuggestions(true);
    // Simulate API call
    setTimeout(() => {
      setFeeSuggestions([
        {
          id: `fs_${Date.now()}`,
          code: procedureCode,
          description: 'Office visit, established patient, level 3',
          units: 1,
          modifiers: ['25'],
          allowedAmount: 120.00,
          patientOOP: 24.00,
          confidence: 'high',
          reason: 'Based on Medicare Part B fee schedule and documented complexity',
          payer: 'Medicare Part B',
          policy: 'Traditional Medicare',
          feeVersion: '2024',
          effectiveDate: '2024-01-01',
          isTopPick: true
        }
      ]);
      setLoadingFeeSuggestions(false);
    }, 1000);
  };

  const applyFeeSuggestion = (suggestion: FeeScheduleSuggestion) => {
    setProcedures(prev => prev.map(proc => 
      proc.code === suggestion.code ? {
        ...proc,
        units: suggestion.units,
        modifiers: suggestion.modifiers,
        allowedAmount: suggestion.allowedAmount
      } : proc
    ));
    handleAutoSave();
  };

  // HCC Management
  const acceptHCCCondition = (hccId: string) => {
    setHccConditions(prev => prev.map(hcc => 
      hcc.id === hccId ? { ...hcc, status: 'accepted' as const } : hcc
    ));
    
    // Auto-add diagnosis if accepted
    const hcc = hccConditions.find(h => h.id === hccId);
    if (hcc && !diagnoses.find(dx => dx.code === hcc.icdCode)) {
      const newDx: DiagnosisCode = {
        id: `dx_hcc_${Date.now()}`,
        code: hcc.icdCode,
        description: hcc.condition,
        specificity: 'high',
        source: 'HCC',
        primary: false,
        pointers: []
      };
      setDiagnoses(prev => [...prev, newDx]);
    }
    
    updateRAFScore();
    handleAutoSave();
  };

  const rejectHCCCondition = (hccId: string, reason: string) => {
    setHccConditions(prev => prev.map(hcc => 
      hcc.id === hccId ? { ...hcc, status: 'rejected' as const, reason } : hcc
    ));
    updateRAFScore();
    handleAutoSave();
  };

  const updateRAFScore = () => {
    const acceptedHCCs = hccConditions.filter(hcc => hcc.status === 'accepted');
    const totalRAF = acceptedHCCs.reduce((sum, hcc) => sum + hcc.rafValue, 0);
    setCurrentRAF(totalRAF);
  };

  // Unit Calculator
  const calculateUnits = (calculation: Partial<UnitCalculation>) => {
    const { doseOrdered = 0, concentration = 1, vials = 1, wastage = false } = calculation;
    const baseUnits = Math.ceil((doseOrdered / concentration) * vials);
    const finalUnits = wastage ? baseUnits + Math.ceil(baseUnits * 0.1) : baseUnits;
    
    return {
      ...calculation,
      calculatedUnits: finalUnits,
      modifiers: wastage ? ['JW'] : []
    } as UnitCalculation;
  };

  // Prior Authorization
  const startPriorAuth = (promptId: string) => {
    setPriorAuthPrompts(prev => prev.map(pa => 
      pa.id === promptId ? { ...pa, status: 'started' as const } : pa
    ));
    console.log('Starting prior authorization process...');
  };

  const checkClaimStatus = () => {
    console.log('Checking real-time claim status...');
    // This would integrate with payer portals and EDI systems
  };

  if (!claimData) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Claim Workspace</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <span>{claimData.patient.name}</span>
                <span>•</span>
                <span>MRN: {claimData.patient.mrn}</span>
                <span>•</span>
                <span>DOS: {claimData.encounter.dateOfService}</span>
                <span>•</span>
                <span>{claimData.encounter.location}</span>
                <span>•</span>
                <span>POS: {claimData.encounter.posCode}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('coding')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  mode === 'coding' 
                    ? 'bg-white text-[#62d5e4] shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Coding
              </button>
              <button
                onClick={() => setMode('billing')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  mode === 'billing' 
                    ? 'bg-white text-[#62d5e4] shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Billing
              </button>
            </div>

            {autoSaving && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-[#62d5e4] border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={checkEligibility}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Check Eligibility
              </button>
              
              <button 
                onClick={validateClaim}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Validate
              </button>
              
              <button 
                onClick={submitClaim}
                className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors"
              >
                <Send className="w-4 h-4" />
                Submit
              </button>
              
              <div className="relative">
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Patient & Insurance Info */}
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Provider Information</h3>
            <div className="space-y-1 text-gray-600">
              <div>Rendering: {claimData.encounter.renderingProvider}</div>
              <div>Billing: {claimData.encounter.billingProvider}</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Insurance</h3>
            <div className="space-y-1 text-gray-600">
              <div>{claimData.insurance.payer}</div>
              <div>Member ID: {claimData.insurance.memberId}</div>
              <div>Status: <span className="text-green-600">{claimData.insurance.eligibilityStatus}</span></div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Financial</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Charge:</span>
                <span className="font-medium">${claimData.amounts.totalCharge.toFixed(2)}</span>
              </div>
              {mode === 'billing' && claimData.amounts.allowedAmount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Allowed:</span>
                  <span className="font-medium text-green-600">${claimData.amounts.allowedAmount.toFixed(2)}</span>
                </div>
              )}
              {claimData.amounts.patientResponsibility && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Patient Resp:</span>
                  <span className="font-medium">${claimData.amounts.patientResponsibility.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Stepper */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-4">Claim Journey</h3>
          <div className="space-y-3">
            {claimJourneySteps.map((step, index) => (
              <div 
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  step.id === currentStep ? 'bg-cyan-50 text-[#62d5e4]' : 'hover:bg-gray-50'
                }`}
              >
                {getStepIcon(step)}
                <div className="flex-1">
                  <div className="text-sm font-medium">{step.name}</div>
                  {(step.errors > 0 || step.warnings > 0) && (
                    <div className="flex items-center gap-2 text-xs">
                      {step.errors > 0 && (
                        <span className="text-red-600">{step.errors} errors</span>
                      )}
                      {step.warnings > 0 && (
                        <span className="text-yellow-600">{step.warnings} warnings</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${showSidecar ? 'mr-80' : ''}`}>
          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200 px-6">
            <nav className="flex space-x-8">
              {[
                { id: 'diagnoses', label: 'Diagnoses', icon: Target },
                { id: 'procedures', label: 'Procedures', icon: Activity },
                { id: 'hcc', label: 'HCC/RAF', icon: BarChart3 },
                { id: 'quality', label: 'Quality', icon: Star },
                { id: 'insurance', label: 'Insurance', icon: Shield },
                { id: 'attachments', label: 'Attachments', icon: FileText },
                { id: 'history', label: 'History', icon: Clock }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors ${
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

          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'diagnoses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Diagnosis Codes (ICD-10)</h2>
                  <button 
                    onClick={addDiagnosis}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#62d5e4] border border-[#62d5e4] rounded-lg hover:bg-cyan-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Diagnosis
                  </button>
                </div>

                {validationErrors.diagnoses && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Validation Errors:</span>
                    </div>
                    <ul className="mt-1 text-sm text-red-600">
                      {validationErrors.diagnoses.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Primary</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Code</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Specificity</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Source</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {diagnoses.map((diagnosis) => (
                        <tr key={diagnosis.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="radio"
                              name="primaryDx"
                              checked={diagnosis.primary}
                              onChange={() => {
                                setDiagnoses(prev => prev.map(dx => ({
                                  ...dx,
                                  primary: dx.id === diagnosis.id
                                })));
                                handleAutoSave();
                              }}
                              className="text-[#62d5e4] focus:ring-[#62d5e4]"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={diagnosis.code}
                              onChange={(e) => {
                                setDiagnoses(prev => prev.map(dx => 
                                  dx.id === diagnosis.id ? { ...dx, code: e.target.value } : dx
                                ));
                                handleAutoSave();
                              }}
                              className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                              placeholder="Enter ICD-10 code"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={diagnosis.description}
                              onChange={(e) => {
                                setDiagnoses(prev => prev.map(dx => 
                                  dx.id === diagnosis.id ? { ...dx, description: e.target.value } : dx
                                ));
                                handleAutoSave();
                              }}
                              className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                              placeholder="Description"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              diagnosis.specificity === 'high' ? 'bg-green-100 text-green-800' :
                              diagnosis.specificity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {diagnosis.specificity}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {diagnosis.source}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedCodeId(diagnosis.id);
                                  highlightProgressNote('note1', diagnosis.code);
                                }}
                                className="p-1 text-gray-400 hover:text-[#62d5e4] transition-colors"
                                title="Highlight in notes"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDiagnoses(prev => prev.filter(dx => dx.id !== diagnosis.id));
                                  handleAutoSave();
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
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

            {activeTab === 'procedures' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Procedure Codes (CPT/HCPCS)</h2>
                  <button 
                    onClick={addProcedure}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#62d5e4] border border-[#62d5e4] rounded-lg hover:bg-cyan-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Procedure
                  </button>
                </div>

                {validationErrors.procedures && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Validation Errors:</span>
                    </div>
                    <ul className="mt-1 text-sm text-red-600">
                      {validationErrors.procedures.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Code</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">IH</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Units</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Modifiers</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Dx Ptrs</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Charge</th>
                          {mode === 'billing' && (
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Allowed</th>
                          )}
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {procedures.map((procedure) => (
                          <tr key={procedure.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={procedure.code}
                                onChange={(e) => {
                                  setProcedures(prev => prev.map(proc => 
                                    proc.id === procedure.id ? { ...proc, code: e.target.value } : proc
                                  ));
                                  handleAutoSave();
                                }}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                                placeholder="CPT/HCPCS"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={procedure.description}
                                onChange={(e) => {
                                  setProcedures(prev => prev.map(proc => 
                                    proc.id === procedure.id ? { ...proc, description: e.target.value } : proc
                                  ));
                                  handleAutoSave();
                                }}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                                placeholder="Description"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={procedure.inHouse}
                                onChange={(e) => {
                                  setProcedures(prev => prev.map(proc => 
                                    proc.id === procedure.id ? { ...proc, inHouse: e.target.checked } : proc
                                  ));
                                  handleAutoSave();
                                }}
                                className="rounded border-gray-300 text-[#62d5e4] focus:ring-[#62d5e4]"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={procedure.units}
                                onChange={(e) => {
                                  setProcedures(prev => prev.map(proc => 
                                    proc.id === procedure.id ? { ...proc, units: parseInt(e.target.value) || 1 } : proc
                                  ));
                                  handleAutoSave();
                                }}
                                min="1"
                                className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {procedure.modifiers.map((modifier, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                                    {modifier}
                                    <button
                                      onClick={() => {
                                        setProcedures(prev => prev.map(proc => 
                                          proc.id === procedure.id 
                                            ? { ...proc, modifiers: proc.modifiers.filter((_, i) => i !== index) }
                                            : proc
                                        ));
                                        handleAutoSave();
                                      }}
                                      className="ml-1 text-purple-600 hover:text-purple-800"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                                <button
                                  onClick={() => {
                                    const modifier = prompt('Enter modifier (e.g., 25, 59, 76):');
                                    if (modifier) {
                                      setProcedures(prev => prev.map(proc => 
                                        proc.id === procedure.id 
                                          ? { ...proc, modifiers: [...proc.modifiers, modifier] }
                                          : proc
                                      ));
                                      handleAutoSave();
                                    }
                                  }}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs border border-gray-200 text-gray-600 hover:bg-gray-50"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {procedure.dxPointers.map((pointer, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                    {pointer}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                value={procedure.charge}
                                onChange={(e) => {
                                  setProcedures(prev => prev.map(proc => 
                                    proc.id === procedure.id ? { ...proc, charge: parseFloat(e.target.value) || 0 } : proc
                                  ));
                                  handleAutoSave();
                                }}
                                step="0.01"
                                className="w-24 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                              />
                            </td>
                            {mode === 'billing' && (
                              <td className="px-4 py-3 text-right">
                                <span className="font-medium text-green-600">
                                  ${procedure.allowedAmount?.toFixed(2) || '—'}
                                </span>
                              </td>
                            )}
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedCodeId(procedure.id);
                                    highlightProgressNote('note2', procedure.code);
                                  }}
                                  className="p-1 text-gray-400 hover:text-[#62d5e4] transition-colors"
                                  title="Highlight in notes"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setProcedures(prev => prev.filter(proc => proc.id !== procedure.id));
                                    handleAutoSave();
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                  title="Remove"
                                >
                                  <Trash2 className="w-4 h-4" />
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

            {activeTab === 'quality' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Quality Measures (CPT II)</h2>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 text-sm text-[#62d5e4] border border-[#62d5e4] rounded-lg hover:bg-cyan-50 transition-colors">
                      <Lightbulb className="w-4 h-4" />
                      AI Suggestions
                    </button>
                  </div>
                </div>

                <div className="grid gap-4">
                  {qualityMeasures.map((measure) => (
                    <div key={measure.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-sm font-medium text-gray-900">{measure.code}</span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {measure.category}
                            </span>
                            {measure.suggested && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                <Zap className="w-3 h-3 mr-1" />
                                AI Suggested
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-900 mb-2">{measure.description}</p>
                          <p className="text-xs text-gray-600">{measure.rationale}</p>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors">
                          <Plus className="w-4 h-4" />
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'insurance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Insurance Information</h2>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="font-medium text-gray-900 mb-4">Plan Details</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payer</label>
                        <input
                          type="text"
                          value={claimData.insurance.payer}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                        <input
                          type="text"
                          value={claimData.insurance.plan}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Member ID</label>
                        <input
                          type="text"
                          value={claimData.insurance.memberId}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="font-medium text-gray-900 mb-4">Financial Responsibility</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Copay:</span>
                        <span className="font-medium">${claimData.insurance.copay}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Deductible:</span>
                        <span className="font-medium">${claimData.insurance.deductible}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Eligibility:</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          {claimData.insurance.eligibilityStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Attachments & Notes</h2>
                  <button className="flex items-center gap-2 px-3 py-2 text-sm text-[#62d5e4] border border-[#62d5e4] rounded-lg hover:bg-cyan-50 transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Attachment
                  </button>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">No attachments uploaded yet.</p>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Audit History</h2>
                
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {auditLog.map((entry) => (
                      <div key={entry.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              by {entry.user} • {entry.timestamp}
                            </p>
                            {entry.field && (
                              <p className="text-xs text-gray-500 mt-1">
                                {entry.field}: "{entry.oldValue}" → "{entry.newValue}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidecar */}
        {showSidecar && (
          <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Clinical Sidecar</h3>
              <button 
                onClick={() => setShowSidecar(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {/* Progress Notes */}
              <div className="p-4 border-b border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Progress Notes</h4>
                <div className="space-y-3">
                  {progressNotes.map((note) => (
                    <div 
                      key={note.id} 
                      className={`p-3 rounded-lg text-sm border ${
                        note.highlighted 
                          ? 'bg-cyan-50 border-[#62d5e4]' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="font-medium text-gray-900 mb-1">{note.section}</div>
                      <p className="text-gray-700">{note.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rules Coach */}
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Rules Coach</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 mb-1">
                      <Info className="w-4 h-4" />
                      <span className="font-medium">NCCI Edit</span>
                    </div>
                    <p className="text-sm text-blue-600">
                      No bundling conflicts detected for current procedures.
                    </p>
                  </div>

                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700 mb-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">LCD Requirement</span>
                    </div>
                    <p className="text-sm text-yellow-600">
                      Medical necessity documentation required for 99213.
                    </p>
                  </div>

                  {mode === 'billing' && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">Fee Schedule</span>
                      </div>
                      <div className="text-sm text-green-600">
                        <div>99213: $150.00 → $120.00</div>
                        <div>Allowable: 80%</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sidecar Toggle Button */}
        {!showSidecar && (
          <button 
            onClick={() => setShowSidecar(true)}
            className="fixed right-4 top-1/2 transform -translate-y-1/2 p-2 bg-[#62d5e4] text-white rounded-lg shadow-lg hover:bg-[#4bc5d6] transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}