import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  FileText,
  Calendar,
  Download,
  Filter,
  Target,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface EnhancedReportsAnalyticsProps {
  userRole?: 'coder' | 'biller' | 'manager' | 'executive';
}

// Mock data for charts
const monthlyRevenueData = [
  { month: 'Jun', billed: 245000, collected: 220000, denied: 15000 },
  { month: 'Jul', billed: 268000, collected: 242000, denied: 18000 },
  { month: 'Aug', billed: 282000, collected: 258000, denied: 16000 },
  { month: 'Sep', billed: 295000, collected: 275000, denied: 12000 },
  { month: 'Oct', billed: 312000, collected: 289000, denied: 14000 },
];

const denialsByReasonData = [
  { reason: 'CO-16: Lacks Info', count: 45, value: 34500 },
  { reason: 'CO-197: No Auth', count: 32, value: 28900 },
  { reason: 'CO-22: COB Issue', count: 28, value: 21200 },
  { reason: 'CO-45: Fee Schedule', count: 24, value: 18700 },
  { reason: 'CO-11: Duplicate', count: 18, value: 12800 },
  { reason: 'Other', count: 35, value: 24600 },
];

const payerPerformanceData = [
  { payer: 'Medicare', claims: 245, acceptance: 96, avgDays: 12, collected: 185000 },
  { payer: 'BCBS', claims: 189, acceptance: 94, avgDays: 18, collected: 142000 },
  { payer: 'UnitedHealthcare', claims: 167, acceptance: 91, avgDays: 22, collected: 128000 },
  { payer: 'Aetna', claims: 145, acceptance: 93, avgDays: 16, collected: 98000 },
  { payer: 'Cigna', claims: 128, acceptance: 89, avgDays: 24, collected: 87000 },
];

const coderPerformanceData = [
  { name: 'Dr. Sarah Johnson', charts: 142, accuracy: 97.2, avgTime: 16, hccs: 28 },
  { name: 'Dr. Michael Chen', charts: 135, accuracy: 96.8, avgTime: 18, hccs: 25 },
  { name: 'Dr. Emily Rodriguez', charts: 128, accuracy: 95.5, avgTime: 19, hccs: 22 },
  { name: 'Dr. James Wilson', charts: 121, accuracy: 94.8, avgTime: 21, hccs: 20 },
  { name: 'Dr. Lisa Anderson', charts: 118, accuracy: 96.1, avgTime: 17, hccs: 24 },
];

const rejectionTrendsData = [
  { week: 'Week 1', ch: 8, payer: 12 },
  { week: 'Week 2', ch: 6, payer: 15 },
  { week: 'Week 3', ch: 5, payer: 11 },
  { week: 'Week 4', ch: 4, payer: 9 },
];

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#3b82f6'];

export function EnhancedReportsAnalytics({ userRole = 'manager' }: EnhancedReportsAnalyticsProps) {
  const [dateRange, setDateRange] = useState('30days');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // Calculate KPIs
  const totalBilled = monthlyRevenueData.reduce((sum, item) => sum + item.billed, 0);
  const totalCollected = monthlyRevenueData.reduce((sum, item) => sum + item.collected, 0);
  const totalDenied = monthlyRevenueData.reduce((sum, item) => sum + item.denied, 0);
  const collectionRate = ((totalCollected / totalBilled) * 100).toFixed(1);
  const denialRate = ((totalDenied / totalBilled) * 100).toFixed(1);

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-[#62d5e4]" />
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive performance metrics and revenue cycle analytics
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="cardiology">Cardiology</SelectItem>
                <SelectItem value="orthopedics">Orthopedics</SelectItem>
                <SelectItem value="primary">Primary Care</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Executive Summary KPIs */}
        <div className="grid grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Total Billed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalBilled / 1000).toFixed(0)}K</div>
              <div className="text-sm text-green-600 mt-1">↑ 8.2% vs prior period</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Total Collected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${(totalCollected / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-green-600 mt-1">↑ 12.1% improvement</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                Collection Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">{collectionRate}%</div>
              <div className="text-sm text-green-600 mt-1">↑ 2.3% this month</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                Denial Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{denialRate}%</div>
              <div className="text-sm text-green-600 mt-1">↓ 1.2% improvement</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Avg Days in A/R
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">28</div>
              <div className="text-sm text-green-600 mt-1">↓ 3 days</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                Clean Claim Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">94.8%</div>
              <div className="text-sm text-green-600 mt-1">↑ 3.1% this month</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Different Reports */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="revenue">Revenue Cycle</TabsTrigger>
            <TabsTrigger value="denials">Denials Analysis</TabsTrigger>
            <TabsTrigger value="payers">Payer Performance</TabsTrigger>
            <TabsTrigger value="team">Team Performance</TabsTrigger>
            <TabsTrigger value="productivity">Productivity</TabsTrigger>
          </TabsList>

          {/* Revenue Cycle Tab */}
          <TabsContent value="revenue" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Monthly Revenue Trend */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Monthly Revenue Trend</CardTitle>
                  <CardDescription>Billed, collected, and denied amounts over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${(Number(value) / 1000).toFixed(0)}K`} />
                      <Legend />
                      <Bar dataKey="billed" fill="#3b82f6" name="Billed" />
                      <Bar dataKey="collected" fill="#22c55e" name="Collected" />
                      <Bar dataKey="denied" fill="#ef4444" name="Denied" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* A/R Aging */}
              <Card>
                <CardHeader>
                  <CardTitle>A/R Aging Breakdown</CardTitle>
                  <CardDescription>Outstanding balances by age</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">0-30 Days</span>
                      <span className="text-sm font-medium">$124,500 (52%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '52%' }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">31-60 Days</span>
                      <span className="text-sm font-medium">$68,200 (28%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '28%' }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">61-90 Days</span>
                      <span className="text-sm font-medium">$32,100 (14%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '14%' }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">90+ Days</span>
                      <span className="text-sm font-medium">$15,800 (6%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '6%' }} />
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Outstanding</span>
                      <span className="text-sm font-bold">$240,600</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collection Rate Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Collection Rate Trend</CardTitle>
                  <CardDescription>Weekly collection rate percentage</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={[
                        { week: 'W1', rate: 89.5 },
                        { week: 'W2', rate: 91.2 },
                        { week: 'W3', rate: 92.8 },
                        { week: 'W4', rate: 93.4 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis domain={[85, 100]} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        stroke="#22c55e"
                        strokeWidth={2}
                        name="Collection Rate"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Denials Analysis Tab */}
          <TabsContent value="denials" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Denials by Reason */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Denial Reasons</CardTitle>
                  <CardDescription>Most common denial codes and impact</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={denialsByReasonData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ reason, percent }) =>
                          `${reason.split(':')[0]} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {denialsByReasonData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Denial Details Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Denial Impact Details</CardTitle>
                  <CardDescription>Count and value by reason code</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {denialsByReasonData.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.reason}</div>
                          <div className="text-xs text-gray-500">{item.count} claims</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-red-600">
                            ${item.value.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Rejection Trends */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Rejection Trends (CH vs Payer)</CardTitle>
                  <CardDescription>Weekly rejection counts by source</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={rejectionTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ch" fill="#ef4444" name="Clearinghouse" />
                      <Bar dataKey="payer" fill="#f97316" name="Payer" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payer Performance Tab */}
          <TabsContent value="payers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payer Performance Comparison</CardTitle>
                <CardDescription>Claims volume, acceptance rate, and collection metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payerPerformanceData.map((payer, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-4 hover:border-[#62d5e4] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{payer.payer}</h4>
                          <p className="text-sm text-gray-500">{payer.claims} claims submitted</p>
                        </div>
                        <Badge
                          className={
                            payer.acceptance >= 95
                              ? 'bg-green-100 text-green-700'
                              : payer.acceptance >= 90
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'
                          }
                          variant="secondary"
                        >
                          {payer.acceptance}% Acceptance
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Avg Days to Pay:</span>
                          <span className="ml-2 font-medium">{payer.avgDays} days</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Collected:</span>
                          <span className="ml-2 font-medium text-green-600">
                            ${payer.collected.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <span
                            className={`ml-2 font-medium ${
                              payer.acceptance >= 95 ? 'text-green-600' : 'text-orange-600'
                            }`}
                          >
                            {payer.acceptance >= 95 ? 'Excellent' : 'Needs Attention'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Performance Tab */}
          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Coder Performance Metrics</CardTitle>
                <CardDescription>Individual productivity and quality scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {coderPerformanceData.map((coder, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-4 hover:border-purple-400 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{coder.name}</h4>
                            <p className="text-sm text-gray-500">{coder.charts} charts coded</p>
                          </div>
                        </div>
                        <Badge
                          className={
                            coder.accuracy >= 97
                              ? 'bg-green-100 text-green-700'
                              : coder.accuracy >= 95
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }
                          variant="secondary"
                        >
                          {coder.accuracy}% Accuracy
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Avg Time/Chart:</span>
                          <span className="ml-2 font-medium">{coder.avgTime} min</span>
                        </div>
                        <div>
                          <span className="text-gray-500">HCCs Captured:</span>
                          <span className="ml-2 font-medium text-purple-600">{coder.hccs}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Performance:</span>
                          <span
                            className={`ml-2 font-medium ${
                              coder.accuracy >= 97 ? 'text-green-600' : 'text-orange-600'
                            }`}
                          >
                            {coder.accuracy >= 97 ? 'Excellent' : 'Good'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Productivity Tab */}
          <TabsContent value="productivity" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Claims Submitted</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">874</div>
                  <div className="text-sm text-green-600 mt-1">↑ 12.5% vs last month</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Avg Processing Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">18 min</div>
                  <div className="text-sm text-green-600 mt-1">↓ 2 min improvement</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI Assist Adoption</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">87%</div>
                  <div className="text-sm text-green-600 mt-1">↑ 15% this month</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Daily Productivity Trend</CardTitle>
                <CardDescription>Claims processed per day over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={[
                      { day: 'Day 1', claims: 28 },
                      { day: 'Day 5', claims: 32 },
                      { day: 'Day 10', claims: 35 },
                      { day: 'Day 15', claims: 31 },
                      { day: 'Day 20', claims: 38 },
                      { day: 'Day 25', claims: 36 },
                      { day: 'Day 30', claims: 41 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="claims"
                      stroke="#62d5e4"
                      strokeWidth={2}
                      name="Claims Processed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Insights */}
        <Card className="bg-gradient-to-br from-purple-50 to-cyan-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Activity className="w-5 h-5" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-white rounded border border-purple-200">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-900">
                    Collection rate improved 2.3%
                  </p>
                  <p className="text-sm text-purple-700 mt-1">
                    Driven by faster ERA posting and reduced denials in Medicare claims
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white rounded border border-purple-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-900">
                    UnitedHealthcare acceptance below target
                  </p>
                  <p className="text-sm text-purple-700 mt-1">
                    91% acceptance (target: 95%). Primary issue: CO-16 (Lacks information)
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white rounded border border-purple-200">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-900">
                    HCC capture rate increased 18%
                  </p>
                  <p className="text-sm text-purple-700 mt-1">
                    AI coding suggestions driving specificity improvements and RAF optimization
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
