import { useState } from 'react';
import {
  TrendingUp, DollarSign, Users, Target, BarChart3, AlertCircle,
  CheckCircle, Clock, Award, Activity, Brain, Zap, ArrowUp,
  ArrowDown, Building, FileText, CreditCard, Percent
} from 'lucide-react';

export function ExecutiveDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('quarter');

  const kpis = {
    totalRevenue: 4250000,
    revenueGrowth: 12.5,
    denialRate: 4.3,
    collectionRate: 93.8,
    avgDaysAR: 32,
    netCollectionRate: 96.2,
    costPerClaim: 8.5,
    claimsVolume: 12450
  };

  const trends = [
    { metric: 'Revenue', current: '$4.25M', change: 12.5, trend: 'up', status: 'excellent' },
    { metric: 'Collection Rate', current: '93.8%', change: 2.3, trend: 'up', status: 'good' },
    { metric: 'Denial Rate', current: '4.3%', change: -1.2, trend: 'down', status: 'good' },
    { metric: 'Days in A/R', current: '32', change: -5, trend: 'down', status: 'good' }
  ];

  const departmentPerformance = [
    { dept: 'Coding', efficiency: 142, quality: 94, budget: 95, score: 96 },
    { dept: 'Billing', efficiency: 135, quality: 92, budget: 98, score: 94 },
    { dept: 'Collections', efficiency: 128, quality: 96, budget: 102, score: 91 },
    { dept: 'Denials Mgmt', efficiency: 156, quality: 89, budget: 93, score: 93 }
  ];

  const strategicInsights = [
    { 
      title: 'AI ROI Impact', 
      metric: '$125K', 
      description: 'Revenue recovered through AI denial prevention',
      impact: 'high'
    },
    { 
      title: 'Efficiency Gains', 
      metric: '18%', 
      description: 'Reduction in claim processing time with automation',
      impact: 'high'
    },
    { 
      title: 'Risk Mitigation', 
      metric: '42', 
      description: 'Compliance issues auto-detected and resolved',
      impact: 'medium'
    }
  ];

  const financialSummary = [
    { category: 'Gross Revenue', amount: 4500000, percentage: 100 },
    { category: 'Contractual Adjustments', amount: -225000, percentage: -5 },
    { category: 'Denials/Write-offs', amount: -180000, percentage: -4 },
    { category: 'Net Revenue', amount: 4095000, percentage: 91 }
  ];

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-gray-900 flex items-center gap-2">
              <Building className="w-6 h-6 text-[#62d5e4]" />
              Executive Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Strategic overview • Financial performance • Key metrics
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedPeriod === 'month' ? 'bg-[#62d5e4] text-white' : 'text-gray-600'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setSelectedPeriod('quarter')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedPeriod === 'quarter' ? 'bg-[#62d5e4] text-white' : 'text-gray-600'
              }`}
            >
              Quarter
            </button>
            <button
              onClick={() => setSelectedPeriod('year')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedPeriod === 'year' ? 'bg-[#62d5e4] text-white' : 'text-gray-600'
              }`}
            >
              YTD
            </button>
          </div>
        </div>

        {/* Key Financial Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm opacity-90">Total Revenue</span>
              <DollarSign className="w-6 h-6" />
            </div>
            <p className="text-3xl mb-1">${(kpis.totalRevenue / 1000000).toFixed(2)}M</p>
            <div className="flex items-center gap-1">
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm opacity-90">{kpis.revenueGrowth}% growth</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Collection Rate</span>
              <Target className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-3xl text-gray-900 mb-1">{kpis.collectionRate}%</p>
            <div className="flex items-center gap-1">
              <ArrowUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Above benchmark</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Denial Rate</span>
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-3xl text-gray-900 mb-1">{kpis.denialRate}%</p>
            <div className="flex items-center gap-1">
              <ArrowDown className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">1.2% improvement</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Days in A/R</span>
              <Clock className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-3xl text-gray-900 mb-1">{kpis.avgDaysAR}</p>
            <div className="flex items-center gap-1">
              <ArrowDown className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">5 days faster</span>
            </div>
          </div>
        </div>

        {/* Strategic AI Insights */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg text-purple-900">Strategic AI Insights</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {strategicInsights.map((insight, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-purple-100">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm text-gray-900">{insight.title}</h3>
                  <Zap className={`w-5 h-5 ${
                    insight.impact === 'high' ? 'text-green-500' : 'text-yellow-500'
                  }`} />
                </div>
                <p className="text-2xl text-purple-900 mb-1">{insight.metric}</p>
                <p className="text-xs text-gray-600">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-4">
            {/* Performance Trends */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg text-gray-900 mb-4">Key Performance Trends</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {trends.map((trend, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm text-gray-600">{trend.metric}</h3>
                      <div className="flex items-center gap-1">
                        {trend.trend === 'up' ? (
                          <ArrowUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-green-600" />
                        )}
                        <span className="text-xs text-green-600">{Math.abs(trend.change)}%</span>
                      </div>
                    </div>
                    
                    <p className="text-2xl text-gray-900 mb-2">{trend.current}</p>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            trend.status === 'excellent' ? 'bg-green-500' :
                            trend.status === 'good' ? 'bg-blue-500' :
                            'bg-yellow-500'
                          }`}
                          style={{ width: '75%' }}
                        />
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        trend.status === 'excellent' ? 'bg-green-100 text-green-700' :
                        trend.status === 'good' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {trend.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Performance */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg text-gray-900 mb-4">Department Performance</h2>
              
              <div className="space-y-3">
                {departmentPerformance.map((dept, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm text-gray-900">{dept.dept}</h3>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm text-gray-900">Score: {dept.score}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Efficiency</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(dept.efficiency, 100)}%` }} />
                          </div>
                          <span className="text-xs text-gray-900">{dept.efficiency}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Quality</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${dept.quality}%` }} />
                          </div>
                          <span className="text-xs text-gray-900">{dept.quality}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Budget</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${dept.budget <= 100 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(dept.budget, 100)}%` }} />
                          </div>
                          <span className="text-xs text-gray-900">{dept.budget}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Financial Summary */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm text-gray-900 mb-3">Financial Summary</h3>
              
              <div className="space-y-3">
                {financialSummary.map((item, index) => (
                  <div key={index} className={`${
                    item.category === 'Net Revenue' ? 'pt-3 border-t-2 border-gray-300' : ''
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">{item.category}</span>
                      <span className={`text-xs ${
                        item.amount < 0 ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {item.percentage}%
                      </span>
                    </div>
                    <p className={`text-sm ${
                      item.amount < 0 ? 'text-red-600' : 
                      item.category === 'Net Revenue' ? 'text-green-600' :
                      'text-gray-900'
                    }`}>
                      ${Math.abs(item.amount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Operational Metrics */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm text-gray-900 mb-3">Operational Metrics</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">Claims Volume</span>
                  </div>
                  <span className="text-sm text-gray-900">{kpis.claimsVolume.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-700">Net Collection</span>
                  </div>
                  <span className="text-sm text-gray-900">{kpis.netCollectionRate}%</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-gray-700">Cost per Claim</span>
                  </div>
                  <span className="text-sm text-gray-900">${kpis.costPerClaim}</span>
                </div>
              </div>
            </div>

            {/* Action Items */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <h3 className="text-sm text-orange-900">Priority Actions</h3>
              </div>
              
              <div className="space-y-2">
                <div className="bg-white rounded p-2">
                  <p className="text-xs text-gray-900 mb-1">Revenue Optimization</p>
                  <p className="text-xs text-gray-600">Review high-value denied claims</p>
                </div>
                
                <div className="bg-white rounded p-2">
                  <p className="text-xs text-gray-900 mb-1">Process Improvement</p>
                  <p className="text-xs text-gray-600">Expand AI automation to Collections</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm text-gray-900 mb-3">Quick Actions</h3>
              
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors">
                  <BarChart3 className="w-4 h-4" />
                  Full Analytics
                </button>
                
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <FileText className="w-4 h-4" />
                  Export Report
                </button>
                
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Brain className="w-4 h-4" />
                  AI Forecasting
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
