import { useState } from 'react';
import {
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Receipt,
  XCircle,
  RefreshCw,
  CreditCard,
  FileText,
  ChevronRight,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';

interface EnhancedBillerDashboardProps {
  onNavigate?: (page: string, claimId?: string, section?: string) => void;
}

interface ERAException {
  id: string;
  claimId: string;
  patientName: string;
  payer: string;
  checkDate: string;
  billedAmount: number;
  paidAmount: number;
  variance: number;
  mismatchCategory: string;
  aiSuggestedAction: string;
  confidence: number;
}

interface DenialItem {
  id: string;
  claimId: string;
  patientName: string;
  denialCode: string;
  denialReason: string;
  amount: number;
  daysRemaining: number;
  endAction: string;
  aiConfidence: number;
}

interface PatientBillingItem {
  id: string;
  claimId: string;
  patientName: string;
  statementDate: string;
  balanceDue: number;
  daysPastDue: number;
  status: 'ready' | 'sent' | 'overdue';
}

const mockERAExceptions: ERAException[] = [
  {
    id: '1',
    claimId: 'CLM-2024-1004',
    patientName: 'David Martinez',
    payer: 'UnitedHealthcare',
    checkDate: '10/19/24',
    billedAmount: 650.0,
    paidAmount: 400.0,
    variance: -250.0,
    mismatchCategory: 'Paid to different account',
    aiSuggestedAction: 'Transfer payment to correct account',
    confidence: 94,
  },
  {
    id: '2',
    claimId: 'CLM-2024-1025',
    patientName: 'Thomas Wilson',
    payer: 'Medicare',
    checkDate: '10/17/24',
    billedAmount: 450.0,
    paidAmount: 350.0,
    variance: -100.0,
    mismatchCategory: 'Incorrect amount',
    aiSuggestedAction: 'Appeal underpayment - Expected $380',
    confidence: 91,
  },
];

const mockDenials: DenialItem[] = [
  {
    id: '1',
    claimId: 'CLM-2024-1010',
    patientName: 'Jennifer Lee',
    denialCode: 'CO-197',
    denialReason: 'Precertification/authorization absent',
    amount: 1250.0,
    daysRemaining: 15,
    endAction: 'Bill patient (timely filing expired)',
    aiConfidence: 92,
  },
  {
    id: '2',
    claimId: 'CLM-2024-1018',
    patientName: 'Robert Chen',
    denialCode: 'CO-16',
    denialReason: 'Claim lacks information',
    amount: 780.0,
    daysRemaining: 38,
    endAction: 'Resubmit to payer with corrections',
    aiConfidence: 96,
  },
];

const mockPatientBilling: PatientBillingItem[] = [
  {
    id: '1',
    claimId: 'CLM-2024-1007',
    patientName: 'Amanda Brown',
    statementDate: '10/15/24',
    balanceDue: 70.0,
    daysPastDue: 0,
    status: 'ready',
  },
  {
    id: '2',
    claimId: 'CLM-2024-0995',
    patientName: 'Michael Chen',
    statementDate: '09/28/24',
    balanceDue: 125.0,
    daysPastDue: 25,
    status: 'overdue',
  },
  {
    id: '3',
    claimId: 'CLM-2024-1002',
    patientName: 'Sarah Johnson',
    statementDate: '10/10/24',
    balanceDue: 45.0,
    daysPastDue: 13,
    status: 'sent',
  },
];

export function EnhancedBillerDashboard({ onNavigate }: EnhancedBillerDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  const stats = {
    totalPosted: 45780,
    eraExceptions: mockERAExceptions.length,
    denialsPending: mockDenials.length,
    readyToBill: mockPatientBilling.filter((p) => p.status === 'ready').length,
    collectionRate: 92.3,
    avgDaysInAR: 28,
    refundsPending: 3,
    overdueBalances: mockPatientBilling.filter((p) => p.status === 'overdue').length,
  };

  const getMismatchColor = (category: string) => {
    const colors: Record<string, string> = {
      'Incorrect amount': 'bg-orange-100 text-orange-700',
      'Duplicate': 'bg-red-100 text-red-700',
      'Paid to other office': 'bg-purple-100 text-purple-700',
      'Paid to different account': 'bg-yellow-100 text-yellow-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-cyan-100 text-cyan-700';
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-[#62d5e4]" />
              Medical Biller Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Revenue cycle management with AI-powered ERA triage and denials resolution
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setSelectedPeriod('today')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                selectedPeriod === 'today' ? 'bg-[#62d5e4] text-white' : 'text-gray-600'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                selectedPeriod === 'week' ? 'bg-[#62d5e4] text-white' : 'text-gray-600'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                selectedPeriod === 'month' ? 'bg-[#62d5e4] text-white' : 'text-gray-600'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Posted</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${stats.totalPosted.toLocaleString()}
              </div>
              <div className="text-sm text-green-600 mt-1">↑ 12% vs last week</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>ERA Exceptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.eraExceptions}</div>
              <div className="text-sm text-gray-500 mt-1">Require review</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Denials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.denialsPending}</div>
              <div className="text-sm text-gray-500 mt-1">Pending resolution</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Ready to Bill</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-600">{stats.readyToBill}</div>
              <div className="text-sm text-gray-500 mt-1">Patient statements</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Collection Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.collectionRate}%</div>
              <div className="text-sm text-green-600 mt-1">↑ 2.1% this month</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Days in A/R</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.avgDaysInAR}</div>
              <div className="text-sm text-green-600 mt-1">↓ 3 days</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - ERA Exceptions & Denials */}
          <div className="col-span-2 space-y-6">
            {/* ERA Exceptions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    ERA Exceptions ({mockERAExceptions.length})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate?.('ERAs & Payments')}
                  >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardTitle>
                <CardDescription>Payment mismatches requiring resolution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockERAExceptions.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 hover:border-[#62d5e4] transition-colors cursor-pointer"
                    onClick={() => onNavigate?.('Enhanced Claim Workspace', item.claimId, 'era')}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{item.patientName}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{item.payer}</span>
                        </div>
                        <Badge className={getMismatchColor(item.mismatchCategory)} variant="secondary">
                          {item.mismatchCategory}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Check: {item.checkDate}</div>
                        <div className="text-sm font-medium text-red-600">
                          Variance: ${Math.abs(item.variance).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm mb-3 pb-3 border-b">
                      <div>
                        <span className="text-gray-500">Billed:</span>
                        <span className="ml-1 font-medium">${item.billedAmount.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Paid:</span>
                        <span className="ml-1 font-medium">${item.paidAmount.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Variance:</span>
                        <span className="ml-1 font-medium text-red-600">
                          ${Math.abs(item.variance).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-700">{item.aiSuggestedAction}</span>
                        <Badge className="bg-purple-100 text-purple-700" variant="secondary">
                          {item.confidence}%
                        </Badge>
                      </div>
                      <Button size="sm" className="bg-[#62d5e4] hover:bg-[#4fc5d4]">
                        Review
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Denials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    Active Denials ({mockDenials.length})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate?.('Denials Workbench')}
                  >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardTitle>
                <CardDescription>Denials requiring end action decisions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockDenials.map((denial) => (
                  <div
                    key={denial.id}
                    className="border rounded-lg p-4 hover:border-red-400 transition-colors cursor-pointer"
                    onClick={() => onNavigate?.('Enhanced Claim Workspace', denial.claimId, 'denials')}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">{denial.patientName}</span>
                          <Badge
                            className={
                              denial.daysRemaining < 20
                                ? 'bg-red-100 text-red-700'
                                : 'bg-orange-100 text-orange-700'
                            }
                            variant="secondary"
                          >
                            {denial.daysRemaining} days left
                          </Badge>
                        </div>
                        <div className="text-sm font-medium text-red-700">
                          {denial.denialCode}: {denial.denialReason}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Amount</div>
                        <div className="font-medium text-red-600">${denial.amount.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-700">{denial.endAction}</span>
                        <Badge className="bg-purple-100 text-purple-700" variant="secondary">
                          {denial.aiConfidence}%
                        </Badge>
                      </div>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                        Resolve
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Patient Billing & Quick Actions */}
          <div className="space-y-6">
            {/* Patient Billing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-cyan-600" />
                    Patient Billing ({mockPatientBilling.length})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate?.('Patient Billing')}
                  >
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockPatientBilling.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-3 hover:border-cyan-400 transition-colors cursor-pointer"
                    onClick={() =>
                      onNavigate?.('Enhanced Claim Workspace', item.claimId, 'patient-billing')
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{item.patientName}</span>
                      <Badge className={getStatusColor(item.status)} variant="secondary">
                        {item.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Balance Due:</span>
                      <span className="font-medium text-cyan-600">${item.balanceDue.toFixed(2)}</span>
                    </div>
                    {item.daysPastDue > 0 && (
                      <div className="text-xs text-red-600 mt-1">
                        {item.daysPastDue} days past due
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white mt-3"
                  onClick={() => onNavigate?.('Patient Billing')}
                >
                  Generate Statements
                  <FileText className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="bg-gradient-to-br from-green-50 to-cyan-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <TrendingUp className="w-5 h-5" />
                  This Week's Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-white rounded border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-900">Posted Amount</span>
                    <span className="font-medium text-green-700">
                      ${stats.totalPosted.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-900">Collection Rate</span>
                    <span className="font-medium text-green-700">{stats.collectionRate}%</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-900">Avg Days in A/R</span>
                    <span className="font-medium text-green-700">{stats.avgDaysInAR} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onNavigate?.('ERAs & Payments')}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  ERA & Payments
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onNavigate?.('Denials Workbench')}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Denials Workbench
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onNavigate?.('Patient Billing')}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Patient Billing
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onNavigate?.('Reports & Analytics')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Revenue Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
