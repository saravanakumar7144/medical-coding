import { useState } from 'react';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  Eye,
  FileText,
  Upload,
  Download,
  Users,
  Building,
  Link,
  Key,
  Activity,
  Bell
} from 'lucide-react';

interface PayerPortal {
  id: string;
  payer: string;
  portalName: string;
  status: 'connected' | 'degraded' | 'disconnected';
  lastSync: string;
  features: {
    eligibility: boolean;
    priorAuth: boolean;
    claimStatus: boolean;
    appeals: boolean;
    documents: boolean;
  };
  credentials: {
    type: 'oauth' | 'api_key' | 'username_password';
    expiresAt?: string;
  };
  metrics: {
    uptime: number;
    avgResponseTime: number;
    successRate: number;
  };
}

interface PortalActivity {
  id: string;
  timestamp: string;
  action: string;
  status: 'success' | 'failed' | 'pending';
  details: string;
  payer: string;
}

export function EnhancedPayersPortal() {
  const [selectedPortal, setSelectedPortal] = useState<string | null>(null);
  const [showConnectionWizard, setShowConnectionWizard] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

  const portals: PayerPortal[] = [
    {
      id: 'medicare',
      payer: 'Medicare Part B',
      portalName: 'Medicare Portal',
      status: 'connected',
      lastSync: '2024-01-15 14:30:00',
      features: {
        eligibility: true,
        priorAuth: true,
        claimStatus: true,
        appeals: true,
        documents: true
      },
      credentials: {
        type: 'oauth',
        expiresAt: '2024-06-15'
      },
      metrics: {
        uptime: 99.5,
        avgResponseTime: 2.3,
        successRate: 98.7
      }
    },
    {
      id: 'aetna',
      payer: 'Aetna',
      portalName: 'Aetna Provider Portal',
      status: 'connected',
      lastSync: '2024-01-15 14:25:00',
      features: {
        eligibility: true,
        priorAuth: true,
        claimStatus: true,
        appeals: false,
        documents: true
      },
      credentials: {
        type: 'api_key',
        expiresAt: '2024-12-01'
      },
      metrics: {
        uptime: 97.2,
        avgResponseTime: 1.8,
        successRate: 96.4
      }
    },
    {
      id: 'bcbs',
      payer: 'Blue Cross Blue Shield',
      portalName: 'BCBS Provider Gateway',
      status: 'degraded',
      lastSync: '2024-01-15 13:45:00',
      features: {
        eligibility: true,
        priorAuth: false,
        claimStatus: true,
        appeals: true,
        documents: false
      },
      credentials: {
        type: 'username_password'
      },
      metrics: {
        uptime: 89.1,
        avgResponseTime: 4.2,
        successRate: 92.3
      }
    },
    {
      id: 'cigna',
      payer: 'Cigna',
      portalName: 'Cigna for Providers',
      status: 'disconnected',
      lastSync: '2024-01-14 16:20:00',
      features: {
        eligibility: false,
        priorAuth: false,
        claimStatus: false,
        appeals: false,
        documents: false
      },
      credentials: {
        type: 'oauth'
      },
      metrics: {
        uptime: 0,
        avgResponseTime: 0,
        successRate: 0
      }
    }
  ];

  const recentActivity: PortalActivity[] = [
    {
      id: '1',
      timestamp: '2024-01-15 14:30:00',
      action: 'Eligibility Check',
      status: 'success',
      details: 'Patient eligibility verified for John Smith',
      payer: 'Medicare Part B'
    },
    {
      id: '2',
      timestamp: '2024-01-15 14:28:00',
      action: 'Prior Auth Submission',
      status: 'pending',
      details: 'PA request submitted for procedure 93306',
      payer: 'Aetna'
    },
    {
      id: '3',
      timestamp: '2024-01-15 14:25:00',
      action: 'Claim Status Check',
      status: 'success',
      details: 'Claim CLM240001 status updated to Paid',
      payer: 'Medicare Part B'
    },
    {
      id: '4',
      timestamp: '2024-01-15 14:20:00',
      action: 'Appeal Submission',
      status: 'failed',
      details: 'Authentication failed - credential refresh needed',
      payer: 'Blue Cross Blue Shield'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'disconnected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const connectPortal = (portalId: string) => {
    console.log(`Connecting to portal: ${portalId}`);
    setShowConnectionWizard(true);
  };

  const testConnection = (portalId: string) => {
    console.log(`Testing connection for portal: ${portalId}`);
  };

  const syncPortalData = (portalId: string) => {
    console.log(`Syncing data for portal: ${portalId}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Payer Portal Integrations</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage real-time connections to payer portals for eligibility, prior auth, and claim status
        </p>
      </div>

      <div className="flex gap-6">
        {/* Left Panel - Portal List */}
        <div className="w-1/3">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Connected Portals</h2>
              <button 
                onClick={() => setShowConnectionWizard(true)}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-[#62d5e4] text-white rounded-lg hover:bg-[#4bc5d6] transition-colors"
              >
                <Link className="w-4 h-4" />
                Connect New
              </button>
            </div>

            <div className="space-y-3">
              {portals.map((portal) => (
                <div 
                  key={portal.id}
                  onClick={() => setSelectedPortal(portal.id)}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedPortal === portal.id ? 'border-[#62d5e4] bg-cyan-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{portal.payer}</span>
                    </div>
                    {getStatusIcon(portal.status)}
                  </div>
                  
                  <div className="text-xs text-gray-600 mb-2">{portal.portalName}</div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(portal.status)}`}>
                      {portal.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      Uptime: {portal.metrics.uptime}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Portal Details */}
        <div className="flex-1">
          {selectedPortal ? (
            <div className="space-y-6">
              {(() => {
                const portal = portals.find(p => p.id === selectedPortal);
                if (!portal) return null;

                return (
                  <>
                    {/* Portal Header */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">{portal.payer}</h2>
                          <p className="text-sm text-gray-600">{portal.portalName}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => testConnection(portal.id)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Activity className="w-4 h-4" />
                            Test Connection
                          </button>
                          <button 
                            onClick={() => syncPortalData(portal.id)}
                            className="flex items-center gap-2 px-3 py-2 text-sm bg-[#62d5e4] text-white rounded-lg hover:bg-[#4bc5d6] transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Sync Now
                          </button>
                        </div>
                      </div>

                      {/* Status Overview */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-1">
                            {portal.status === 'connected' ? 
                              <Wifi className="w-4 h-4 text-green-500" /> : 
                              <WifiOff className="w-4 h-4 text-red-500" />
                            }
                            <span className="text-sm font-medium text-gray-900">Connection</span>
                          </div>
                          <p className={`text-lg font-semibold ${
                            portal.status === 'connected' ? 'text-green-600' : 
                            portal.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {portal.status}
                          </p>
                          <p className="text-xs text-gray-500">Last sync: {portal.lastSync}</p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-gray-900">Response Time</span>
                          </div>
                          <p className="text-lg font-semibold text-blue-600">{portal.metrics.avgResponseTime}s</p>
                          <p className="text-xs text-gray-500">Average response</p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-gray-900">Success Rate</span>
                          </div>
                          <p className="text-lg font-semibold text-green-600">{portal.metrics.successRate}%</p>
                          <p className="text-xs text-gray-500">Last 30 days</p>
                        </div>
                      </div>
                    </div>

                    {/* Features & Capabilities */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Available Features</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(portal.features).map(([feature, enabled]) => (
                          <div key={feature} className={`flex items-center gap-3 p-3 rounded-lg border ${
                            enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                          }`}>
                            {enabled ? 
                              <CheckCircle className="w-5 h-5 text-green-500" /> : 
                              <XCircle className="w-5 h-5 text-gray-400" />
                            }
                            <div>
                              <p className={`font-medium ${enabled ? 'text-green-900' : 'text-gray-600'}`}>
                                {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </p>
                              <p className={`text-xs ${enabled ? 'text-green-700' : 'text-gray-500'}`}>
                                {enabled ? 'Available' : 'Not supported'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Security & Credentials */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Security & Authentication</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Credential Type</h4>
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <Key className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-900">
                              {portal.credentials.type.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        {portal.credentials.expiresAt && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Expires</h4>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                              <Clock className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-900">{portal.credentials.expiresAt}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex gap-3">
                        <button className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                          Update Credentials
                        </button>
                        <button className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          View Permissions
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Portal</h3>
              <p className="text-sm text-gray-600">
                Choose a payer portal from the list to view details and manage the connection.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Panel */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Portal Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Timestamp</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Payer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentActivity.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {activity.timestamp}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {activity.action}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {activity.payer}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      activity.status === 'success' ? 'bg-green-100 text-green-800' :
                      activity.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {activity.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {activity.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Connection Wizard Modal */}
      {showConnectionWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Connect New Portal</h2>
                <button
                  onClick={() => setShowConnectionWizard(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Select Payer</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4]">
                    <option>Select a payer...</option>
                    <option>UnitedHealthcare</option>
                    <option>Humana</option>
                    <option>Anthem</option>
                    <option>Centene</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Portal URL</label>
                  <input 
                    type="url" 
                    placeholder="https://portal.payer.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Authentication Method</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="auth" value="oauth" className="text-[#62d5e4] focus:ring-[#62d5e4]" />
                      <span className="text-sm">OAuth 2.0</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="auth" value="api_key" className="text-[#62d5e4] focus:ring-[#62d5e4]" />
                      <span className="text-sm">API Key</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="auth" value="credentials" className="text-[#62d5e4] focus:ring-[#62d5e4]" />
                      <span className="text-sm">Username/Password</span>
                    </label>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Security Notice</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        All credentials are encrypted and stored securely. Portal connections use industry-standard security protocols.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button className="flex-1 px-4 py-2 bg-[#62d5e4] text-white rounded-lg hover:bg-[#4bc5d6] transition-colors">
                    Connect Portal
                  </button>
                  <button 
                    onClick={() => setShowConnectionWizard(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}