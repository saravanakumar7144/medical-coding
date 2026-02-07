import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Activity,
  AlertTriangle,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  ChevronRight,
  Award,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface EnhancedExecutiveDashboardProps {
  onNavigate?: (page: string) => void;
}

// Strategic KPI data
const quarterlyRevenueData = [
  { quarter: 'Q1 2024', revenue: 3250000, target: 3000000 },
  { quarter: 'Q2 2024', revenue: 3580000, target: 3200000 },
  { quarter: 'Q3 2024', revenue: 3920000, target: 3500000 },
  { quarter: 'Q4 2024', revenue: 4100000, target: 3800000 },
];

const departmentPerformanceData = [
  { department: 'Cardiology', revenue: 1245000, margin: 32, growth: 12.5 },
  { department: 'Orthopedics', revenue: 987000, margin: 28, growth: 8.3 },
  { department: 'Primary Care', revenue: 765000, margin: 24, growth: 15.2 },
  { department: 'Neurology', revenue: 654000, margin: 29, growth: 6.7 },
  { department: 'Gastro', revenue: 532000, margin: 26, growth: 9.8 },
];

const kpiTrendsData = [
  { month: 'Jun', collectionRate: 89.5, denialRate: 6.2, daysInAR: 32 },
  { month: 'Jul', collectionRate: 91.2, denialRate: 5.8, daysInAR: 30 },
  { month: 'Aug', collectionRate: 92.8, denialRate: 5.2, daysInAR: 29 },
  { month: 'Sep', collectionRate: 93.4, denialRate: 4.9, daysInAR: 28 },
  { month: 'Oct', collectionRate: 94.1, denialRate: 4.7, daysInAR: 28 },
];

export function EnhancedExecutiveDashboard({ onNavigate }: EnhancedExecutiveDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('quarter');

  const stats = {
    netRevenue: 4100000,
    revenueGrowth: 14.2,
    operatingMargin: 28.5,
    marginChange: 3.2,
    collectionRate: 94.1,
    denialRate: 4.7,
    daysInAR: 28,
    staffProductivity: 142,
  };

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-[#62d5e4]" />
              Executive Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Strategic KPIs, financial performance, and operational excellence metrics
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                selectedPeriod === 'month' ? 'bg-[#62d5e4] text-white' : 'text-gray-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPeriod('quarter')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                selectedPeriod === 'quarter' ? 'bg-[#62d5e4] text-white' : 'text-gray-600'
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setSelectedPeriod('year')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                selectedPeriod === 'year' ? 'bg-[#62d5e4] text-white' : 'text-gray-600'
              }`}
            >
              Annual
            </button>
          </div>
        </div>

        {/* Executive Summary KPIs */}
        <div className="grid grid-cols-4 gap-6">
          <Card className="col-span-1">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Net Revenue (YTD)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${(stats.netRevenue / 1000000).toFixed(1)}M
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
                <TrendingUp className="w-4 h-4" />
                <span>↑ {stats.revenueGrowth}% YoY</span>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                Operating Margin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.operatingMargin}%</div>
              <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
                <TrendingUp className="w-4 h-4" />
                <span>↑ {stats.marginChange}% improvement</span>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Collection Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-600">{stats.collectionRate}%</div>
              <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
                <TrendingUp className="w-4 h-4" />
                <span>Industry best practice</span>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Days in A/R
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.daysInAR}</div>
              <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
                <TrendingDown className="w-4 h-4" />
                <span>↓ 12% vs industry avg</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Revenue Performance - Full Width */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Quarterly Revenue Performance vs Target
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
              <CardDescription>Revenue achievement and growth trajectory</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={quarterlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => `$${(Number(value) / 1000000).toFixed(2)}M`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#22c55e" name="Actual Revenue" />
                  <Bar dataKey="target" fill="#94a3b8" name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Department Performance */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Department Performance Summary
              </CardTitle>
              <CardDescription>Revenue, margin, and growth by department</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {departmentPerformanceData.map((dept, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-4 hover:border-[#62d5e4] transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{dept.department}</h4>
                      <p className="text-sm text-gray-500">Revenue</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        ${(dept.revenue / 1000).toFixed(0)}K
                      </div>
                      <Badge
                        className={
                          dept.growth >= 10
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }
                        variant="secondary"
                      >
                        ↑ {dept.growth}% growth
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Operating Margin:</span>
                      <span className="ml-2 font-medium">{dept.margin}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span
                        className={`ml-2 font-medium ${
                          dept.margin >= 28 && dept.growth >= 10
                            ? 'text-green-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {dept.margin >= 28 && dept.growth >= 10 ? 'Excellent' : 'Good'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* KPI Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-600" />
                Key Metrics Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Collection Rate</span>
                  <span className="text-sm font-medium text-green-600">94.1%</span>
                </div>
                <div className="text-xs text-green-600">↑ 4.6% over 5 months</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Denial Rate</span>
                  <span className="text-sm font-medium text-green-600">4.7%</span>
                </div>
                <div className="text-xs text-green-600">↓ 1.5% reduction</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Days in A/R</span>
                  <span className="text-sm font-medium text-green-600">28 days</span>
                </div>
                <div className="text-xs text-green-600">↓ 4 days improvement</div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Staff Productivity</span>
                  <span className="text-sm font-medium text-cyan-600">{stats.staffProductivity}</span>
                </div>
                <div className="text-xs text-gray-500">Index (100 = baseline)</div>
              </div>
            </CardContent>
          </Card>

          {/* KPI Trends Chart */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Revenue Cycle KPI Trends</CardTitle>
              <CardDescription>Collection rate and denial rate over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={kpiTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" domain={[85, 100]} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="collectionRate"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Collection Rate %"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="denialRate"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Denial Rate %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Strategic Insights */}
        <div className="grid grid-cols-2 gap-6">
          {/* AI Strategic Insights */}
          <Card className="bg-gradient-to-br from-purple-50 to-cyan-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Sparkles className="w-5 h-5" />
                AI Strategic Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-white rounded border border-purple-200">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">
                      Revenue on track for 108% of annual target
                    </p>
                    <p className="text-sm text-purple-700 mt-1">
                      Primary Care showing exceptional 15.2% growth driven by HCC capture
                      improvements
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white rounded border border-purple-200">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-cyan-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">
                      Collection rate improvement accelerating
                    </p>
                    <p className="text-sm text-purple-700 mt-1">
                      AI-powered ERA triage reducing posting time by 40%, contributing to 2.3%
                      collection rate gain
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white rounded border border-purple-200">
                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">
                      Staff productivity index up 42%
                    </p>
                    <p className="text-sm text-purple-700 mt-1">
                      87% AI assist adoption rate driving efficiency gains across all departments
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk & Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Risks & Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border-l-4 border-orange-500 pl-3 py-2">
                <p className="text-sm font-medium text-orange-900">Risk: Neurology Growth Slowing</p>
                <p className="text-sm text-gray-600 mt-1">
                  6.7% growth below target. Recommend process review and staff augmentation.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-3 py-2">
                <p className="text-sm font-medium text-green-900">
                  Opportunity: HCC Capture Expansion
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  AI identifying $180K annual RAF opportunity in existing patient population.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-3 py-2">
                <p className="text-sm font-medium text-blue-900">
                  Opportunity: Denial Rate Optimization
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Further 1% denial reduction could unlock $250K additional annual revenue.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Executive Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => onNavigate?.('Reports & Analytics')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Full Reports
              </Button>
              <Button variant="outline" className="justify-start">
                <DollarSign className="w-4 h-4 mr-2" />
                Financial Forecast
              </Button>
              <Button variant="outline" className="justify-start">
                <Users className="w-4 h-4 mr-2" />
                Team Analytics
              </Button>
              <Button variant="outline" className="justify-start">
                <Award className="w-4 h-4 mr-2" />
                Performance Review
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
