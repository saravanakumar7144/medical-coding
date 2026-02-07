import { AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Alerts() {
  const complianceIssues = [
    { issue: 'Missing Modifiers', count: 12, category: 'Documentation' },
    { issue: 'Upcoding Risk', count: 8, category: 'Revenue' },
    { issue: 'Documentation Gap', count: 15, category: 'Clinical' },
    { issue: 'Billing Delays', count: 6, category: 'Process' },
    { issue: 'Audit Flags', count: 4, category: 'Compliance' }
  ];

  const ComplianceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-[#62d5e4]">Count: {payload[0].value}</p>
          <p className="text-xs text-gray-600">Category: {payload[0].payload.category}</p>
        </div>
      );
    }
    return null;
  };

  const alerts = [
    {
      id: 1,
      type: 'error',
      title: 'Missing Modifier',
      message: 'Patient P-1001 (John Smith) has a bilateral procedure code without modifier 50',
      time: '10 minutes ago',
      severity: 'Error: 2'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Documentation Gap',
      message: 'Patient P-1003 (Michael Brown) has COPD diagnosis but missing spirometry results',
      time: '25 minutes ago',
      severity: 'Warning: 3'
    },
    {
      id: 3,
      type: 'info',
      title: 'Payer Update',
      message: 'Medicare has updated coding requirements for telehealth services effective June 1',
      time: '1 hour ago',
      severity: 'Info: 1'
    },
    {
      id: 4,
      type: 'warning',
      title: 'Potential Undercoding',
      message: 'Patient P-1005 (Robert Miller) has documented comorbidities that aren\'t reflected in coding',
      time: '2 hours ago',
      severity: ''
    },
    {
      id: 5,
      type: 'error',
      title: 'Compliance Risk',
      message: 'Multiple high level E/M codes used for same patient within 7 day period',
      time: '3 hours ago',
      severity: ''
    }
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertBorder = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-l-red-500 bg-red-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    if (severity.includes('Error')) return 'text-red-600 bg-red-100';
    if (severity.includes('Warning')) return 'text-yellow-600 bg-yellow-100';
    if (severity.includes('Info')) return 'text-blue-600 bg-blue-100';
    return '';
  };

  return (
    <div className="space-y-6 max-h-96 overflow-y-auto">
      {/* Compliance Issues Chart */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Compliance Issues</h2>
          <p className="text-sm text-gray-600 mt-1">Top compliance issues by frequency</p>
        </div>
        <div className="p-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceIssues} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="issue" width={120} fontSize={12} />
                <Tooltip content={<ComplianceTooltip />} />
                <Bar dataKey="count" fill="#62d5e4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center h-7 px-3 text-xs font-medium text-red-600 bg-red-100 rounded-full">
                Error: 2
              </span>
              <span className="inline-flex items-center h-7 px-3 text-xs font-medium text-yellow-600 bg-yellow-100 rounded-full">
                Warning: 3
              </span>
              <span className="inline-flex items-center h-7 px-3 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                Info: 1
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4 max-h-60 overflow-y-auto">
            {alerts.slice(0, 6).map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 p-5 rounded-r-lg ${getAlertBorder(alert.type)}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900">{alert.title}</h3>
                      <span className="text-xs text-gray-500">{alert.time}</span>
                    </div>
                    <p className="text-sm text-gray-700">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}