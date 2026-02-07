import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  FileCode,
  DollarSign,
  Filter,
  Send,
  Check,
  Receipt,
  CreditCard,
  AlertCircle,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { StatusTimeline, ClaimStatus } from './status-timeline';
import { AICopilotPanel, CopilotContext } from './ai-copilot-panel';
import { MedicalRecordsModal } from './medical-records-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface GatedClaimWorkspaceProps {
  claimId: string;
  onClose: () => void;
  initialSection?: string;
}

interface WorkflowStep {
  id: string;
  label: string;
  icon: React.ElementType;
  component: React.ComponentType<any>;
  isComplete: boolean;
  isBlocked: boolean;
  blockers: string[];
}

interface ClaimHeader {
  patientName: string;
  patientMRN: string;
  primaryPayer: string;
  secondaryPayer?: string;
  accountNumber: string;
  invoiceNumber: string;
  dos: string;
  billedAmount: number;
  allowedAmount?: number;
  balance: number;
}

// Mock header data
const mockClaimHeader: ClaimHeader = {
  patientName: 'Sarah Johnson',
  patientMRN: 'PT-88291',
  primaryPayer: 'Medicare',
  secondaryPayer: 'BCBS (Secondary)',
  accountNumber: 'ACC-2024-001',
  invoiceNumber: 'INV-45678',
  dos: '10/15/24',
  billedAmount: 450.0,
  allowedAmount: 380.0,
  balance: 70.0,
};

// Step components (placeholders for now, will be enhanced)
function EligibilityAuthStep() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Eligibility & Authorization</CardTitle>
          <CardDescription>Verify patient eligibility and required authorizations</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="eligibility">
            <TabsList>
              <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
              <TabsTrigger value="prior-auth">Prior Authorization</TabsTrigger>
              <TabsTrigger value="cob">COB (Coordination of Benefits)</TabsTrigger>
            </TabsList>

            <TabsContent value="eligibility" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Payer</label>
                  <p className="text-sm text-gray-600">Medicare</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Plan</label>
                  <p className="text-sm text-gray-600">Medicare Part B</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Deductible (Remaining)</label>
                  <p className="text-sm text-gray-600">$150.00</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Co-Pay</label>
                  <p className="text-sm text-gray-600">$20.00</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Co-Insurance</label>
                  <p className="text-sm text-gray-600">20%</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prior-auth" className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Per-Service Authorization Requirements</p>
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">99213 - Office Visit</p>
                      <p className="text-xs text-gray-500">DOS: 10/15/24</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">No Auth Required</Badge>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cob" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Secondary payer detected: BCBS. Configure coordination of benefits.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Primary Payer</label>
                  <p className="text-sm text-gray-600">Medicare</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Secondary Payer</label>
                  <p className="text-sm text-gray-600">BCBS</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function CodingStep() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Coding</CardTitle>
              <CardDescription>ICD-10, CPT, and HCPCS code assignment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Diagnosis Codes (ICD-10)</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-mono text-sm">E11.9</span>
                        <span className="text-sm text-gray-600 ml-2">
                          Type 2 diabetes without complications
                        </span>
                        <Badge className="ml-2 bg-green-100 text-green-700" variant="secondary">
                          High Specificity
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Procedure Codes (CPT)</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-mono text-sm">99213</span>
                        <span className="text-sm text-gray-600 ml-2">
                          Office/outpatient visit, established patient
                        </span>
                      </div>
                      <span className="text-sm font-medium">$150.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Code Sales & Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs font-medium text-blue-900">Recent Update</p>
                <p className="text-xs text-blue-700 mt-1">
                  CPT 99213: Increased allowed amount by 3.2%
                </p>
              </div>
              <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                <p className="text-xs font-medium text-orange-900">Denial Risk</p>
                <p className="text-xs text-orange-700 mt-1">
                  E11.9 may require more specific code for this payer
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ChargeEntryStep({ onOpenMedicalRecords }: { onOpenMedicalRecords: () => void }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Charge & Demographics Entry</CardTitle>
          <CardDescription>Service charges and claim form metadata</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Service Lines</h4>
              <div className="border rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">99213 - Office Visit</span>
                  <span className="text-sm font-medium">$150.00</span>
                </div>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-sm font-medium">Total:</span>
                <span className="text-sm font-medium">$150.00</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Claim Form</h4>
              <div className="border-2 border-dashed rounded p-4 text-center">
                <FileCode className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">CMS-1500 Form</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Upload / View
                </Button>
              </div>
            </div>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <button
                onClick={() => onOpenMedicalRecords()}
                className="text-sm text-[#62d5e4] hover:underline font-medium"
              >
                Open Medical Records
              </button>
              {' '}(High-security access required)
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

function RulesScrubbingStep() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Rules & Scrubbing</CardTitle>
          <CardDescription>Validation against client and payer rules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">All validations passed</p>
              <p className="text-xs text-green-700">No blocking issues found</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Rule Checks (3 passed)</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">Diagnosis-procedure linking valid</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">Modifiers appropriate for service</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">Prior authorization verified</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SubmitStep() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Submit Claim</CardTitle>
          <CardDescription>Route claim to primary or secondary payer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Destination</label>
              <div className="flex gap-2 mt-2">
                <Button variant="default" className="bg-[#62d5e4] hover:bg-[#4fc5d4]">
                  Primary (Medicare)
                </Button>
                <Button variant="outline">Secondary (BCBS)</Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Secondary Sub-Category</label>
              <select className="w-full mt-1 border rounded px-3 py-2 text-sm">
                <option>Standard Secondary</option>
                <option>Supplemental</option>
                <option>Coordination of Benefits</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button className="w-full bg-[#62d5e4] hover:bg-[#4fc5d4]" size="lg">
              <Send className="w-4 h-4 mr-2" />
              Submit Fresh Claim
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AcknowledgmentsStep() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Acknowledgments (999/277CA)</CardTitle>
          <CardDescription>Clearinghouse and payer acknowledgment status</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ch">
            <TabsList>
              <TabsTrigger value="ch">Rejected—Clearinghouse</TabsTrigger>
              <TabsTrigger value="payer">Rejected—Payer</TabsTrigger>
            </TabsList>

            <TabsContent value="ch" className="space-y-3">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-medium">AAA02:</span> Invalid/Missing Provider Identifier
                  <Button
                    variant="link"
                    className="ml-2 p-0 h-auto text-xs underline"
                    onClick={() => { }}
                  >
                    Fix in Charge Entry →
                  </Button>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="payer" className="space-y-3">
              <p className="text-sm text-gray-500">No payer rejections</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function ERAPaymentsStep() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>ERA & Payments</CardTitle>
          <CardDescription>Electronic remittance advice and payment posting</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="era">
            <TabsList>
              <TabsTrigger value="era">ERA Details</TabsTrigger>
              <TabsTrigger value="refunds">Refunds</TabsTrigger>
            </TabsList>

            <TabsContent value="era" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Deductible</label>
                  <p className="text-sm text-gray-600">$30.00</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Co-Pay</label>
                  <p className="text-sm text-gray-600">$20.00</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Co-Insurance</label>
                  <p className="text-sm text-gray-600">$20.00</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Mismatch Category</label>
                <select className="w-full mt-1 border rounded px-3 py-2 text-sm">
                  <option>No mismatch</option>
                  <option>Incorrect amount</option>
                  <option>Duplicate payment</option>
                  <option>Paid to other office</option>
                  <option>Paid to different account</option>
                </select>
              </div>
            </TabsContent>

            <TabsContent value="refunds" className="space-y-3">
              <p className="text-sm text-gray-500">No refunds required</p>
              <Button variant="outline" size="sm">
                Create Refund
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function DenialsStep() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Denials Workbench</CardTitle>
          <CardDescription>Manage denial resolution and end actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Denial Code & Type</label>
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm font-medium text-red-900">CO-197</p>
              <p className="text-xs text-red-700">Precertification/authorization/notification absent</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Denial Subtype</label>
            <select className="w-full mt-1 border rounded px-3 py-2 text-sm">
              <option>Non-covered under patient policy</option>
              <option>Non-covered under insurance policy</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">End Action</label>
            <select className="w-full mt-1 border rounded px-3 py-2 text-sm">
              <option>Select action...</option>
              <option>Resubmit to payer</option>
              <option>Bill patient</option>
              <option>Bill secondary payer</option>
              <option>Reprocess claim</option>
              <option>Adjustment/Write-off</option>
            </select>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Timely filing limit: 45 days remaining
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

function PatientBillingStep() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Patient Billing</CardTitle>
          <CardDescription>Patient responsibility and statement generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-cyan-50 border border-cyan-200 rounded">
            <p className="text-sm font-medium text-cyan-900">Ready to Bill Patient</p>
            <p className="text-sm text-cyan-700 mt-1">
              Patient responsibility: <span className="font-medium">$70.00</span>
            </p>
          </div>

          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              Generate Patient Statement
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Generate Patient Letter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function GatedClaimWorkspace({
  claimId,
  onClose,
  initialSection,
}: GatedClaimWorkspaceProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('submitted');
  const [isMedicalRecordsOpen, setIsMedicalRecordsOpen] = useState(false);

  // Define workflow steps
  const steps: WorkflowStep[] = [
    {
      id: 'eligibility',
      label: 'Eligibility & Auth',
      icon: Shield,
      component: EligibilityAuthStep,
      isComplete: true,
      isBlocked: false,
      blockers: [],
    },
    {
      id: 'coding',
      label: 'Coding',
      icon: FileCode,
      component: CodingStep,
      isComplete: true,
      isBlocked: false,
      blockers: [],
    },
    {
      id: 'charge-entry',
      label: 'Charge & Demo Entry',
      icon: DollarSign,
      component: ChargeEntryStep,
      isComplete: true,
      isBlocked: false,
      blockers: [],
    },
    {
      id: 'rules-scrubbing',
      label: 'Rules & Scrubbing',
      icon: Filter,
      component: RulesScrubbingStep,
      isComplete: true,
      isBlocked: false,
      blockers: [],
    },
    {
      id: 'submit',
      label: 'Submit',
      icon: Send,
      component: SubmitStep,
      isComplete: false,
      isBlocked: false, // Would be blocked if earlier steps incomplete
      blockers: [],
    },
    {
      id: 'acknowledgments',
      label: 'Acknowledgments',
      icon: Check,
      component: AcknowledgmentsStep,
      isComplete: false,
      isBlocked: true,
      blockers: ['Claim must be submitted first'],
    },
    {
      id: 'era',
      label: 'ERA & Payments',
      icon: Receipt,
      component: ERAPaymentsStep,
      isComplete: false,
      isBlocked: true,
      blockers: ['Awaiting payer response'],
    },
    {
      id: 'denials',
      label: 'Denials Workbench',
      icon: AlertTriangle,
      component: DenialsStep,
      isComplete: false,
      isBlocked: true,
      blockers: ['No denials to process'],
    },
    {
      id: 'patient-billing',
      label: 'Patient Billing',
      icon: CreditCard,
      component: PatientBillingStep,
      isComplete: false,
      isBlocked: true,
      blockers: ['ERA must be processed first'],
    },
  ];

  // Handle initial section deep-linking
  useEffect(() => {
    if (initialSection) {
      const stepIndex = steps.findIndex((s) => s.id === initialSection);
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
      }
    }
  }, [initialSection]);

  const handleApplySuggestion = (suggestionId: string) => {
    console.log('Applying suggestion:', suggestionId);
    // Implementation would apply the AI suggestion
    // Could update claim data, navigate to different step, etc.
  };

  const getCurrentContext = (): CopilotContext => {
    const contextMap: Record<string, CopilotContext> = {
      'eligibility': 'eligibility',
      'coding': 'coding',
      'charge-entry': 'charge-entry',
      'rules-scrubbing': 'rules',
      'submit': 'submit',
      'acknowledgments': 'acknowledgments',
      'era': 'era',
      'denials': 'denials',
      'patient-billing': 'patient-billing',
    };
    return contextMap[steps[currentStep].id] || 'coding';
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Claim Workspace</h1>
              <p className="text-sm text-gray-600">Claim ID: {claimId}</p>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>
        </div>

        {/* Claim Header Info */}
        <div className="grid grid-cols-6 gap-4 text-sm">
          <div>
            <label className="text-xs text-gray-500">Patient</label>
            <p className="font-medium">{mockClaimHeader.patientName}</p>
            <p className="text-xs text-gray-600">{mockClaimHeader.patientMRN}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500">Payer(s)</label>
            <p className="font-medium">{mockClaimHeader.primaryPayer}</p>
            {mockClaimHeader.secondaryPayer && (
              <p className="text-xs text-gray-600">{mockClaimHeader.secondaryPayer}</p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500">Account / Invoice</label>
            <p className="font-medium">{mockClaimHeader.accountNumber}</p>
            <p className="text-xs text-gray-600">{mockClaimHeader.invoiceNumber}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500">DOS</label>
            <p className="font-medium">{mockClaimHeader.dos}</p>
          </div>
          <div className="text-right">
            <label className="text-xs text-gray-500">Billed</label>
            <p className="font-medium">${mockClaimHeader.billedAmount.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <label className="text-xs text-gray-500">Balance</label>
            <p className="font-medium text-[#62d5e4]">${mockClaimHeader.balance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white border-b border-gray-200 p-4">
        <StatusTimeline currentStatus={claimStatus} compact />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Stepper */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-1">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === index;
              const isPast = index < currentStep;
              const canAccess = !step.isBlocked || isPast || isActive;

              return (
                <TooltipProvider key={step.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => canAccess && setCurrentStep(index)}
                        disabled={!canAccess}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${isActive
                            ? 'bg-cyan-50 text-[#62d5e4] border-l-2 border-[#62d5e4]'
                            : canAccess
                              ? 'text-gray-700 hover:bg-gray-50'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`flex items-center justify-center w-6 h-6 rounded-full ${step.isComplete
                                ? 'bg-green-100'
                                : isActive
                                  ? 'bg-cyan-100'
                                  : 'bg-gray-100'
                              }`}
                          >
                            {step.isComplete ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : step.isBlocked && !isActive ? (
                              <Lock className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Icon className="w-4 h-4" />
                            )}
                          </div>
                          <span className={step.isComplete ? 'line-through' : ''}>
                            {step.label}
                          </span>
                        </div>
                        {isActive && <ChevronRight className="w-4 h-4" />}
                      </button>
                    </TooltipTrigger>
                    {step.isBlocked && step.blockers.length > 0 && (
                      <TooltipContent side="right">
                        <div className="space-y-1">
                          <p className="font-medium text-xs">Blocked:</p>
                          {step.blockers.map((blocker, i) => (
                            <p key={i} className="text-xs">
                              • {blocker}
                            </p>
                          ))}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>

        {/* Main Panel */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl">
            <CurrentStepComponent onOpenMedicalRecords={() => setIsMedicalRecordsOpen(true)} />
          </div>
        </div>

        {/* Right Rail - AI Copilot */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <AICopilotPanel
            context={getCurrentContext()}
            onApplySuggestion={handleApplySuggestion}
          />
        </div>
      </div>

      {/* Medical Records Modal */}
      <MedicalRecordsModal
        isOpen={isMedicalRecordsOpen}
        onClose={() => setIsMedicalRecordsOpen(false)}
        patientName={mockClaimHeader.patientName}
        patientMRN={mockClaimHeader.patientMRN}
        claimId={claimId}
      />
    </div>
  );
}