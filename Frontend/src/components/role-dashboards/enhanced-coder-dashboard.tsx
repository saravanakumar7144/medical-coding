import { useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Brain,
  Zap,
  Target,
  Award,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Activity,
  Users,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface EnhancedCoderDashboardProps {
  onNavigate?: (page: string, claimId?: string, section?: string) => void;
}

interface ClaimNeedingAttention {
  id: string;
  claimId: string;
  patientName: string;
  dos: string;
  issue: string;
  priority: 'urgent' | 'high' | 'medium';
  suggestedFix: string;
  aiConfidence: number;
}

interface CodingOpportunity {
  id: string;
  type: 'specificity' | 'hcc' | 'modifier' | 'bundling';
  title: string;
  description: string;
  impact: string;
  confidence: number;
  claimId: string;
}

const mockClaimsNeedingAttention: ClaimNeedingAttention[] = [
  {
    id: '1',
    claimId: 'CLM-2024-1001',
    patientName: 'Sarah Johnson',
    dos: '10/15/24',
    issue: 'AAA02: Invalid/Missing Provider NPI',
    priority: 'urgent',
    suggestedFix: 'Auto-fix with NPI 1234567890',
    aiConfidence: 96,
  },
  {
    id: '2',
    claimId: 'CLM-2024-1023',
    patientName: 'Maria Garcia',
    dos: '10/13/24',
    issue: 'AAA57: Missing Primary Diagnosis',
    priority: 'high',
    suggestedFix: 'Add E11.9 from medical notes',
    aiConfidence: 92,
  },
  {
    id: '3',
    claimId: 'CLM-2024-1045',
    patientName: 'Thomas Wilson',
    dos: '10/11/24',
    issue: 'Low code specificity detected',
    priority: 'medium',
    suggestedFix: 'Upgrade E11.9 → E11.65',
    aiConfidence: 88,
  },
];

const mockCodingOpportunities: CodingOpportunity[] = [
  {
    id: '1',
    type: 'hcc',
    title: 'HCC 19 Capture Opportunity',
    description: 'E11.65 maps to HCC 19 (Diabetes without complications)',
    impact: 'RAF +0.104, $12 higher allowed amount',
    confidence: 95,
    claimId: 'CLM-2024-1007',
  },
  {
    id: '2',
    type: 'specificity',
    title: 'Increase Code Specificity',
    description: 'I10 can be more specific with laterality and stage',
    impact: '23% lower denial risk',
    confidence: 91,
    claimId: 'CLM-2024-1012',
  },
  {
    id: '3',
    type: 'modifier',
    title: 'Missing Modifier Opportunity',
    description: '99213 + 99214 same day needs modifier 25',
    impact: 'Prevent bundling denial',
    confidence: 98,
    claimId: 'CLM-2024-1019',
  },
];

export function EnhancedCoderDashboard({ onNavigate }: EnhancedCoderDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  const stats = {
    chartsAssigned: 12,
    chartsCompleted: 8,
    chartsPending: 4,
    accuracy: 96.5,
    avgTimePerChart: 18,
    aiSuggestionsUsed: 23,
    hccsCaptured: 5,
    specificityScore: 94,
    needsAttention: mockClaimsNeedingAttention.length,
    codingOpportunities: mockCodingOpportunities.length,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getOpportunityIcon = (type: string) => {
    switch (type) {
      case 'hcc':
        return <Target className="w-4 h-4 text-purple-600" />;
      case 'specificity':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'modifier':
        return <Zap className="w-4 h-4 text-yellow-600" />;
      case 'bundling':
        return <Activity className="w-4 h-4 text-cyan-600" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-[#62d5e4]" />
              Medical Coder Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              AI-powered coding workspace with smart suggestions and quality insights
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
              <CardDescription>Charts Assigned</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.chartsAssigned}</div>
              <div className="text-sm text-green-600 mt-1">↑ 8 from yesterday</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.chartsCompleted}</div>
              <Progress value={(stats.chartsCompleted / stats.chartsAssigned) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Needs Attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.needsAttention}</div>
              <div className="text-sm text-gray-500 mt-1">Requires action</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Accuracy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-600">{stats.accuracy}%</div>
              <div className="text-sm text-green-600 mt-1">↑ 1.2% this week</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>HCCs Captured</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.hccsCaptured}</div>
              <div className="text-sm text-gray-500 mt-1">Today</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>AI Assists</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.aiSuggestionsUsed}</div>
              <div className="text-sm text-gray-500 mt-1">Suggestions used</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Claims Needing Attention */}
          <div className="col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Claims Needing Attention ({mockClaimsNeedingAttention.length})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate?.('Claims Inbox')}
                  >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  Claims with issues that require your attention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockClaimsNeedingAttention.map((claim) => (
                  <div
                    key={claim.id}
                    className="border rounded-lg p-4 hover:border-[#62d5e4] transition-colors cursor-pointer"
                    onClick={() => onNavigate?.('Enhanced Claim Workspace', claim.claimId, 'coding')}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getPriorityColor(claim.priority)} variant="secondary">
                            {claim.priority.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium">{claim.patientName}</span>
                          <span className="text-sm text-gray-500">DOS: {claim.dos}</span>
                        </div>
                        <p className="text-sm text-red-700 font-medium">{claim.issue}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-700">{claim.suggestedFix}</span>
                        <Badge className="bg-purple-100 text-purple-700" variant="secondary">
                          {claim.aiConfidence}% confidence
                        </Badge>
                      </div>
                      <Button size="sm" className="bg-[#62d5e4] hover:bg-[#4fc5d4]">
                        Fix Now
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}

                {mockClaimsNeedingAttention.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <div>All claims coded successfully!</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Coding Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI Coding Opportunities ({mockCodingOpportunities.length})
                </CardTitle>
                <CardDescription>
                  Suggestions to improve accuracy and reimbursement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockCodingOpportunities.map((opp) => (
                  <div
                    key={opp.id}
                    className="border rounded-lg p-4 hover:border-purple-400 transition-colors cursor-pointer"
                    onClick={() => onNavigate?.('Enhanced Claim Workspace', opp.claimId, 'coding')}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-50 rounded">
                        {getOpportunityIcon(opp.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium">{opp.title}</h4>
                          <Badge className="bg-purple-100 text-purple-700" variant="secondary">
                            {opp.confidence}%
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{opp.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <TrendingUp className="w-3 h-3 text-green-600" />
                          <span className="text-sm text-green-700 font-medium">{opp.impact}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Performance & Tips */}
          <div className="space-y-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-cyan-600" />
                  Your Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Code Specificity</span>
                    <span className="text-sm font-medium">{stats.specificityScore}%</span>
                  </div>
                  <Progress value={stats.specificityScore} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Accuracy Rate</span>
                    <span className="text-sm font-medium">{stats.accuracy}%</span>
                  </div>
                  <Progress value={stats.accuracy} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Avg Time per Chart</span>
                    <span className="text-sm font-medium">{stats.avgTimePerChart} min</span>
                  </div>
                  <div className="text-xs text-green-600">↓ 3 min vs last week</div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium">Weekly Goal</span>
                  </div>
                  <Progress value={67} className="h-2 mb-1" />
                  <div className="text-xs text-gray-600">67/100 charts coded</div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Tips */}
            <Card className="bg-gradient-to-br from-purple-50 to-cyan-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Sparkles className="w-5 h-5" />
                  Today's Coding Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-white rounded border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-red-100 text-red-700" variant="secondary">
                      High Priority
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-purple-900">HCC Coding Update</p>
                  <p className="text-sm text-purple-700 mt-1">
                    New diabetes HCC mappings for 2024
                  </p>
                </div>

                <div className="p-3 bg-white rounded border border-purple-200">
                  <p className="text-sm font-medium text-purple-900">Medicare E&M Changes</p>
                  <p className="text-sm text-purple-700 mt-1">
                    Updated guidelines for 99213-99215
                  </p>
                </div>

                <div className="p-3 bg-white rounded border border-purple-200">
                  <p className="text-sm font-medium text-purple-900">Modifier Usage</p>
                  <p className="text-sm text-purple-700 mt-1">
                    When to use 59 vs XU modifiers
                  </p>
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
                  onClick={() => onNavigate?.('Claims Inbox')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Claims Inbox
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onNavigate?.('Code Library')}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Code Library
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onNavigate?.('Reports & Analytics')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  My Performance
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Trophy({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}