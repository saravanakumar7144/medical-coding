import { useState } from 'react';
import {
  Users, TrendingUp, Target, AlertCircle, BarChart3, Clock,
  CheckCircle, DollarSign, Award, Activity, Brain, Zap,
  FileText, ArrowUp, ArrowDown, Eye, Star, TrendingDown
} from 'lucide-react';

export function ManagerDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const teamStats = {
    totalCoders: 12,
    activeToday: 11,
    avgProductivity: 128,
    avgAccuracy: 94.2,
    chartsProcessed: 856,
    onTimeCompletion: 96,
    teamEfficiency: 142,
    qualityScore: 93
  };

  const topPerformers = [
    { name: 'Sarah Johnson', role: 'Senior Coder', productivity: 156, accuracy: 97.2, charts: 89, score: 98 },
    { name: 'Michael Chen', role: 'Coder II', productivity: 145, accuracy: 96.5, charts: 82, score: 95 },
    { name: 'Lisa Rodriguez', role: 'Coder II', productivity: 138, accuracy: 95.8, charts: 78, score: 92 }
  ];

  const needsAttention = [
    { name: 'Robert Davis', issue: 'Accuracy dropped to 88%', severity: 'high', metric: 'Quality' },
    { name: 'Jennifer Kim', issue: 'Productivity at 75%', severity: 'medium', metric: 'Speed' },
    { name: 'Team Average', issue: 'Backlog increased 15%', severity: 'medium', metric: 'Workflow' }
  ];

  const departmentMetrics = [
    { category: 'Productivity', current: 128, target: 120, trend: 'up', change: 6.7 },
    { category: 'Accuracy', current: 94.2, target: 93, trend: 'up', change: 1.3 },
    { category: 'Denial Rate', current: 4.1, target: 5, trend: 'down', change: -0.9 },
    { category: 'Revenue per Chart', current: 185, target: 175, trend: 'up', change: 5.7 }
  ];

  const aiInsights = [
    { title: 'Training Opportunity', message: 'Team accuracy on HCC codes is 89% vs 95% overall', action: 'Schedule Training' },
    { title: 'Process Improvement', message: 'E&M coding time reduced 18% with AI assistance', action: 'Expand AI Use' },
    { title: 'Revenue Impact', message: 'AI suggestions prevented $12,400 in denials this month', action: 'View Details' }
  ];

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-[#62d5e4]" />
              Manager Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Team performance, productivity metrics, and quality oversight
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedPeriod === 'week' ? 'bg-[#62d5e4] text-white' : 'text-gray-600'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedPeriod === 'month' ? 'bg-[#62d5e4] text-white' : 'text-gray-600'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setSelectedPeriod('quarter')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedPeriod === 'quarter' ? 'bg-[#62d5e4] text-white' : 'text-gray-600'
              }`}
            >
              Quarter
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-90">Team Size</span>
              <Users className="w-5 h-5" />
            </div>
            <p className="text-2xl">{teamStats.totalCoders}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs opacity-90">{teamStats.activeToday} active today</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Productivity</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl text-gray-900">{teamStats.avgProductivity}%</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUp className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-600">8% above target</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Accuracy</span>
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl text-gray-900">{teamStats.avgAccuracy}%</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUp className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-600">1.2% improvement</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Charts Processed</span>
              <FileText className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl text-gray-900">{teamStats.chartsProcessed}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-600">This month</span>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm text-purple-900">AI Management Insights</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {aiInsights.map((insight, index) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-purple-100">
                <h3 className="text-xs text-gray-900 mb-1">{insight.title}</h3>
                <p className="text-xs text-gray-600 mb-2">{insight.message}</p>
                <button className="text-xs text-[#62d5e4] hover:text-[#4bc5d6] flex items-center gap-1">
                  {insight.action}
                  <Zap className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-4">
            {/* Department Metrics */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h2 className="text-sm text-gray-900 mb-3">Department Performance</h2>
              
              <div className="space-y-3">
                {departmentMetrics.map((metric, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm text-gray-900">{metric.category}</h3>
                      <div className="flex items-center gap-2">
                        {metric.trend === 'up' ? (
                          <ArrowUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-green-600" />
                        )}
                        <span className="text-xs text-green-600">{Math.abs(metric.change)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl text-gray-900">{metric.current}{metric.category.includes('Rate') || metric.category.includes('Accuracy') || metric.category.includes('Productivity') ? '%' : ''}</p>
                        <p className="text-xs text-gray-500">Target: {metric.target}{metric.category.includes('Rate') || metric.category.includes('Accuracy') || metric.category.includes('Productivity') ? '%' : ''}</p>
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#62d5e4] h-2 rounded-full" 
                          style={{ width: `${Math.min((metric.current / metric.target) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm text-gray-900">Top Performers</h2>
                <button className="text-xs text-[#62d5e4] hover:text-[#4bc5d6]">View All</button>
              </div>
              
              <div className="space-y-2">
                {topPerformers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-white">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">{performer.name}</p>
                        <p className="text-xs text-gray-600">{performer.role}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-center">
                        <p className="text-gray-600">Charts</p>
                        <p className="text-gray-900">{performer.charts}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Accuracy</p>
                        <p className="text-green-600">{performer.accuracy}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Score</p>
                        <p className="text-purple-600">{performer.score}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Needs Attention */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm text-gray-900">Needs Attention</h3>
              </div>
              
              <div className="space-y-2">
                {needsAttention.map((item, index) => (
                  <div key={index} className={`p-2 border-l-4 ${
                    item.severity === 'high' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
                  } rounded-r`}>
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-xs text-gray-900">{item.name}</p>
                      <span className="text-xs text-gray-500">{item.metric}</span>
                    </div>
                    <p className="text-xs text-gray-600">{item.issue}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Efficiency */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-green-600" />
                <h3 className="text-sm text-green-900">Team Efficiency</h3>
              </div>
              
              <div className="text-center mb-3">
                <p className="text-3xl text-green-900">{teamStats.teamEfficiency}%</p>
                <p className="text-xs text-green-700">Above industry average</p>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-green-700">On-time completion:</span>
                  <span className="text-green-900">{teamStats.onTimeCompletion}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Quality score:</span>
                  <span className="text-green-900">{teamStats.qualityScore}</span>
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
                  <Users className="w-4 h-4" />
                  Team Schedule
                </button>
                
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <FileText className="w-4 h-4" />
                  Export Report
                </button>
                
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Brain className="w-4 h-4" />
                  AI Recommendations
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
