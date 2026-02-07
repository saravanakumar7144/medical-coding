import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Send,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Activity,
  Target,
  Star,
  FileText,
  Calculator,
  HelpCircle,
  AlertOctagon,
  BarChart3,
  Brain,
  TrendingUp,
  Banknote,
  Workflow,
  Bell,
  AlertCircle,
  Eye,
  Trash2,
  AlertTriangle
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
  hccMapping?: string;
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

export function EnhancedClaimWorkspace({ claimId, onClose }: { claimId: string; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('procedures');
  const [claimData, setClaimData] = useState<ClaimData | null>(null);
  const [diagnoses, setDiagnoses] = useState<DiagnosisCode[]>([]);
  const [procedures, setProcedures] = useState<ProcedureCode[]>([]);
  const [feeSuggestions, setFeeSuggestions] = useState<FeeScheduleSuggestion[]>([]);
  const [hccConditions, setHccConditions] = useState<HCCCondition[]>([]);
  const [currentRAF, setCurrentRAF] = useState(0);
  const [priorAuthPrompts, setPriorAuthPrompts] = useState<PriorAuthPrompt[]>([]);
  const [loadingFeeSuggestions, setLoadingFeeSuggestions] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize with sample data
  useEffect(() => {
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
        pointers: [1],
        hccMapping: 'HCC85'
      },
      {
        id: 'dx2',
        code: 'E11.9',
        description: 'Type 2 diabetes mellitus without complications',
        specificity: 'medium',
        source: 'History',
        primary: false,
        pointers: [2],
        hccMapping: 'HCC18'
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
        lcdRequirements: ['Medical necessity documentation']
      }
    ]);

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

  const handleAutoSave = () => {
    setAutoSaving(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setAutoSaving(false);
      console.log('Auto-saved claim data');
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

  const acceptHCCCondition = (hccId: string) => {
    setHccConditions(prev => prev.map(hcc =>
      hcc.id === hccId ? { ...hcc, status: 'accepted' as const } : hcc
    ));

    const hcc = hccConditions.find(h => h.id === hccId);
    if (hcc && !diagnoses.find(dx => dx.code === hcc.icdCode)) {
      const newDx: DiagnosisCode = {
        id: `dx_hcc_${Date.now()}`,
        code: hcc.icdCode,
        description: hcc.condition,
        specificity: 'high',
        source: 'HCC',
        primary: false,
        pointers: [],
        hccMapping: hcc.hccCode
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

  const startPriorAuth = (promptId: string) => {
    setPriorAuthPrompts(prev => prev.map(pa =>
      pa.id === promptId ? { ...pa, status: 'started' as const } : pa
    ));
    console.log('Starting prior authorization process...');
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
              <h1 className="text-xl font-semibold text-gray-900">Enhanced Claim Workspace</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <span>{claimData.patient.name}</span>
                <span>•</span>
                <span>MRN: {claimData.patient.mrn}</span>
                <span>•</span>
                <span>DOS: {claimData.encounter.dateOfService}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {autoSaving && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-[#62d5e4] border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            )}

            <button className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors">
              <Send className="w-4 h-4" />
              Submit
            </button>
          </div>
        </div>

        {/* Insurance Info */}
        <div className="grid grid-cols-3 gap-6 text-sm">
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
              {claimData.amounts.allowedAmount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Allowed:</span>
                  <span className="font-medium text-green-600">${claimData.amounts.allowedAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">RAF Score</h3>
            <div className="bg-cyan-50 rounded-lg px-3 py-2">
              <div className="text-2xl font-semibold text-[#62d5e4]">{(1 + currentRAF).toFixed(3)}</div>
              <div className="text-xs text-gray-600">Current RAF</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200 px-6">
            <nav className="flex space-x-8">
              {[
                { id: 'procedures', label: 'Procedures', icon: Activity },
                { id: 'hcc', label: 'HCC/RAF', icon: BarChart3 },
                { id: 'diagnoses', label: 'Diagnoses', icon: Target },
                { id: 'insurance', label: 'Insurance', icon: Shield }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors ${activeTab === tab.id
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

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Code</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Units</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Charge</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Allowed</th>
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
                              type="number"
                              value={procedure.units}
                              onChange={(e) => {
                                setProcedures(prev => prev.map(proc =>
                                  proc.id === procedure.id ? { ...proc, units: parseInt(e.target.value) || 1 } : proc
                                ));
                                handleAutoSave();
                              }}
                              className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                            />
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
                          <td className="px-4 py-3 text-right">
                            <span className="font-medium text-green-600">
                              ${procedure.allowedAmount?.toFixed(2) || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                className="p-1 text-gray-400 hover:text-[#62d5e4] transition-colors"
                                title="Calculate Units"
                              >
                                <Calculator className="w-4 h-4" />
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

                {/* Fee Schedule Suggestions */}
                {feeSuggestions.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Fee Schedule Suggestions</h3>
                    <div className="space-y-3">
                      {feeSuggestions.map((suggestion) => (
                        <div key={suggestion.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium">{suggestion.code}</span>
                              {suggestion.isTopPick && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#62d5e4] text-white">
                                  Top Pick
                                </span>
                              )}
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${suggestion.confidence === 'high' ? 'bg-green-100 text-green-800' :
                                  suggestion.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                {suggestion.confidence} confidence
                              </span>
                            </div>
                            <button
                              onClick={() => applyFeeSuggestion(suggestion)}
                              className="px-3 py-1 text-sm bg-[#62d5e4] text-white rounded hover:bg-[#4bc5d6] transition-colors"
                            >
                              Apply
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Units: </span>
                              <span className="font-medium">{suggestion.units}</span>
                              {suggestion.modifiers.length > 0 && (
                                <span className="ml-2 text-gray-600">
                                  Modifiers: {suggestion.modifiers.join(', ')}
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-gray-600">Allowed: </span>
                              <span className="font-medium text-green-600">${suggestion.allowedAmount.toFixed(2)}</span>
                              <span className="ml-2 text-gray-600">Patient OOP: </span>
                              <span className="font-medium">${suggestion.patientOOP.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {suggestion.reason} • {suggestion.payer} • Effective: {suggestion.effectiveDate}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prior Auth Prompts */}
                {priorAuthPrompts.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertOctagon className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-medium text-yellow-800">Prior Authorization Required</h3>
                    </div>
                    {priorAuthPrompts.map((prompt) => (
                      <div key={prompt.id} className="bg-white rounded-lg border border-yellow-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-mono text-sm font-medium">{prompt.code}</span>
                            <span className="ml-2 text-sm text-gray-600">{prompt.description}</span>
                          </div>
                          <button
                            onClick={() => startPriorAuth(prompt.id)}
                            className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                          >
                            Start PA
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{prompt.reason}</p>
                        <div className="text-xs text-gray-500">
                          Clinical criteria: {prompt.clinicalCriteria.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'hcc' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">HCC Risk Adjustment</h2>
                  <div className="flex items-center gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                      <div className="text-sm text-gray-600">Current RAF Score</div>
                      <div className="text-2xl font-semibold text-[#62d5e4]">{currentRAF.toFixed(3)}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Suspected HCC Conditions</h3>
                  <div className="space-y-3">
                    {hccConditions.map((condition) => (
                      <div key={condition.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{condition.hccCode}</span>
                              <span className="text-sm text-gray-600">({condition.icdCode})</span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${condition.confidence >= 90 ? 'bg-green-100 text-green-800' :
                                  condition.confidence >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                {condition.confidence}% confidence
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                RAF: +{condition.rafValue.toFixed(3)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{condition.condition}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {condition.status === 'suspected' && (
                              <>
                                <button
                                  onClick={() => acceptHCCCondition(condition.id)}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => rejectHCCCondition(condition.id, 'Not clinically supported')}
                                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {condition.status === 'accepted' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Accepted
                              </span>
                            )}
                            {condition.status === 'rejected' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                Rejected
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Evidence in Notes</h4>
                            <ul className="text-gray-600 space-y-1">
                              {condition.evidence.noteSpans.map((span, index) => (
                                <li key={index} className="text-xs">• {span}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Lab Values</h4>
                            <ul className="text-gray-600 space-y-1">
                              {condition.evidence.labs.map((lab, index) => (
                                <li key={index} className="text-xs">• {lab}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Problem List</h4>
                            <ul className="text-gray-600 space-y-1">
                              {condition.evidence.problemList.map((problem, index) => (
                                <li key={index} className="text-xs">• {problem}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="font-medium text-gray-900 mb-3">RAF Impact Calculator</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Baseline RAF Score:</span>
                      <span className="font-medium">1.000</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">HCC Adjustments:</span>
                      <span className="font-medium text-[#62d5e4]">+{currentRAF.toFixed(3)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">Total RAF Score:</span>
                        <span className="text-lg font-semibold text-[#62d5e4]">{(1 + currentRAF).toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'diagnoses' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Diagnosis Codes (ICD-10)</h2>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Primary</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Code</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">HCC Mapping</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Source</th>
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
                              className="text-[#62d5e4] focus:ring-[#62d5e4]"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm font-medium">{diagnosis.code}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm">{diagnosis.description}</span>
                          </td>
                          <td className="px-4 py-3">
                            {diagnosis.hccMapping && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                {diagnosis.hccMapping}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                              {diagnosis.source}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'insurance' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Insurance Information</h2>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Primary Insurance</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-600">Payer:</span> {claimData.insurance.payer}</div>
                        <div><span className="text-gray-600">Plan:</span> {claimData.insurance.plan}</div>
                        <div><span className="text-gray-600">Member ID:</span> {claimData.insurance.memberId}</div>
                        <div><span className="text-gray-600">Policy Number:</span> {claimData.insurance.policyNumber}</div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Coverage Details</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-600">Copay:</span> ${claimData.insurance.copay}</div>
                        <div><span className="text-gray-600">Deductible:</span> ${claimData.insurance.deductible}</div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            {claimData.insurance.eligibilityStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}