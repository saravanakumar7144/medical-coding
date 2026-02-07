import { useState, useMemo } from 'react';
import {
  FileText, Clock, CheckCircle, AlertCircle, TrendingUp,
  Brain, Zap, Target, Award, BarChart3, Calendar, Users,
  Book, Lightbulb, ArrowRight, Star, Activity, Sparkles
} from 'lucide-react';

type Period = 'today' | 'week' | 'month';

export function CoderDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');

  // Period-specific stats
  const statsData = {
    today: {
      chartsAssigned: 12,
      chartsCompleted: 8,
      chartsPending: 4,
      accuracy: 96.5,
      avgTimePerChart: 18,
      aiSuggestionsUsed: 23,
      productivity: 142,
      qualityScore: 94,
      change: '↑ 8 from yesterday',
      accuracyChange: '↑ 1.2% this week',
      timeChange: '↓ 3m faster'
    },
    week: {
      chartsAssigned: 87,
      chartsCompleted: 78,
      chartsPending: 9,
      accuracy: 95.8,
      avgTimePerChart: 19,
      aiSuggestionsUsed: 156,
      productivity: 138,
      qualityScore: 93,
      change: '↑ 15 from last week',
      accuracyChange: '↑ 0.8% this month',
      timeChange: '↓ 2m faster'
    },
    month: {
      chartsAssigned: 342,
      chartsCompleted: 324,
      chartsPending: 18,
      accuracy: 95.2,
      avgTimePerChart: 20,
      aiSuggestionsUsed: 612,
      productivity: 135,
      qualityScore: 92,
      change: '↑ 48 from last month',
      accuracyChange: '↑ 0.5% this quarter',
      timeChange: '↓ 1m faster'
    }
  };

  // Period-specific charts data
  const chartsData = {
    today: [
      { id: 'CH001', patient: 'John Smith', type: 'E&M Office Visit', status: 'completed', codes: ['99213', 'I10', 'E11.9'], time: '12 min', aiAssisted: true, date: '10/23/24 - 9:15 AM' },
      { id: 'CH002', patient: 'Maria Garcia', type: 'Surgical', status: 'in-progress', codes: ['45380', 'K57.32'], time: '25 min', aiAssisted: true, date: '10/23/24 - 10:30 AM' },
      { id: 'CH003', patient: 'Robert Wilson', type: 'Radiology', status: 'pending', codes: [], time: '-', aiAssisted: false, date: '10/23/24 - 11:45 AM' },
      { id: 'CH004', patient: 'Sarah Johnson', type: 'Lab Services', status: 'pending', codes: [], time: '-', aiAssisted: false, date: '10/23/24 - 2:00 PM' }
    ],
    week: [
      { id: 'CH078', patient: 'Michael Brown', type: 'E&M Office Visit', status: 'completed', codes: ['99214', 'J44.1', 'I50.9'], time: '15 min', aiAssisted: true, date: '10/21/24' },
      { id: 'CH079', patient: 'Jennifer Davis', type: 'Preventive', status: 'completed', codes: ['99395', 'Z00.00'], time: '10 min', aiAssisted: false, date: '10/21/24' },
      { id: 'CH080', patient: 'William Taylor', type: 'Diagnostic', status: 'completed', codes: ['93000', 'I48.91'], time: '8 min', aiAssisted: true, date: '10/22/24' },
      { id: 'CH081', patient: 'Linda Martinez', type: 'Surgical', status: 'completed', codes: ['29881', 'M23.205'], time: '22 min', aiAssisted: true, date: '10/22/24' },
      { id: 'CH082', patient: 'David Anderson', type: 'E&M Office Visit', status: 'in-progress', codes: ['99213'], time: '18 min', aiAssisted: true, date: '10/23/24' },
      { id: 'CH083', patient: 'Patricia White', type: 'Lab Services', status: 'pending', codes: [], time: '-', aiAssisted: false, date: '10/23/24' }
    ],
    month: [
      { id: 'CH324', patient: 'Christopher Lee', type: 'E&M Office Visit', status: 'completed', codes: ['99215', 'I25.10', 'E78.5'], time: '20 min', aiAssisted: true, date: '10/01/24' },
      { id: 'CH325', patient: 'Barbara Harris', type: 'Surgical', status: 'completed', codes: ['43239', 'K21.9'], time: '28 min', aiAssisted: true, date: '10/03/24' },
      { id: 'CH326', patient: 'James Walker', type: 'Preventive', status: 'completed', codes: ['99396', 'Z00.00'], time: '12 min', aiAssisted: false, date: '10/05/24' },
      { id: 'CH327', patient: 'Elizabeth Hall', type: 'Diagnostic', status: 'completed', codes: ['71046', 'J18.9'], time: '7 min', aiAssisted: true, date: '10/08/24' },
      { id: 'CH328', patient: 'Thomas Young', type: 'E&M Office Visit', status: 'completed', codes: ['99214', 'M54.5', 'M79.3'], time: '16 min', aiAssisted: true, date: '10/12/24' },
      { id: 'CH329', patient: 'Jessica King', type: 'Lab Services', status: 'completed', codes: ['80053', 'Z00.00'], time: '5 min', aiAssisted: false, date: '10/15/24' },
      { id: 'CH330', patient: 'Daniel Wright', type: 'Surgical', status: 'in-progress', codes: ['27447'], time: '32 min', aiAssisted: true, date: '10/20/24' },
      { id: 'CH331', patient: 'Nancy Lopez', type: 'E&M Office Visit', status: 'pending', codes: [], time: '-', aiAssisted: false, date: '10/22/24' }
    ]
  };

  // Period-specific AI suggestions
  const aiSuggestionsData = {
    today: [
      { code: 'E11.65', description: 'Type 2 diabetes with hyperglycemia', confidence: 96, reason: 'Based on HbA1c > 6.5% in recent labs' },
      { code: 'I48.91', description: 'Unspecified atrial fibrillation', confidence: 92, reason: 'ECG shows irregular rhythm, mentioned in provider notes' },
      { code: 'Z79.4', description: 'Long term use of insulin', confidence: 89, reason: 'Insulin prescription in medication list' }
    ],
    week: [
      { code: 'J44.1', description: 'COPD with acute exacerbation', confidence: 94, reason: 'Multiple mentions of wheezing and dyspnea this week' },
      { code: 'I50.23', description: 'Acute on chronic systolic heart failure', confidence: 91, reason: 'Pattern detected in 3 similar cases this week' },
      { code: 'E11.22', description: 'Type 2 diabetes with diabetic CKD', confidence: 88, reason: 'eGFR decline noted, consistent coding opportunity' },
      { code: 'M79.3', description: 'Panniculitis, unspecified', confidence: 85, reason: 'Documentation pattern suggests under-coding' }
    ],
    month: [
      { code: 'I25.10', description: 'Atherosclerotic heart disease', confidence: 93, reason: 'Frequently missing from CAD documentation this month' },
      { code: 'Z87.891', description: 'Personal history of nicotine dependence', confidence: 90, reason: 'Smoking history often not coded - HCC opportunity' },
      { code: 'N18.3', description: 'Chronic kidney disease, stage 3', confidence: 87, reason: 'Lab values support this - coded in only 60% of cases' },
      { code: 'F17.210', description: 'Nicotine dependence, cigarettes', confidence: 84, reason: 'Active smokers should have current diagnosis coded' },
      { code: 'E66.9', description: 'Obesity, unspecified', confidence: 82, reason: 'BMI > 30 documented but diagnosis missing' }
    ]
  };

  // Period-specific learning tips
  const learningTipsData = {
    today: [
      { title: 'HCC Coding Update', description: 'New diabetes HCC mappings for 2024', priority: 'high' },
      { title: 'Medicare E&M Changes', description: 'Updated guidelines for 99213-99215', priority: 'medium' },
      { title: 'Modifier Usage', description: 'When to use 59 vs XU modifiers', priority: 'medium' }
    ],
    week: [
      { title: 'Chronic Conditions', description: 'Ensure all chronic conditions are documented each visit', priority: 'high' },
      { title: 'Specificity Matters', description: '5th & 6th digit ICD-10 codes increase reimbursement', priority: 'high' },
      { title: 'COPD Coding', description: 'Distinguish between acute exacerbation and chronic', priority: 'medium' },
      { title: 'Lab Result Coding', description: 'Link abnormal labs to corresponding diagnoses', priority: 'medium' }
    ],
    month: [
      { title: 'RAF Score Optimization', description: 'Top HCC codes that impact risk adjustment scores', priority: 'high' },
      { title: 'Documentation Tips', description: 'Provider education reduces query volume by 40%', priority: 'high' },
      { title: 'Audit Readiness', description: 'Month-end checklist for compliance review', priority: 'high' },
      { title: 'Coding Trends', description: 'Your most common corrections and how to avoid them', priority: 'medium' },
      { title: 'Payer Rules', description: 'Medicare vs Commercial coding differences', priority: 'medium' }
    ]
  };

  // Get current period data
  const stats = useMemo(() => statsData[selectedPeriod], [selectedPeriod]);
  const recentCharts = useMemo(() => chartsData[selectedPeriod], [selectedPeriod]);
  const aiSuggestions = useMemo(() => aiSuggestionsData[selectedPeriod], [selectedPeriod]);
  const learningTips = useMemo(() => learningTipsData[selectedPeriod], [selectedPeriod]);

  // Get period label for headers
  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today': return "Today's";
      case 'week': return "This Week's";
      case 'month': return "This Month's";
    }
  };

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#62d5e4]" />
              Coder Workspace
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Your personalized coding dashboard with AI assistance
            </p>
          </div>
          
          {/* Time Period Filter Buttons */}
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setSelectedPeriod('today')}
              className={`px-4 py-2 text-sm rounded transition-all ${
                selectedPeriod === 'today' 
                  ? 'bg-[#62d5e4] text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`px-4 py-2 text-sm rounded transition-all ${
                selectedPeriod === 'week' 
                  ? 'bg-[#62d5e4] text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-4 py-2 text-sm rounded transition-all ${
                selectedPeriod === 'month' 
                  ? 'bg-[#62d5e4] text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {/* Quick Stats - Updated based on period */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Charts Assigned</span>
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-2xl text-gray-900">{stats.chartsAssigned}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-green-600">{stats.change}</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Completed</span>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-2xl text-gray-900">{stats.chartsCompleted}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-600">{stats.chartsPending} pending</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Accuracy Rate</span>
              <Target className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-2xl text-gray-900">{stats.accuracy}%</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-green-600">{stats.accuracyChange}</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Avg Time/Chart</span>
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-2xl text-gray-900">{stats.avgTimePerChart}m</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-green-600">{stats.timeChange}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* AI Suggestions - Updated based on period */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-purple-200">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <h2 className="text-sm text-purple-900">{getPeriodLabel()} AI Code Suggestions</h2>
                </div>
                <span className="text-xs text-purple-600">{aiSuggestions.length} active</span>
              </div>
              
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm text-gray-900">{suggestion.code}</span>
                          <span className="inline-flex items-center h-6 text-xs bg-green-100 text-green-700 px-2.5 rounded-full">
                            {suggestion.confidence}% match
                          </span>
                        </div>
                        <p className="text-xs text-gray-700">{suggestion.description}</p>
                        <p className="text-xs text-gray-500 mt-2">💡 {suggestion.reason}</p>
                      </div>
                      <button className="text-xs text-[#62d5e4] hover:text-[#4bc5d6] px-3 py-1.5 rounded hover:bg-cyan-50 transition-colors">
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Charts - Updated based on period */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <h2 className="text-sm text-gray-900">{getPeriodLabel()} Charts</h2>
                <span className="text-xs text-gray-500">
                  {stats.chartsCompleted} of {stats.chartsAssigned} completed
                </span>
              </div>
              
              <div className="space-y-3">
                {recentCharts.map((chart) => (
                  <div key={chart.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-[#62d5e4] hover:bg-gray-50 cursor-pointer transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-gray-900">{chart.id}</span>
                        <span className="text-sm text-gray-700">{chart.patient}</span>
                        {chart.aiAssisted && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            AI
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span>{chart.type}</span>
                        {chart.codes.length > 0 && (
                          <span className="font-mono">{chart.codes.join(', ')}</span>
                        )}
                        <span>⏱ {chart.time}</span>
                        <span className="text-gray-400">• {chart.date}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {chart.status === 'completed' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Completed
                        </span>
                      )}
                      {chart.status === 'in-progress' && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                          In Progress
                        </span>
                      )}
                      {chart.status === 'pending' && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          Pending
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Performance Score - Updated based on period */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm text-green-900">Quality Score</h3>
                </div>
                <span className="text-2xl text-green-900">{stats.qualityScore}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-green-700">Accuracy:</span>
                  <span className="text-green-900">{stats.accuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Productivity:</span>
                  <span className="text-green-900">{stats.productivity}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">AI Utilized:</span>
                  <span className="text-green-900">{stats.aiSuggestionsUsed}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-xs text-green-800">
                  🌟 You're in the top 10% of coders this {selectedPeriod === 'today' ? 'week' : selectedPeriod}!
                </p>
              </div>
            </div>

            {/* Learning Tips - Updated based on period */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="text-sm text-gray-900">{getPeriodLabel()} Learning Tips</h3>
              </div>
              
              <div className="space-y-2">
                {learningTips.map((tip, index) => (
                  <div key={index} className="p-2 border border-gray-200 rounded hover:border-[#62d5e4] cursor-pointer transition-colors">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-xs text-gray-900">{tip.title}</p>
                      {tip.priority === 'high' && (
                        <span className="text-xs text-red-600">●</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{tip.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <h3 className="text-sm text-gray-900 mb-3">Quick Actions</h3>
              
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors">
                  <FileText className="w-4 h-4" />
                  Start Next Chart
                </button>
                
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Book className="w-4 h-4" />
                  Code Library
                </button>
                
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Brain className="w-4 h-4" />
                  Ask AI Expert
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
