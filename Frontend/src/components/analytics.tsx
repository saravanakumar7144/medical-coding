import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Download, Share, TrendingUp, TrendingDown } from 'lucide-react';

export function Analytics() {
  const [activeTab, setActiveTab] = useState('Productivity');
  const [timeFilter, setTimeFilter] = useState('This Month');

  const tabs = ['Productivity', 'Accuracy', 'Revenue', 'HCC/RAF', 'Compliance'];

  // Sample data for charts
  const productivityData = [
    { name: 'Week 1', charts: 120, target: 130 },
    { name: 'Week 2', charts: 135, target: 130 },
    { name: 'Week 3', charts: 125, target: 130 },
    { name: 'Week 4', charts: 150, target: 130 }
  ];

  const accuracyData = [
    { name: 'Week 1', accuracy: 92, benchmark: 90 },
    { name: 'Week 2', accuracy: 95, benchmark: 90 },
    { name: 'Week 3', accuracy: 89, benchmark: 90 },
    { name: 'Week 4', accuracy: 96, benchmark: 90 }
  ];

  const coderPerformance = [
    { coder: 'Dr. Johnson', charts: 45, accuracy: '94%', revenue: '$18,500' },
    { coder: 'Dr. Martinez', charts: 38, accuracy: '92%', revenue: '$15,200' },
    { coder: 'Dr. Wilson', charts: 32, accuracy: '95%', revenue: '$14,800' },
    { coder: 'Dr. Thompson', charts: 41, accuracy: '91%', revenue: '$16,900' }
  ];

  const diagnosisDistribution = [
    { name: 'Circulatory', value: 25, color: '#62d5e4' },
    { name: 'Respiratory', value: 20, color: '#06B6D4' },
    { name: 'Endocrine', value: 18, color: '#8B5CF6' },
    { name: 'Musculoskeletal', value: 15, color: '#F59E0B' },
    { name: 'Other', value: 22, color: '#EF4444' }
  ];

  // Revenue data
  const revenueData = [
    { name: 'Week 1', actual: 45000, potential: 48000 },
    { name: 'Week 2', actual: 47000, potential: 50000 },
    { name: 'Week 3', actual: 44000, potential: 49000 },
    { name: 'Week 4', actual: 48000, potential: 52000 }
  ];

  const revenueOpportunities = [
    { issue: 'Missing modifiers', count: 12, impact: '$2,400' },
    { issue: 'Upcoding', count: 5, impact: '$3,500' },
    { issue: 'Unbundling', count: 8, impact: '$1,900' },
    { issue: 'Documentation gaps', count: 15, impact: '$4,200' },
    { issue: 'Medical necessity', count: 7, impact: '$2,100' }
  ];

  // Compliance data
  const complianceIssuesData = [
    { issue: 'Missing modifiers', frequency: 14 },
    { issue: 'Upcoding', frequency: 6 },
    { issue: 'Unbundling', frequency: 10 },
    { issue: 'Documentation gaps', frequency: 16 },
    { issue: 'Medical necessity', frequency: 8 }
  ];

  const complianceTrendsData = [
    { name: 'Week 1', score: 94 },
    { name: 'Week 2', score: 96 },
    { name: 'Week 3', score: 93 },
    { name: 'Week 4', score: 98 },
    { name: 'Week 5', score: 95 },
    { name: 'Week 6', score: 97 }
  ];

  // HCC/RAF Analytics Data
  const hccRafData = [
    { name: 'Jan', averageRAF: 1.124, captureRate: 78, suspectedHCCs: 245, capturedHCCs: 191 },
    { name: 'Feb', averageRAF: 1.156, captureRate: 82, suspectedHCCs: 267, capturedHCCs: 219 },
    { name: 'Mar', averageRAF: 1.189, captureRate: 85, suspectedHCCs: 289, capturedHCCs: 246 },
    { name: 'Apr', averageRAF: 1.203, captureRate: 87, suspectedHCCs: 301, capturedHCCs: 262 },
    { name: 'May', averageRAF: 1.187, captureRate: 84, suspectedHCCs: 278, capturedHCCs: 234 },
    { name: 'Jun', averageRAF: 1.212, captureRate: 89, suspectedHCCs: 295, capturedHCCs: 263 }
  ];

  const hccCohortData = [
    { payer: 'Medicare Advantage', members: 1247, avgRAF: 1.234, gaps: 89, potentialRevenue: '$45,600' },
    { payer: 'Medicaid MCO', members: 892, avgRAF: 0.987, gaps: 67, potentialRevenue: '$32,100' },
    { payer: 'Commercial MA', members: 564, avgRAF: 1.156, gaps: 43, potentialRevenue: '$28,900' },
    { payer: 'Dual Eligible', members: 378, avgRAF: 1.456, gaps: 34, potentialRevenue: '$19,800' }
  ];

  const hccGapsData = [
    { hcc: 'HCC18 - Diabetes', suspected: 45, captured: 32, gap: 13, rafImpact: 0.104 },
    { hcc: 'HCC85 - Hypertension', suspected: 67, captured: 58, gap: 9, rafImpact: 0.323 },
    { hcc: 'HCC86 - Coronary Artery Disease', suspected: 34, captured: 28, gap: 6, rafImpact: 0.318 },
    { hcc: 'HCC96 - Ischemic Heart Disease', suspected: 29, captured: 23, gap: 6, rafImpact: 0.318 },
    { hcc: 'HCC23 - Depression', suspected: 38, captured: 35, gap: 3, rafImpact: 0.309 }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}{entry.dataKey.includes('accuracy') ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-600">{payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Analytics & Reporting</h1>
            <div className="flex items-center gap-3">
              <select 
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
              >
                <option>This Month</option>
                <option>Last Month</option>
                <option>Last 3 Months</option>
                <option>This Year</option>
              </select>
              <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg">
                <Calendar className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Export Report
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Share className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total Charts Coded</p>
                <TrendingUp className="w-4 h-4 text-[#62d5e4]" />
              </div>
              <p className="text-2xl font-semibold text-gray-900">555</p>
              <p className="text-sm text-[#62d5e4]">+12% from last month</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Average Accuracy</p>
                <TrendingUp className="w-4 h-4 text-[#62d5e4]" />
              </div>
              <p className="text-2xl font-semibold text-gray-900">93.2%</p>
              <p className="text-sm text-[#62d5e4]">+2.1% from last month</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Revenue Generated</p>
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl font-semibold text-gray-900">$191,000</p>
              <p className="text-sm text-red-600">-8.2% from last month</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Compliance Score</p>
                <TrendingUp className="w-4 h-4 text-[#62d5e4]" />
              </div>
              <p className="text-2xl font-semibold text-gray-900">95.8%</p>
              <p className="text-sm text-[#62d5e4]">+1.2% from last month</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6 sticky top-[180px] z-10">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-[#62d5e4] text-[#62d5e4]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 px-4 py-4 max-h-96 overflow-auto">
          {activeTab === 'Productivity' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coding Volume Chart */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">Coding Volume</h3>
                  <p className="text-sm text-gray-600 mb-4">Charts coded vs. target</p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productivityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="charts" fill="#62d5e4" name="Charts" />
                        <Bar dataKey="target" fill="#06B6D4" name="Target" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Coder Performance Table */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">Coder Performance</h3>
                  <p className="text-sm text-gray-600 mb-4">Charts coded by coder</p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left text-sm font-medium text-gray-900 pb-2">Coder</th>
                          <th className="text-right text-sm font-medium text-gray-900 pb-2">Charts</th>
                          <th className="text-right text-sm font-medium text-gray-900 pb-2">Accuracy</th>
                          <th className="text-right text-sm font-medium text-gray-900 pb-2">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {coderPerformance.map((coder, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="py-3 text-sm text-gray-900">{coder.coder}</td>
                            <td className="py-3 text-sm text-gray-900 text-right">{coder.charts}</td>
                            <td className="py-3 text-sm text-gray-900 text-right">{coder.accuracy}</td>
                            <td className="py-3 text-sm text-gray-900 text-right">{coder.revenue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Accuracy' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coding Accuracy Chart */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">Coding Accuracy</h3>
                  <p className="text-sm text-gray-600 mb-4">Accuracy percentage vs. benchmark</p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={accuracyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[80, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                          type="monotone" 
                          dataKey="accuracy" 
                          stroke="#62d5e4" 
                          strokeWidth={3}
                          dot={{ fill: '#62d5e4', strokeWidth: 2, r: 6 }}
                          name="Accuracy"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="benchmark" 
                          stroke="#94A3B8" 
                          strokeDasharray="5 5"
                          name="Benchmark"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Diagnosis Distribution */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">Diagnosis Distribution</h3>
                  <p className="text-sm text-gray-600 mb-4">Distribution of coding categories</p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={diagnosisDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name} ${value}%`}
                        >
                          {diagnosisDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Revenue' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Analysis Chart */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">Revenue Analysis</h3>
                  <p className="text-sm text-gray-600 mb-4">Actual vs. potential revenue</p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis 
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                  <p className="font-medium text-gray-900">{label}</p>
                                  {payload.map((entry: any, index: number) => (
                                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                                      {entry.dataKey === 'actual' ? 'Actual' : 'Potential'}: ${entry.value.toLocaleString()}
                                    </p>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="actual" fill="#62d5e4" name="Actual" />
                        <Bar dataKey="potential" fill="#06B6D4" name="Potential" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Revenue Opportunities */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">Revenue Opportunities</h3>
                  <p className="text-sm text-gray-600 mb-4">Potential additional revenue by addressing issues</p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left text-sm font-medium text-gray-900 pb-3">Issue</th>
                          <th className="text-right text-sm font-medium text-gray-900 pb-3">Count</th>
                          <th className="text-right text-sm font-medium text-gray-900 pb-3">Revenue Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {revenueOpportunities.map((opportunity, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 text-sm text-gray-900">{opportunity.issue}</td>
                            <td className="py-3 text-sm text-gray-900 text-right">{opportunity.count}</td>
                            <td className="py-3 text-sm font-medium text-[#62d5e4] text-right">{opportunity.impact}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Total Potential Revenue</span>
                      <span className="text-lg font-semibold text-[#62d5e4]">$14,100</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Compliance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Compliance Issues Chart */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">Compliance Issues</h3>
                  <p className="text-sm text-gray-600 mb-4">Top compliance issues by frequency</p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={complianceIssuesData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="issue" type="category" width={120} />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                  <p className="font-medium text-gray-900">{label}</p>
                                  <p className="text-sm text-[#62d5e4]">
                                    Frequency: {payload[0].value}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="frequency" fill="#62d5e4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Compliance Trends */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">Compliance Trends</h3>
                  <p className="text-sm text-gray-600 mb-4">Compliance score over time</p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={complianceTrendsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[90, 100]} />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                  <p className="font-medium text-gray-900">{label}</p>
                                  <p className="text-sm text-[#62d5e4]">
                                    Compliance Score: {payload[0].value}%
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#62d5e4" 
                          strokeWidth={3}
                          dot={{ fill: '#62d5e4', strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8, stroke: '#62d5e4', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Additional Compliance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h4 className="font-medium text-gray-900 mb-3">Audit Readiness</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-semibold text-[#62d5e4]">A</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Current Grade</p>
                      <p className="font-medium text-gray-900">Excellent</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h4 className="font-medium text-gray-900 mb-3">Risk Assessment</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-semibold text-yellow-600">2</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">High Risk Items</p>
                      <p className="font-medium text-gray-900">Low Risk</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h4 className="font-medium text-gray-900 mb-3">Documentation Quality</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-semibold text-teal-600">94</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Quality Score</p>
                      <p className="font-medium text-gray-900">Excellent</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'HCC/RAF' && (
            <div className="space-y-6">
              {/* RAF Score Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#62d5e4]/10 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-semibold text-[#62d5e4]">1.21</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Average RAF Score</p>
                      <p className="font-medium text-gray-900">+3.2% vs target</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-semibold text-green-600">87</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Capture Rate</p>
                      <p className="font-medium text-gray-900">87% of suspected</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-semibold text-orange-600">67</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">HCC Gaps</p>
                      <p className="font-medium text-gray-900">Opportunities</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-semibold text-purple-600">$126K</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Financial Impact</p>
                      <p className="font-medium text-gray-900">Potential revenue</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* RAF Trends */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">RAF Score Trends</h3>
                  <p className="text-sm text-gray-600 mb-4">Average RAF score and capture rate over time</p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={hccRafData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip content={CustomTooltip} />
                        <Line yAxisId="left" type="monotone" dataKey="averageRAF" stroke="#62d5e4" strokeWidth={3} />
                        <Line yAxisId="right" type="monotone" dataKey="captureRate" stroke="#10B981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* HCC Gaps Analysis */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">Top HCC Gaps</h3>
                  <p className="text-sm text-gray-600 mb-4">Suspected vs captured HCCs by category</p>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {hccGapsData.map((gap, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 text-sm">{gap.hcc}</span>
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            {gap.gap} gaps
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Suspected: {gap.suspected}</span>
                          <span>Captured: {gap.captured}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-[#62d5e4] h-2 rounded-full" 
                            style={{ width: `${(gap.captured / gap.suspected) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          RAF Impact: +{gap.rafImpact} per member
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cohort Analysis */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">HCC Cohort Analysis</h3>
                <p className="text-sm text-gray-600 mb-4">RAF performance by payer and member population</p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Payer</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Members</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Avg RAF</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">HCC Gaps</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Potential Revenue</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {hccCohortData.map((cohort, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{cohort.payer}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">{cohort.members.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`font-medium ${
                              cohort.avgRAF > 1.2 ? 'text-green-600' : 
                              cohort.avgRAF > 1.0 ? 'text-[#62d5e4]' : 'text-red-600'
                            }`}>
                              {cohort.avgRAF.toFixed(3)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                              {cohort.gaps}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                            {cohort.potentialRevenue}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button className="px-3 py-1 text-xs bg-[#62d5e4] text-white rounded hover:bg-[#4bc5d6] transition-colors">
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}