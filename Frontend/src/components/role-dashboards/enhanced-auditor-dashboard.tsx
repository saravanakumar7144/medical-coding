import { 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  AlertTriangle,
  Shield,
  CheckCircle2,
  Clock,
  Target
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface AuditorDashboardProps {
  onNavigate?: (page: string, id?: string, section?: string) => void;
}

export function EnhancedAuditorDashboard({ onNavigate }: AuditorDashboardProps) {
  const statsCards = [
    {
      title: 'Charts in Audit Queue',
      value: '47',
      change: '+5',
      trend: 'up' as const,
      color: 'orange',
      icon: FileText,
    },
    {
      title: 'Coding Accuracy Rate',
      value: '96.8%',
      change: '+1.2%',
      trend: 'up' as const,
      color: 'green',
      icon: Target,
    },
    {
      title: 'Compliance Issues',
      value: '8',
      change: '-3',
      trend: 'down' as const,
      color: 'red',
      icon: AlertTriangle,
    },
    {
      title: 'Audits Completed (MTD)',
      value: '142',
      change: '+23',
      trend: 'up' as const,
      color: 'blue',
      icon: CheckCircle2,
    },
  ];

  const auditQueue = [
    {
      id: 'CHT-2024-1892',
      patient: 'Robert Williams',
      coder: 'Sarah Johnson',
      dos: '11/08/24',
      codes: 'E11.9, I10, 99214',
      priority: 'High',
      reason: 'Random Quality Review',
      age: '2 hours ago',
    },
    {
      id: 'CHT-2024-1889',
      patient: 'Jennifer Martinez',
      coder: 'Michael Chen',
      dos: '11/07/24',
      codes: 'J44.1, Z87.891, 99215',
      priority: 'Medium',
      reason: 'HCC Validation',
      age: '5 hours ago',
    },
    {
      id: 'CHT-2024-1885',
      patient: 'David Thompson',
      coder: 'Sarah Johnson',
      dos: '11/06/24',
      codes: 'M54.5, M25.511, 97161',
      priority: 'Medium',
      reason: 'New Provider Review',
      age: '1 day ago',
    },
    {
      id: 'CHT-2024-1878',
      patient: 'Lisa Anderson',
      coder: 'Emily Davis',
      dos: '11/05/24',
      codes: 'F41.1, F33.1, 99213',
      priority: 'Low',
      reason: 'Random Quality Review',
      age: '2 days ago',
    },
  ];

  const complianceIssues = [
    {
      type: 'Missing Documentation',
      count: 3,
      coder: 'Multiple',
      severity: 'High',
    },
    {
      type: 'Upcoding Risk',
      count: 2,
      coder: 'Alex Rivera',
      severity: 'Critical',
    },
    {
      type: 'Modifier Misuse',
      count: 2,
      coder: 'Michael Chen',
      severity: 'Medium',
    },
    {
      type: 'Unbundling Error',
      count: 1,
      coder: 'Sarah Johnson',
      severity: 'Medium',
    },
  ];

  const coderPerformance = [
    {
      coder: 'Sarah Johnson',
      audited: 34,
      accuracy: '98.2%',
      issues: 1,
      trend: 'stable',
    },
    {
      coder: 'Michael Chen',
      audited: 29,
      accuracy: '96.5%',
      issues: 2,
      trend: 'improving',
    },
    {
      coder: 'Emily Davis',
      audited: 31,
      accuracy: '97.8%',
      issues: 1,
      trend: 'stable',
    },
    {
      coder: 'Alex Rivera',
      audited: 25,
      accuracy: '94.1%',
      issues: 3,
      trend: 'declining',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-gray-900 mb-1">Auditor Dashboard</h1>
            <p className="text-gray-600">Quality assurance and compliance oversight</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => onNavigate?.('Chart Coding')}
              variant="outline"
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Review Charts
            </Button>
            <Button
              onClick={() => onNavigate?.('Reports & Analytics')}
              className="bg-[#62d5e4] hover:bg-[#52c5d4] gap-2"
            >
              <Shield className="w-4 h-4" />
              Generate Audit Report
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{stat.change}</span>
                </div>
              </div>
              <div className="mb-1 text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.title}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit Queue */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-gray-900">Audit Queue</h2>
              <Button
                onClick={() => onNavigate?.('Chart Coding')}
                variant="outline"
                size="sm"
              >
                View All
              </Button>
            </div>

            <div className="space-y-3">
              {auditQueue.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#62d5e4] transition-colors cursor-pointer"
                  onClick={() => onNavigate?.('Chart Coding', item.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-900">{item.patient}</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                            item.priority === 'High'
                              ? 'bg-red-100 text-red-700'
                              : item.priority === 'Medium'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Chart #{item.id} • DOS: {item.dos}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {item.age}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Coder:</span>{' '}
                      <span className="text-gray-900">{item.coder}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Reason:</span>{' '}
                      <span className="text-gray-900">{item.reason}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Codes:</span>{' '}
                      <span className="text-gray-900 font-mono text-xs">{item.codes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Compliance Issues */}
          <Card className="p-6">
            <h2 className="text-gray-900 mb-4">Active Compliance Issues</h2>
            <div className="space-y-3">
              {complianceIssues.map((issue, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm text-gray-900">{issue.type}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                        issue.severity === 'Critical'
                          ? 'bg-red-100 text-red-700'
                          : issue.severity === 'High'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {issue.count} {issue.count === 1 ? 'case' : 'cases'} • {issue.coder}
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => onNavigate?.('Reports & Analytics')}
            >
              View Full Report
            </Button>
          </Card>

          {/* Coder Performance */}
          <Card className="p-6">
            <h2 className="text-gray-900 mb-4">Coder Performance Summary</h2>
            <div className="space-y-3">
              {coderPerformance.map((coder, index) => (
                <div key={index} className="pb-3 border-b border-gray-200 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-900">{coder.coder}</span>
                    <span className="text-sm text-gray-900">{coder.accuracy}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{coder.audited} audited</span>
                    <span className={`
                      ${coder.trend === 'improving' ? 'text-green-600' : ''}
                      ${coder.trend === 'declining' ? 'text-red-600' : ''}
                    `}>
                      {coder.issues} {coder.issues === 1 ? 'issue' : 'issues'} • {coder.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
