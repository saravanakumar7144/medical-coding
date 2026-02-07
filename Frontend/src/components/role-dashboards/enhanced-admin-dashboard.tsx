import { useState, useEffect } from 'react';
import {
  Users,
  Settings,
  Shield,
  Activity,
  Database,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import {
  getUsers,
  getSystemMetrics,
  calculateUserStats,
  formatUptime,
  UserResponse,
  SystemMetricsResponse
} from '../../services/admin-services';

interface AdminDashboardProps {
  onNavigate?: (page: string, id?: string, section?: string) => void;
}

interface DashboardStats {
  activeUsers: number;
  totalUsers: number;
  newUsersThisMonth: number;
  systemUptime: string;
  uptimeSeconds: number;
}

export function EnhancedAdminDashboard({ onNavigate }: AdminDashboardProps) {
  // State for loading and data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    activeUsers: 0,
    totalUsers: 0,
    newUsersThisMonth: 0,
    systemUptime: '--',
    uptimeSeconds: 0
  });
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetricsResponse | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users and system metrics in parallel
      const [usersResponse, metricsResponse] = await Promise.all([
        getUsers(),
        getSystemMetrics()
      ]);

      // Store users for the table
      setUsers(usersResponse.users);
      setSystemMetrics(metricsResponse);

      // Calculate user statistics
      const userStats = calculateUserStats(usersResponse.users);

      // Update stats
      setStats({
        activeUsers: userStats.activeUsers,
        totalUsers: userStats.totalUsers,
        newUsersThisMonth: userStats.newUsersThisMonth,
        systemUptime: formatUptime(metricsResponse.uptime_seconds),
        uptimeSeconds: metricsResponse.uptime_seconds
      });

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Build stats cards with real data
  const statsCards = [
    {
      title: 'Active Users',
      value: loading ? '--' : stats.activeUsers.toString(),
      change: loading ? 'Loading...' : `+${stats.newUsersThisMonth} this month`,
      color: 'blue',
      icon: Users,
    },
    {
      title: 'System Uptime',
      value: loading ? '--' : stats.systemUptime,
      change: '30-day average',
      color: 'green',
      icon: Activity,
    },
    {
      title: 'Pending Approvals',
      value: '5',
      change: 'Requires action',
      color: 'orange',
      icon: Clock,
    },
    {
      title: 'Security Alerts',
      value: '2',
      change: 'Last 7 days',
      color: 'red',
      icon: Shield,
    },
  ];

  // Format last login time
  const formatLastLogin = (lastLoginAt: string | null): string => {
    if (!lastLoginAt) return 'Never';
    const lastLogin = new Date(lastLoginAt);
    const now = new Date();
    const diffMs = now.getTime() - lastLogin.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  // Get status based on user properties
  const getUserStatus = (user: UserResponse): string => {
    if (!user.is_active) return 'Inactive';
    if (!user.email_verified) return 'Pending';
    return 'Active';
  };

  // Build recent users from API data (show latest 4)
  const recentUsers = users.slice(0, 4).map(user => ({
    name: user.username,
    email: user.email,
    role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
    status: getUserStatus(user),
    lastLogin: formatLastLogin(user.last_login_at),
  }));

  // Build system metrics from API data
  const systemMetricsDisplay = systemMetrics ? [
    { label: 'CPU Usage', value: `${systemMetrics.cpu_usage.toFixed(1)}%`, status: systemMetrics.cpu_usage < 80 ? 'good' : 'warning' },
    { label: 'Memory Usage', value: `${systemMetrics.memory_usage.toFixed(1)}%`, status: systemMetrics.memory_usage < 80 ? 'normal' : 'warning' },
    { label: 'Disk Usage', value: `${systemMetrics.disk_usage.toFixed(1)}%`, status: systemMetrics.disk_usage < 80 ? 'normal' : 'warning' },
    { label: 'Active Connections', value: systemMetrics.active_connections.toString(), status: 'normal' },
  ] : [
    { label: 'CPU Usage', value: '--', status: 'normal' },
    { label: 'Memory Usage', value: '--', status: 'normal' },
    { label: 'Disk Usage', value: '--', status: 'normal' },
    { label: 'Active Connections', value: '--', status: 'normal' },
  ];

  const pendingActions = [
    {
      type: 'User Access Request',
      user: 'Rachel Green',
      description: 'Requesting Manager role access',
      priority: 'High',
      time: '1 hour ago',
    },
    {
      type: 'Fee Schedule Update',
      user: 'System',
      description: 'Medicare 2024 fee schedule pending approval',
      priority: 'Medium',
      time: '3 hours ago',
    },
    {
      type: 'Rule Configuration',
      user: 'Jennifer Williams',
      description: 'New scrubbing rule for CPT 99214',
      priority: 'Medium',
      time: '1 day ago',
    },
    {
      type: 'Report Access',
      user: 'David Thompson',
      description: 'Requesting executive dashboard access',
      priority: 'Low',
      time: '2 days ago',
    },
  ];

  const securityAlerts = [
    {
      type: 'Failed Login Attempts',
      count: 7,
      user: 'Unknown IP: 192.168.1.xxx',
      severity: 'Medium',
      time: '3 hours ago',
    },
    {
      type: 'Permission Change',
      count: 1,
      user: 'Admin: David Thompson',
      severity: 'Low',
      time: '1 day ago',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            Retry
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-gray-900 mb-1">System Administration</h1>
            <p className="text-gray-600">User management and system configuration</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchDashboardData}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Activity className="w-4 h-4" />
              )}
              Refresh
            </Button>
            <Button
              onClick={() => onNavigate?.('Admin & Settings')}
              className="bg-[#62d5e4] hover:bg-[#52c5d4] gap-2"
            >
              <Settings className="w-4 h-4" />
              System Settings
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
              </div>
              <div className="mb-1 text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600 mb-1">{stat.title}</div>
              <div className="text-xs text-gray-500">{stat.change}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Users */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-gray-900">User Management</h2>
              <Button
                onClick={() => onNavigate?.('Admin & Settings')}
                variant="outline"
                size="sm"
              >
                Manage Users
              </Button>
            </div>

            <div className="space-y-3">
              {recentUsers.map((user, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#62d5e4] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs ${user.status === 'Active'
                        ? 'bg-green-100 text-green-700'
                        : user.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {user.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{user.role}</span>
                    <span className="text-xs">Last login: {user.lastLogin}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pending Actions */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-gray-900">Pending Actions</h2>
              <span className="text-sm text-gray-600">{pendingActions.length} items</span>
            </div>

            <div className="space-y-3">
              {pendingActions.map((action, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#62d5e4] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-900">{action.type}</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${action.priority === 'High'
                            ? 'bg-red-100 text-red-700'
                            : action.priority === 'Medium'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                            }`}
                        >
                          {action.priority}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{action.description}</div>
                      <div className="text-xs text-gray-500">
                        {action.user} • {action.time}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      Deny
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* System Metrics */}
          <Card className="p-6">
            <h2 className="text-gray-900 mb-4">System Health</h2>
            <div className="space-y-3">
              {systemMetricsDisplay.map((metric, index) => (
                <div key={index} className="flex items-center justify-between pb-3 border-b border-gray-200 last:border-b-0 last:pb-0">
                  <span className="text-sm text-gray-600">{metric.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900">{metric.value}</span>
                    {metric.status === 'good' && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                    {metric.status === 'normal' && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => onNavigate?.('Admin & Settings')}
            >
              <Database className="w-4 h-4 mr-2" />
              View System Logs
            </Button>
          </Card>

          {/* Security Alerts */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-gray-900">Security Alerts</h2>
              {securityAlerts.length > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {securityAlerts.length}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {securityAlerts.map((alert, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${alert.severity === 'High' ? 'text-red-600' : 'text-orange-600'
                      }`} />
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 mb-1">{alert.type}</div>
                      <div className="text-xs text-gray-600 mb-1">{alert.user}</div>
                      <div className="text-xs text-gray-500">{alert.time}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full text-xs h-7">
                    Investigate
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => onNavigate?.('Admin & Settings')}
              >
                <Users className="w-4 h-4 mr-2" />
                Add New User
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => onNavigate?.('Rules & Scrubbing')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure Rules
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => onNavigate?.('Payers & Fee Schedules')}
              >
                <Database className="w-4 h-4 mr-2" />
                Update Fee Schedules
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => onNavigate?.('Reports & Analytics')}
              >
                <Activity className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
