import { useState } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Award,
  Activity,
  BarChart3,
  FileText,
  DollarSign,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface EnhancedManagerDashboardProps {
  onNavigate?: (page: string) => void;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  productivity: number;
  quality: number;
  workload: number;
  status: 'excellent' | 'good' | 'needs_attention';
}

interface DepartmentMetric {
  name: string;
  current: number;
  target: number;
  trend: 'up' | 'down';
  change: number;
}

interface QualityAlert {
  id: string;
  type: 'quality' | 'productivity' | 'compliance';
  severity: 'high' | 'medium' | 'low';
  message: string;
  assignee: string;
  dueDate: string;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    role: 'Medical Coder',
    productivity: 97,
    quality: 97.2,
    workload: 12,
    status: 'excellent',
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Billing Specialist',
    productivity: 94,
    quality: 96.1,
    workload: 8,
    status: 'excellent',
  },
  {
    id: '3',
    name: 'Dr. Emily Rodriguez',
    role: 'Medical Coder',
    productivity: 88,
    quality: 95.5,
    workload: 14,
    status: 'good',
  },
  {
    id: '4',
    name: 'Jennifer Martinez',
    role: 'Billing Specialist',
    productivity: 82,
    quality: 93.2,
    workload: 15,
    status: 'needs_attention',
  },
  {
    id: '5',
    name: 'Dr. James Wilson',
    role: 'Medical Coder',
    productivity: 91,
    quality: 94.8,
    workload: 11,
    status: 'good',
  },
];

const mockDepartmentMetrics: DepartmentMetric[] = [
  { name: 'Clean Claim Rate', current: 94.8, target: 95, trend: 'up', change: 3.1 },
  { name: 'Coding Accuracy', current: 96.3, target: 97, trend: 'up', change: 1.8 },
  { name: 'Avg Days in A/R', current: 28, target: 25, trend: 'down', change: -3 },
  { name: 'Denial Rate', current: 4.7, target: 5, trend: 'down', change: -1.2 },
  { name: 'Collection Rate', current: 92.3, target: 93, trend: 'up', change: 2.3 },
];

const mockQualityAlerts: QualityAlert[] = [
  {
    id: '1',
    type: 'quality',
    severity: 'high',
    message: 'Dr. Rodriguez coding accuracy below 96% threshold (95.5%)',
    assignee: 'Training needed',
    dueDate: '10/25/24',
  },
  {
    id: '2',
    type: 'productivity',
    severity: 'medium',
    message: 'Jennifer Martinez workload at 125% capacity (15 claims)',
    assignee: 'Redistribute work',
    dueDate: '10/24/24',
  },
  {
    id: '3',
    type: 'compliance',
    severity: 'low',
    message: 'Medicare E&M documentation guidelines updated',
    assignee: 'Team training',
    dueDate: '10/30/24',
  },
];

export function EnhancedManagerDashboard({ onNavigate }: EnhancedManagerDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');

  const stats = {
    teamSize: mockTeamMembers.length,
    avgProductivity: 90.4,
    avgQuality: 95.4,
    alertsCount: mockQualityAlerts.length,
    cleanClaimRate: 94.8,
    totalClaims: 874,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-700';
      case 'good':
        return 'bg-blue-100 text-blue-700';
      case 'needs_attention':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-orange-100 text-orange-700';
      case 'low':
        return 'bg-yellow-100 text-yellow-700';
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
              <Users className="w-8 h-8 text-[#62d5e4]" />
              Manager Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Team oversight, performance tracking, and quality management
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
              <CardDescription>Team Size</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.teamSize}</div>
              <div className="text-sm text-gray-500 mt-1">Active members</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Productivity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-600">{stats.avgProductivity}%</div>
              <div className="text-sm text-green-600 mt-1">↑ 3.2% this week</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Quality</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.avgQuality}%</div>
              <div className="text-sm text-green-600 mt-1">↑ 1.8% improvement</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Clean Claim Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.cleanClaimRate}%</div>
              <div className="text-sm text-green-600 mt-1">↑ 3.1% this month</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Claims</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalClaims}</div>
              <div className="text-sm text-green-600 mt-1">↑ 12.5% vs last month</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.alertsCount}</div>
              <div className="text-sm text-gray-500 mt-1">Require action</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Team Performance */}
          <div className="col-span-2 space-y-6">
            {/* Team Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-600" />
                    Team Performance
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate?.('Reports & Analytics')}
                  >
                    View Details
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardTitle>
                <CardDescription>Individual productivity and quality metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockTeamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="border rounded-lg p-4 hover:border-[#62d5e4] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{member.name}</h4>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(member.status)} variant="secondary">
                        {member.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Productivity</span>
                          <span className="text-sm font-medium">{member.productivity}%</span>
                        </div>
                        <Progress value={member.productivity} className="h-2" />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Quality</span>
                          <span className="text-sm font-medium">{member.quality}%</span>
                        </div>
                        <Progress value={member.quality} className="h-2" />
                      </div>

                      <div>
                        <div className="text-sm text-gray-600">Workload</div>
                        <div className="text-sm font-medium">
                          {member.workload} claims{' '}
                          <span
                            className={
                              member.workload > 13
                                ? 'text-orange-600'
                                : member.workload < 8
                                ? 'text-blue-600'
                                : 'text-green-600'
                            }
                          >
                            ({member.workload > 13 ? 'High' : member.workload < 8 ? 'Low' : 'Good'}
                            )
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Department Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Department Metrics vs Targets
                </CardTitle>
                <CardDescription>Key performance indicators and progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockDepartmentMetrics.map((metric, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{metric.name}</span>
                        <Badge
                          className={
                            metric.trend === 'up'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }
                          variant="secondary"
                        >
                          {metric.trend === 'up' ? '↑' : '↓'} {Math.abs(metric.change)}%
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-600">
                        {metric.current}
                        {metric.name.includes('Rate') || metric.name.includes('Accuracy')
                          ? '%'
                          : ''}{' '}
                        / Target: {metric.target}
                        {metric.name.includes('Rate') || metric.name.includes('Accuracy')
                          ? '%'
                          : ''}
                      </span>
                    </div>
                    <Progress
                      value={(metric.current / metric.target) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Alerts & Insights */}
          <div className="space-y-6">
            {/* Quality Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Quality Alerts ({mockQualityAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockQualityAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="border rounded-lg p-3 hover:border-orange-400 transition-colors"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Badge className={getSeverityColor(alert.severity)} variant="secondary">
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mb-2">{alert.message}</p>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{alert.assignee}</span>
                      <span>Due: {alert.dueDate}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Training Recommendations */}
            <Card className="bg-gradient-to-br from-purple-50 to-cyan-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Sparkles className="w-5 h-5" />
                  AI Training Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-white rounded border border-purple-200">
                  <p className="text-sm font-medium text-purple-900">HCC Coding Workshop</p>
                  <p className="text-sm text-purple-700 mt-1">
                    3 team members would benefit from updated HCC/RAF training
                  </p>
                </div>

                <div className="p-3 bg-white rounded border border-purple-200">
                  <p className="text-sm font-medium text-purple-900">Medicare E&M Guidelines</p>
                  <p className="text-sm text-purple-700 mt-1">
                    New 2024 guidelines - schedule team refresher
                  </p>
                </div>

                <div className="p-3 bg-white rounded border border-purple-200">
                  <p className="text-sm font-medium text-purple-900">Denial Appeals Training</p>
                  <p className="text-sm text-purple-700 mt-1">
                    Improve CO-16 denial resolution success rate
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
                  onClick={() => onNavigate?.('Reports & Analytics')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Full Reports
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onNavigate?.('Claims Inbox')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Review Claims Queue
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Award className="w-4 h-4 mr-2" />
                  Team Assignments
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  Quality Audits
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
