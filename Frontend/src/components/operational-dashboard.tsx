import React, { useState, useMemo } from 'react';
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
  Filter,
  MoreHorizontal,
  Users,
  Eye,
  RefreshCw
} from 'lucide-react';

interface KPIData {
  id: string;
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  sparklineData: Array<{ value: number }>;
  color: string;
}

interface QueueData {
  id: string;
  title: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
  icon: any;
  color: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

interface Alert {
  id: string;
  type: 'update' | 'policy' | 'outage' | 'warning';
  title: string;
  message: string;
  time: string;
  severity: 'high' | 'medium' | 'low';
}

interface Activity {
  id: string;
  user: string;
  action: string;
  entity: string;
  time: string;
  type: 'coding' | 'billing' | 'payment' | 'denial' | 'appeal' | 'eligibility' | 'ai_suggestion' | 'era' | 'warning' | 'authorization';
}

// Move static data outside component to prevent recreation on every render
const staticKpiData: KPIData[] = [
    {
      id: 'charges',
      title: 'Charges Today',
      value: '$127,450',
      change: '+12.3%',
      trend: 'up',
      icon: DollarSign,
      color: '#62d5e4',
      sparklineData: [
        { value: 95000 }, { value: 102000 }, { value: 98000 }, 
        { value: 115000 }, { value: 120000 }, { value: 127450 }
      ]
    },
    {
      id: 'net_collection_rate',
      title: 'Net Collection Rate',
      value: '96.8%',
      change: '+2.1%',
      trend: 'up',
      icon: TrendingUp,
      color: '#10b981',
      sparklineData: [
        { value: 94.2 }, { value: 94.8 }, { value: 95.3 }, 
        { value: 95.9 }, { value: 96.4 }, { value: 96.8 }
      ]
    },
    {
      id: 'first_pass_rate',
      title: 'First Pass Rate',
      value: '91.8%',
      change: '+1.5%',
      trend: 'up',
      icon: CheckCircle,
      color: '#10b981',
      sparklineData: [
        { value: 89.2 }, { value: 89.8 }, { value: 90.5 }, 
        { value: 91.1 }, { value: 91.4 }, { value: 91.8 }
      ]
    },
    {
      id: 'claims',
      title: 'Claims Submitted',
      value: '156',
      change: '+8.1%',
      trend: 'up',
      icon: FileText,
      color: '#10b981',
      sparklineData: [
        { value: 120 }, { value: 135 }, { value: 142 }, 
        { value: 148 }, { value: 152 }, { value: 156 }
      ]
    },
    {
      id: 'clean_claim_rate',
      title: 'Clean Claim Rate',
      value: '94.3%',
      change: '+0.8%',
      trend: 'up',
      icon: Activity,
      color: '#10b981',
      sparklineData: [
        { value: 92.1 }, { value: 92.8 }, { value: 93.2 }, 
        { value: 93.7 }, { value: 94.0 }, { value: 94.3 }
      ]
    },
    {
      id: 'payments',
      title: 'Payments Posted',
      value: '$89,230',
      change: '+5.7%',
      trend: 'up',
      icon: DollarSign,
      color: '#10b981',
      sparklineData: [
        { value: 75000 }, { value: 80000 }, { value: 82000 }, 
        { value: 85000 }, { value: 87000 }, { value: 89230 }
      ]
    },
    {
      id: 'denial_rate',
      title: 'Denial Rate',
      value: '8.2%',
      change: '-1.1%',
      trend: 'down',
      icon: XCircle,
      color: '#ef4444',
      sparklineData: [
        { value: 10.1 }, { value: 9.8 }, { value: 9.2 }, 
        { value: 8.7 }, { value: 8.5 }, { value: 8.2 }
      ]
    },
    {
      id: 'appeal_success_rate',
      title: 'Appeal Success Rate',
      value: '78.4%',
      change: '+4.2%',
      trend: 'up',
      icon: TrendingUp,
      color: '#10b981',
      sparklineData: [
        { value: 72.3 }, { value: 74.1 }, { value: 75.8 }, 
        { value: 76.9 }, { value: 77.6 }, { value: 78.4 }
      ]
    },
    {
      id: 'ar_days',
      title: 'Avg A/R Days',
      value: '24.5',
      change: '-3.2',
      trend: 'down',
      icon: Clock,
      color: '#f59e0b',
      sparklineData: [
        { value: 28.1 }, { value: 27.3 }, { value: 26.2 }, 
        { value: 25.1 }, { value: 24.8 }, { value: 24.5 }
      ]
    },
    {
      id: 'aging_over_90',
      title: 'A/R > 90 Days',
      value: '15.2%',
      change: '-2.4%',
      trend: 'down',
      icon: Calendar,
      color: '#ef4444',
      sparklineData: [
        { value: 19.8 }, { value: 18.6 }, { value: 17.3 }, 
        { value: 16.4 }, { value: 15.8 }, { value: 15.2 }
      ]
    },
    {
      id: 'tfl_warnings',
      title: 'TFL Warnings',
      value: '12',
      change: '+3',
      trend: 'up',
      icon: AlertTriangle,
      color: '#ef4444',
      sparklineData: [
        { value: 8 }, { value: 9 }, { value: 10 }, 
        { value: 11 }, { value: 11 }, { value: 12 }
      ]
    },
    {
      id: 'eligibility_verification',
      title: 'Eligibility Check Rate',
      value: '99.1%',
      change: '+0.3%',
      trend: 'up',
      icon: Users,
      color: '#10b981',
      sparklineData: [
        { value: 98.2 }, { value: 98.4 }, { value: 98.7 }, 
        { value: 98.9 }, { value: 99.0 }, { value: 99.1 }
      ]
    }
];

// Move static queue data outside component
const staticQueueData: QueueData[] = [
    {
      id: 'unsigned_mr',
      title: 'Unsigned MR',
      count: 47,
      priority: 'high',
      icon: FileText,
      color: '#ef4444',
      change: '+12',
      trend: 'up'
    },
    {
      id: 'coding_pending',
      title: 'Coding Pending',
      count: 134,
      priority: 'medium',
      icon: Activity,
      color: '#f59e0b',
      change: '-8',
      trend: 'down'
    },
    {
      id: 'ready_to_bill',
      title: 'Ready to Bill',
      count: 89,
      priority: 'low',
      icon: DollarSign,
      color: '#10b981',
      change: '+5',
      trend: 'up'
    },
    {
      id: 'rejected_edits',
      title: 'Rejected Edits',
      count: 23,
      priority: 'high',
      icon: XCircle,
      color: '#ef4444',
      change: '-7',
      trend: 'down'
    },
    {
      id: 'held_auth',
      title: 'Held for Auth',
      count: 156,
      priority: 'medium',
      icon: Clock,
      color: '#f59e0b',
      change: '+3',
      trend: 'up'
    },
    {
      id: 'submitted_acks',
      title: 'Submitted/ACKs',
      count: 201,
      priority: 'low',
      icon: CheckCircle,
      color: '#10b981',
      change: '+15',
      trend: 'up'
    },
    {
      id: 'paid',
      title: 'Paid Claims',
      count: 178,
      priority: 'low',
      icon: DollarSign,
      color: '#10b981',
      change: '+22',
      trend: 'up'
    }
];

// Move static alerts data outside component
const staticAlerts: Alert[] = [
    {
      id: '1',
      type: 'outage',
      title: 'Clearinghouse Maintenance Scheduled',
      message: 'Change Healthcare scheduled maintenance window: March 16, 2-4 AM EST. Claims submission will be delayed.',
      time: '2 hours ago',
      severity: 'high'
    },
    {
      id: '2',
      type: 'policy',
      title: 'Medicare Policy Update - Cardiac Procedures',
      message: 'Effective April 1st: New prior authorization requirements for cardiac catheterization and interventional procedures.',
      time: '4 hours ago',
      severity: 'medium'
    },
    {
      id: '3',
      type: 'warning',
      title: 'Critical: High TFL Volume Detected',
      message: 'Timely filing limit approaching for 12 claims totaling $156,430. Immediate action required.',
      time: '6 hours ago',
      severity: 'high'
    },
    {
      id: '4',
      type: 'update',
      title: 'AI Coding Engine Update Deployed',
      message: 'Claims processing engine updated to v2.4.1 with enhanced ICD-10 code suggestions and validation.',
      time: '1 day ago',
      severity: 'low'
    },
    {
      id: '5',
      type: 'warning',
      title: 'Denial Rate Spike - UnitedHealth',
      message: 'Denial rate for UnitedHealth increased to 15.2% (vs 8.1% avg). Investigating modifier 25 rejections.',
      time: '1 day ago',
      severity: 'medium'
    },
    {
      id: '6',
      type: 'update',
      title: 'Fee Schedule Update Available',
      message: 'Medicare 2024 Q2 fee schedule update available for download. Contains 847 code changes.',
      time: '2 days ago',
      severity: 'medium'
    }
];

// Move static activity data outside component
const staticRecentActivity: Activity[] = [
    {
      id: '1',
      user: 'Sarah Johnson',
      action: 'Coded encounter with AI assistance',
      entity: 'Patient #P-2024-5647 - Cardiology',
      time: '2 minutes ago',
      type: 'coding'
    },
    {
      id: '2',
      user: 'Mike Chen',
      action: 'Auto-posted ERA payment',
      entity: 'Claim #CL-2024-1234 - $2,450.00',
      time: '8 minutes ago',
      type: 'payment'
    },
    {
      id: '3',
      user: 'Lisa Rodriguez',
      action: 'Resolved denial with appeal',
      entity: 'Claim #CL-2024-0987 - Prior Auth Issue',
      time: '12 minutes ago',
      type: 'denial'
    },
    {
      id: '4',
      user: 'Auto System',
      action: 'Batch submitted (45 claims)',
      entity: 'Batch #B-2024-0234 - UnitedHealth',
      time: '18 minutes ago',
      type: 'billing'
    },
    {
      id: '5',
      user: 'Jennifer Walsh',
      action: 'Appealed denial with documentation',
      entity: 'Claim #CL-2024-0098 - Medical Necessity',
      time: '25 minutes ago',
      type: 'appeal'
    },
    {
      id: '6',
      user: 'David Park',
      action: 'Verified eligibility',
      entity: 'Patient #P-2024-5823 - Anthem',
      time: '32 minutes ago',
      type: 'eligibility'
    },
    {
      id: '7',
      user: 'AI Assistant',
      action: 'Suggested code correction',
      entity: 'Encounter #E-2024-9876 - Orthopedics',
      time: '38 minutes ago',
      type: 'ai_suggestion'
    },
    {
      id: '8',
      user: 'Emily Davis',
      action: 'Processed ERA (15 claims)',
      entity: 'ERA #835-20240315-001 - $45,230',
      time: '42 minutes ago',
      type: 'era'
    },
    {
      id: '9',
      user: 'System Alert',
      action: 'TFL warning generated',
      entity: 'Claim #CL-2024-1567 - 95 days old',
      time: '1 hour ago',
      type: 'warning'
    },
    {
      id: '10',
      user: 'Robert Kim',
      action: 'Prior auth approved',
      entity: 'Auth #PA-2024-3456 - MRI Lumbar',
      time: '1 hour ago',
      type: 'authorization'
    }
];

const timeRanges = ['Today', '7 Days', '30 Days', 'Custom'];

export function OperationalDashboard() {
  const [timeRange, setTimeRange] = useState('Today');
  const [userRole, setUserRole] = useState('manager');
  const [selectedView, setSelectedView] = useState('default');

  // Memoize expensive calculations
  const kpisByRole = useMemo(() => {
    if (userRole === 'coder') {
      return staticKpiData.filter(kpi => ['charges', 'claims', 'denial_rate', 'first_pass_rate', 'clean_claim_rate'].includes(kpi.id));
    }
    if (userRole === 'biller') {
      return staticKpiData.filter(kpi => ['payments', 'ar_days', 'tfl_warnings', 'net_collection_rate', 'aging_over_90'].includes(kpi.id));
    }
    return staticKpiData.slice(0, 6); // Limit to 6 KPIs for performance
  }, [userRole]);

  const queuesByRole = useMemo(() => {
    if (userRole === 'coder') {
      return staticQueueData.filter(queue => 
        ['unsigned_mr', 'coding_pending', 'rejected_edits'].includes(queue.id)
      );
    }
    if (userRole === 'biller') {
      return staticQueueData.filter(queue => 
        ['ready_to_bill', 'held_auth', 'submitted_acks', 'paid'].includes(queue.id)
      );
    }
    return staticQueueData;
  }, [userRole]);

  const handleKPIClick = (kpiId: string) => {
    console.log('KPI clicked:', kpiId);
  };

  const handleQueueClick = (queueId: string) => {
    console.log('Queue clicked:', queueId);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'outage':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'policy':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'update':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col max-w-full">
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
            {/* Time Range Picker */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
              >
                {timeRanges.map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>

            {/* Dashboard View Selector */}
            <select
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
            >
              <option value="default">Default View</option>
              <option value="executive">Executive View</option>
              <option value="operational">Operational View</option>
            </select>

            {/* Action Buttons */}
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-auto max-w-full">
        <div className="p-6 space-y-6">
          {/* KPI Strip */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Key Performance Indicators</h2>
              <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
              {kpisByRole.map((kpi) => (
                <div
                  key={kpi.id}
                  onClick={() => handleKPIClick(kpi.id)}
                  className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg bg-opacity-10`} style={{ backgroundColor: kpi.color + '20' }}>
                        <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                      </div>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-xs font-medium text-gray-600 block">{kpi.title}</span>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-semibold text-gray-900 mb-1">{kpi.value}</div>
                      <div className={`flex items-center gap-1 text-xs ${
                        kpi.trend === 'up' ? 'text-green-600' : 
                        kpi.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {kpi.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : 
                         kpi.trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                        {kpi.change}
                      </div>
                    </div>
                    
                    {/* Simplified Sparkline */}
                    <div className="h-8 w-16">
                      <div className="w-full h-full flex items-end gap-1">
                        {kpi.sparklineData.slice(-5).map((point, index) => (
                          <div
                            key={index}
                            className="flex-1 rounded-sm"
                            style={{
                              backgroundColor: kpi.color,
                              height: `${Math.max(20, (point.value / Math.max(...kpi.sparklineData.map(d => d.value))) * 100)}%`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Work Queues */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Work Queues</h2>
              <Filter className="w-5 h-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {queuesByRole.map((queue) => (
                <div
                  key={queue.id}
                  onClick={() => handleQueueClick(queue.id)}
                  className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg bg-opacity-10`} style={{ backgroundColor: queue.color + '20' }}>
                        <queue.icon className="w-4 h-4" style={{ color: queue.color }} />
                      </div>
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
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-semibold text-gray-900 mb-1">{queue.count}</div>
                      <div className={`flex items-center gap-1 text-xs ${
                        queue.trend === 'up' ? 'text-red-600' : 
                        queue.trend === 'down' ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {queue.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : 
                         queue.trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                        {queue.change}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Section: Alerts and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Alerts */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
                  <Bell className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {staticAlerts.slice(0, 4).map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0 mt-1">
                        {getAlertIcon(alert.type)}
                      </div>
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
                  <div className="text-center pt-3 border-t border-gray-200">
                    <button className="text-sm text-[#62d5e4] hover:text-[#4bc5d6] font-medium">
                      View All Alerts
                    </button>
                  </div>
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
              
              <div className="p-6">
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {staticRecentActivity.slice(0, 6).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                        activity.type === 'coding' ? 'bg-[#62d5e4]' :
                        activity.type === 'billing' ? 'bg-green-500' :
                        activity.type === 'payment' ? 'bg-blue-500' :
                        activity.type === 'denial' ? 'bg-red-500' :
                        activity.type === 'appeal' ? 'bg-orange-500' :
                        activity.type === 'eligibility' ? 'bg-purple-500' :
                        activity.type === 'ai_suggestion' ? 'bg-cyan-500' :
                        activity.type === 'era' ? 'bg-indigo-500' :
                        activity.type === 'warning' ? 'bg-yellow-500' :
                        activity.type === 'authorization' ? 'bg-pink-500' :
                        'bg-gray-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{activity.user}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            activity.type === 'coding' ? 'bg-[#62d5e4] bg-opacity-10 text-[#62d5e4]' :
                            activity.type === 'billing' ? 'bg-green-100 text-green-700' :
                            activity.type === 'payment' ? 'bg-blue-100 text-blue-700' :
                            activity.type === 'denial' ? 'bg-red-100 text-red-700' :
                            activity.type === 'appeal' ? 'bg-orange-100 text-orange-700' :
                            activity.type === 'eligibility' ? 'bg-purple-100 text-purple-700' :
                            activity.type === 'ai_suggestion' ? 'bg-cyan-100 text-cyan-700' :
                            activity.type === 'era' ? 'bg-indigo-100 text-indigo-700' :
                            activity.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                            activity.type === 'authorization' ? 'bg-pink-100 text-pink-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {activity.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{activity.action}</p>
                        <p className="text-sm text-gray-500">{activity.entity}</p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0 mt-1">
                        {activity.time}
                      </span>
                    </div>
                  ))}
                  <div className="text-center pt-3 border-t border-gray-200">
                    <button className="text-sm text-[#62d5e4] hover:text-[#4bc5d6] font-medium">
                      View All Activity
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}