import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  FileText, 
  DollarSign, 
  Activity,
  Bell,
  Download,
  RefreshCw,
  Users,
  Eye
} from 'lucide-react';

export function OperationalDashboard() {
  const [timeRange, setTimeRange] = useState('Today');

  // Simplified KPI data for better performance
  const kpiData = [
    {
      id: 'charges',
      title: 'Charges Today',
      value: '$127,450',
      change: '+12.3%',
      trend: 'up',
      icon: DollarSign,
      color: '#62d5e4'
    },
    {
      id: 'claims',
      title: 'Claims Submitted',
      value: '156',
      change: '+8.1%',
      trend: 'up',
      icon: FileText,
      color: '#10b981'
    },
    {
      id: 'payments',
      title: 'Payments Posted',
      value: '$89,230',
      change: '+5.7%',
      trend: 'up',
      icon: DollarSign,
      color: '#10b981'
    },
    {
      id: 'denial_rate',
      title: 'Denial Rate',
      value: '8.2%',
      change: '-1.1%',
      trend: 'down',
      icon: XCircle,
      color: '#ef4444'
    },
    {
      id: 'ar_days',
      title: 'Avg A/R Days',
      value: '24.5',
      change: '-3.2',
      trend: 'down',
      icon: Clock,
      color: '#f59e0b'
    },
    {
      id: 'collection_rate',
      title: 'Collection Rate',
      value: '96.8%',
      change: '+2.1%',
      trend: 'up',
      icon: TrendingUp,
      color: '#10b981'
    }
  ];

  // Simplified queue data
  const queueData = [
    { title: 'Unsigned MR', count: 47, priority: 'high', color: '#ef4444' },
    { title: 'Coding Pending', count: 134, priority: 'medium', color: '#f59e0b' },
    { title: 'Ready to Bill', count: 89, priority: 'low', color: '#10b981' },
    { title: 'Rejected Edits', count: 23, priority: 'high', color: '#ef4444' }
  ];

  // Simplified alerts
  const alerts = [
    {
      title: 'Clearinghouse Maintenance',
      message: 'Change Healthcare maintenance 2-4 AM EST',
      time: '2 hours ago',
      severity: 'high'
    },
    {
      title: 'Policy Update',
      message: 'New prior auth requirements for cardiac procedures',
      time: '4 hours ago',
      severity: 'medium'
    },
    {
      title: 'TFL Warning',
      message: '12 claims approaching filing limit',
      time: '6 hours ago',
      severity: 'high'
    },
    {
      title: 'System Update',
      message: 'AI engine updated to v2.4.1',
      time: '1 day ago',
      severity: 'low'
    }
  ];

  // Simplified activity
  const recentActivity = [
    { user: 'Sarah Johnson', action: 'Coded encounter', entity: 'Patient #P-2024-5647', time: '2 min ago' },
    { user: 'Mike Chen', action: 'Posted payment', entity: 'Claim #CL-2024-1234', time: '8 min ago' },
    { user: 'Lisa Rodriguez', action: 'Resolved denial', entity: 'Claim #CL-2024-0987', time: '12 min ago' },
    { user: 'Auto System', action: 'Submitted batch', entity: 'Batch #B-2024-0234', time: '18 min ago' },
    { user: 'Jennifer Walsh', action: 'Appealed denial', entity: 'Claim #CL-2024-0098', time: '25 min ago' }
  ];

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Operational Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Real-time operational pulse and workflow management
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] bg-white"
              >
                <option value="Today">Today</option>
                <option value="7 Days">7 Days</option>
                <option value="30 Days">30 Days</option>
              </select>
            </div>

            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Export
            </button>
            
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6]">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* KPI Cards */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Key Performance Indicators</h2>
              <span className="text-sm text-gray-500">Updated: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {kpiData.map((kpi) => (
                <div key={kpi.id} className="bg-gray-50 rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: kpi.color + '20' }}>
                      <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-xs font-medium text-gray-600 block">{kpi.title}</span>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-semibold text-gray-900 mb-1">{kpi.value}</div>
                      <div className={`flex items-center gap-1 text-xs ${
                        kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {kpi.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {kpi.change}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Work Queues */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Work Queues</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {queueData.map((queue, index) => (
                <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: queue.color + '20' }}>
                      <FileText className="w-4 h-4" style={{ color: queue.color }} />
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      queue.priority === 'high' ? 'bg-red-100 text-red-700' :
                      queue.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {queue.priority}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-xs font-medium text-gray-600 block">{queue.title}</span>
                  </div>
                  
                  <div className="text-2xl font-semibold text-gray-900">{queue.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* System Alerts */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
                  <Bell className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              <div className="p-4">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {alerts.slice(0, 3).map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <AlertTriangle className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900">{alert.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            alert.severity === 'high' ? 'bg-red-100 text-red-700' :
                            alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{alert.message}</p>
                        <span className="text-xs text-gray-500">{alert.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                  <Eye className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              <div className="p-4">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recentActivity.slice(0, 4).map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className="w-3 h-3 rounded-full bg-[#62d5e4] flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{activity.user}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{activity.action}</p>
                        <p className="text-sm text-gray-500">{activity.entity}</p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0 mt-1">
                        {activity.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}