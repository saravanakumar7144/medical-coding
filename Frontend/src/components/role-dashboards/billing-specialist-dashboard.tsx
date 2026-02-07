import { useState } from 'react';
import {
  DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock,
  FileText, Send, RefreshCw, Target, Award, BarChart3,
  CreditCard, AlertTriangle, ArrowRight, Zap, Brain, Activity
} from 'lucide-react';

export function BillingSpecialistDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  const stats = {
    claimsSubmitted: 45,
    claimsPaid: 38,
    claimsPending: 7,
    totalRevenue: 125680,
    averageClaimValue: 2793,
    denialRate: 4.2,
    collectionRate: 94.5,
    avgDaysToPayment: 18
  };

  const urgentClaims = [
    { id: 'CLM-2024-001', patient: 'John Smith', payer: 'Medicare', amount: 1250, status: 'pending-auth', days: 15, priority: 'high' },
    { id: 'CLM-2024-002', patient: 'Maria Garcia', payer: 'BCBS', amount: 3400, status: 'denied', days: 8, priority: 'critical' },
    { id: 'CLM-2024-003', patient: 'Robert Wilson', payer: 'Aetna', amount: 850, status: 'missing-info', days: 12, priority: 'high' }
  ];

  const aiRecommendations = [
    { type: 'collection', message: 'BCBS payments averaging 5 days faster with electronic submissions', action: 'Switch to EDI' },
    { type: 'denial', message: '3 claims can be auto-corrected and resubmitted', action: 'Review Now' },
    { type: 'revenue', message: 'Potential $4,200 recovery from 2 appealed claims', action: 'Track Appeals' }
  ];

  const payerPerformance = [
    { payer: 'Medicare', submitted: 15, paid: 14, denied: 1, avgDays: 12, rate: 93 },
    { payer: 'BCBS', submitted: 12, paid: 10, denied: 2, avgDays: 18, rate: 83 },
    { payer: 'Aetna', submitted: 10, paid: 9, denied: 1, avgDays: 15, rate: 90 },
    { payer: 'UHC', submitted: 8, paid: 5, denied: 3, avgDays: 22, rate: 63 }
  ];

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-gray-900 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-[#62d5e4]" />
              Billing Specialist Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Revenue cycle management and claims processing
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setSelectedPeriod('today')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedPeriod === 'today' ? 'bg-[#62d5e4] text-white' : 'text-gray-600'
              }`}
            >
              Today
            </button>
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
          </div>
        </div>

        {/* Revenue Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-90">Total Revenue</span>
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-2xl">${stats.totalRevenue.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs opacity-90">↑ 12.5% vs last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Collection Rate</span>
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl text-gray-900">{stats.collectionRate}%</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-green-600">Above target (90%)</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Denial Rate</span>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl text-gray-900">{stats.denialRate}%</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-green-600">↓ 1.3% improvement</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Days to Pay</span>
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl text-gray-900">{stats.avgDaysToPayment}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-600">Industry avg: 24</span>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm text-purple-900">AI Revenue Insights</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {aiRecommendations.map((rec, index) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-purple-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-900 mb-1">{rec.message}</p>
                  </div>
                  {rec.type === 'collection' && <TrendingUp className="w-4 h-4 text-green-500" />}
                  {rec.type === 'denial' && <Zap className="w-4 h-4 text-orange-500" />}
                  {rec.type === 'revenue' && <DollarSign className="w-4 h-4 text-blue-500" />}
                </div>
                <button className="text-xs text-[#62d5e4] hover:text-[#4bc5d6] flex items-center gap-1">
                  {rec.action}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-4">
            {/* Urgent Claims */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm text-gray-900">Urgent Claims</h2>
                <span className="text-xs text-orange-600">{urgentClaims.length} need attention</span>
              </div>
              
              <div className="space-y-2">
                {urgentClaims.map((claim) => (
                  <div key={claim.id} className="flex items-center justify-between p-3 border-l-4 border-orange-500 bg-orange-50 rounded-r-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-gray-900">{claim.id}</span>
                        <span className="text-sm text-gray-700">{claim.patient}</span>
                        {claim.priority === 'critical' && (
                          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                            CRITICAL
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span>{claim.payer}</span>
                        <span>${claim.amount.toLocaleString()}</span>
                        <span className={claim.days > 10 ? 'text-red-600' : 'text-gray-600'}>
                          {claim.days} days old
                        </span>
                        <span className="capitalize">{claim.status.replace('-', ' ')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button className="text-xs bg-[#62d5e4] text-white px-3 py-1 rounded hover:bg-[#4bc5d6]">
                        Resolve
                      </button>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payer Performance */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h2 className="text-sm text-gray-900 mb-3">Payer Performance</h2>
              
              <div className="space-y-3">
                {payerPerformance.map((payer) => (
                  <div key={payer.payer} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm text-gray-900">{payer.payer}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          payer.rate >= 90 ? 'bg-green-100 text-green-700' :
                          payer.rate >= 80 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {payer.rate}% paid
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Submitted:</span>
                        <p className="text-gray-900">{payer.submitted}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Paid:</span>
                        <p className="text-green-600">{payer.paid}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Denied:</span>
                        <p className="text-red-600">{payer.denied}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Avg Days:</span>
                        <p className="text-gray-900">{payer.avgDays}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Claims Summary */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm text-gray-900 mb-3">Claims Summary</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">Submitted</span>
                  </div>
                  <span className="text-sm text-gray-900">{stats.claimsSubmitted}</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Paid</span>
                  </div>
                  <span className="text-sm text-gray-900">{stats.claimsPaid}</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-700">Pending</span>
                  </div>
                  <span className="text-sm text-gray-900">{stats.claimsPending}</span>
                </div>
              </div>
            </div>

            {/* Performance Badge */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-yellow-600" />
                <h3 className="text-sm text-yellow-900">This Month</h3>
              </div>
              <p className="text-2xl text-yellow-900 mb-1">Top Performer</p>
              <p className="text-xs text-yellow-800">
                Highest collection rate in the team
              </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm text-gray-900 mb-3">Quick Actions</h3>
              
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors">
                  <Send className="w-4 h-4" />
                  Submit Claims Batch
                </button>
                
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  Check Claim Status
                </button>
                
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <FileText className="w-4 h-4" />
                  Generate Report
                </button>
                
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Brain className="w-4 h-4" />
                  AI Collections Help
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
