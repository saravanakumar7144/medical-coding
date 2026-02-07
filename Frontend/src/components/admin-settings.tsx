import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, MoreHorizontal, Edit, Trash2, Settings, Shield, BarChart3, CreditCard, Bell, Clock, FileText, Download, Upload, Activity, Users, Target } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastActive: string;
}

interface RolePermission {
  role: string;
  userManagement: boolean;
  systemSettings: boolean;
  analytics: boolean;
  coding: boolean;
}

export function AdminSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('User Management');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    'User Management', 
    'AI Settings', 
    'System Settings', 
    'Audit Workflows',
    'Billing & Plans', 
    'Backup & Sync',
    'Security',
    'Notifications',
    'Audit & Reports'
  ];

  const users: User[] = [
    {
      id: '1',
      name: 'Dr. Johnson',
      email: 'johnson@hospital.com',
      role: 'Admin',
      status: 'Active',
      lastActive: 'Today 3:45 PM'
    },
    {
      id: '2',
      name: 'Dr. Martinez',
      email: 'martinez@hospital.com',
      role: 'Coder',
      status: 'Active',
      lastActive: 'Today 11:30 AM'
    },
    {
      id: '3',
      name: 'Dr. Wilson',
      email: 'wilson@hospital.com',
      role: 'Coder',
      status: 'Active',
      lastActive: 'Yesterday 4:25 PM'
    },
    {
      id: '4',
      name: 'Sarah Thompson',
      email: 'thompson@hospital.com',
      role: 'Supervisor',
      status: 'Active',
      lastActive: 'Today 9:15 AM'
    },
    {
      id: '5',
      name: 'Michael Garcia',
      email: 'garcia@hospital.com',
      role: 'Admin',
      status: 'Inactive',
      lastActive: 'Today 1:50 AM'
    }
  ];

  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([
    {
      role: 'Admin',
      userManagement: true,
      systemSettings: true,
      analytics: true,
      coding: true
    },
    {
      role: 'Supervisor',
      userManagement: true,
      systemSettings: true,
      analytics: true,
      coding: true
    },
    {
      role: 'Coder',
      userManagement: false,
      systemSettings: false,
      analytics: false,
      coding: true
    }
  ]);

  const togglePermission = (role: string, permission: keyof Omit<RolePermission, 'role'>) => {
    setRolePermissions(prevPermissions =>
      prevPermissions.map(rolePermission =>
        rolePermission.role === role
          ? { ...rolePermission, [permission]: !rolePermission[permission] }
          : rolePermission
      )
    );
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-800';
      case 'Supervisor':
        return 'bg-blue-100 text-blue-800';
      case 'Coder':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-cyan-100 text-cyan-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Admin & Settings</h1>
            <button
              onClick={() => navigate('/admin/create-user')}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6 sticky top-[80px] z-10">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-[#62d5e4] text-[#62d5e4]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 px-4 py-4 max-h-96 overflow-auto">
          {activeTab === 'User Management' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                  <option>All Roles</option>
                  <option>Admin</option>
                  <option>Supervisor</option>
                  <option>Coder</option>
                </select>
                <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>

              {/* User Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Role</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Last Active</th>
                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{user.lastActive}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button className="p-1 text-gray-400 hover:text-[#62d5e4] transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Role Permissions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Role Permissions</h3>
                <p className="text-sm text-gray-600 mb-6">Configure access levels for different user roles</p>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left text-sm font-medium text-gray-900 pb-3">Role</th>
                        <th className="text-center text-sm font-medium text-gray-900 pb-3">
                          <div className="flex items-center justify-center gap-2">
                            <Shield className="w-4 h-4" />
                            User Management
                          </div>
                        </th>
                        <th className="text-center text-sm font-medium text-gray-900 pb-3">
                          <div className="flex items-center justify-center gap-2">
                            <Settings className="w-4 h-4" />
                            System Settings
                          </div>
                        </th>
                        <th className="text-center text-sm font-medium text-gray-900 pb-3">
                          <div className="flex items-center justify-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Analytics
                          </div>
                        </th>
                        <th className="text-center text-sm font-medium text-gray-900 pb-3">
                          <div className="flex items-center justify-center gap-2">
                            <Edit className="w-4 h-4" />
                            Coding
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rolePermissions.map((rolePermission) => (
                        <tr key={rolePermission.role} className="hover:bg-gray-50">
                          <td className="py-4 text-sm font-medium text-gray-900">{rolePermission.role}</td>
                          <td className="py-4 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rolePermission.userManagement}
                                onChange={() => togglePermission(rolePermission.role, 'userManagement')}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                            </label>
                          </td>
                          <td className="py-4 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rolePermission.systemSettings}
                                onChange={() => togglePermission(rolePermission.role, 'systemSettings')}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                            </label>
                          </td>
                          <td className="py-4 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rolePermission.analytics}
                                onChange={() => togglePermission(rolePermission.role, 'analytics')}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                            </label>
                          </td>
                          <td className="py-4 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rolePermission.coding}
                                onChange={() => togglePermission(rolePermission.role, 'coding')}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'AI Settings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">AI Configuration</h3>
                <p className="text-sm text-gray-600 mb-6">Configure AI model settings and behavior</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">AI Model</label>
                    <select 
                      defaultValue="Ollama - Mistral"
                      className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option>Ollama - Mistral</option>
                      <option>GPT-4</option>
                      <option>Claude-3</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Minimum Confidence Threshold
                      <span className="ml-2 text-teal-600 font-semibold">75%</span>
                    </label>
                    <div className="relative">
                      <input
                        type="range"
                        min="50"
                        max="95"
                        defaultValue="75"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #1DD1A1 0%, #1DD1A1 ${(75-50)/(95-50)*100}%, #e5e7eb ${(75-50)/(95-50)*100}%, #e5e7eb 100%)`
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">AI will only suggest codes with confidence above this threshold</p>
                  </div>

                  <div className="mt-8">
                    <h4 className="font-medium text-gray-900 mb-4">AI Features</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Code Suggestions</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Error Detection</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Compliance Monitoring</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Natural Language Search</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Analytics & Insights</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Continuous Learning</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Model Training</h4>
                    <p className="text-sm text-gray-600 mb-3">Last trained: May 10, 2023</p>
                    <p className="text-xs text-gray-500 mb-4">Retraining the model will use your local data to improve AI accuracy</p>
                    <button className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      Retrain Model
                    </button>
                  </div>

                  <div className="pt-4">
                    <button className="px-6 py-2 text-sm text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">AI Performance Monitoring</h3>
                <p className="text-sm text-gray-600 mb-4">Monitor AI model performance and accuracy</p>
                <div className="text-center py-8 text-gray-500">
                  <p>Performance metrics will be displayed here</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'System Settings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">System Settings</h3>
                <p className="text-sm text-gray-600 mb-6">Configure general system settings</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">System Name</label>
                    <input
                      type="text"
                      defaultValue="Medical Coder Pro"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Organization</label>
                    <input
                      type="text"
                      defaultValue="General Hospital"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Timezone</label>
                    <select 
                      defaultValue="Eastern Time (UTC-5)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option>Eastern Time (UTC-5)</option>
                      <option>Central Time (UTC-6)</option>
                      <option>Mountain Time (UTC-7)</option>
                      <option>Pacific Time (UTC-8)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Date Format</label>
                    <select 
                      defaultValue="MM/DD/YYYY"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">Appearance</label>
                    <div className="flex gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input type="radio" name="appearance" value="light" defaultChecked className="sr-only peer" />
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full peer-checked:border-teal-500 peer-checked:bg-teal-500 relative">
                          <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100"></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-900">Light</span>
                      </label>
                      
                      <label className="flex items-center cursor-pointer">
                        <input type="radio" name="appearance" value="dark" className="sr-only peer" />
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full peer-checked:border-teal-500 peer-checked:bg-teal-500 relative">
                          <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100"></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-900">Dark</span>
                      </label>
                      
                      <label className="flex items-center cursor-pointer">
                        <input type="radio" name="appearance" value="system" className="sr-only peer" />
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full peer-checked:border-teal-500 peer-checked:bg-teal-500 relative">
                          <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100"></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-900">System</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button className="px-6 py-2 text-sm text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors">
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Backup & Sync' && (
            <div className="space-y-6">
              {/* Backup & Restore Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Backup & Restore</h3>
                <p className="text-sm text-gray-600 mb-6">Configure backup settings and restore data</p>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Automatic Backups</p>
                      <p className="text-sm text-gray-600">Enable automatic backups</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Backup Frequency</label>
                    <select 
                      defaultValue="Daily"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Backup Location</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        defaultValue="C:\Backups\MedicalCoder"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <button className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Browse
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Backup History</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date & Time</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Size</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">2023-05-15 14:30:00</td>
                            <td className="px-4 py-3 text-sm text-gray-600">245 MB</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Success
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button className="text-teal-600 hover:text-teal-700 text-sm">Restore</button>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">2023-05-14 14:30:00</td>
                            <td className="px-4 py-3 text-sm text-gray-600">240 MB</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Success
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button className="text-teal-600 hover:text-teal-700 text-sm">Restore</button>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">2023-05-13 14:30:00</td>
                            <td className="px-4 py-3 text-sm text-gray-600">238 MB</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Success
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button className="text-teal-600 hover:text-teal-700 text-sm">Restore</button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="px-4 py-2 text-sm text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors">
                      Backup Now
                    </button>
                    <button className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      Restore
                    </button>
                    <button className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Synchronization Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Data Synchronization</h3>
                <p className="text-sm text-gray-600 mb-6">Configure synchronization of coding guidelines and updates</p>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Auto-Sync Guidelines</p>
                      <p className="text-sm text-gray-600">Enable automatic synchronization</p>
                      <p className="text-xs text-gray-500 mt-1">Automatically download and update coding guidelines and references</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Sync Frequency</label>
                    <select 
                      defaultValue="Weekly"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                    </select>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Data Sources</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2" />
                        <span className="ml-2 text-sm text-gray-900">ICD-10 Updates</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2" />
                        <span className="ml-2 text-sm text-gray-900">CPT Updates</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2" />
                        <span className="ml-2 text-sm text-gray-900">HCPCS Updates</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2" />
                        <span className="ml-2 text-sm text-gray-900">CMS Guidelines</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2" />
                        <span className="ml-2 text-sm text-gray-900">Payer Rules</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Synchronized</p>
                    <p className="text-sm text-gray-600">May 10, 2023 at 2:30 PM</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="space-y-6">
              {/* Security Settings */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Security Settings</h3>
                <p className="text-sm text-gray-600 mb-6">Configure security and privacy settings</p>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Authentication</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Enable Two-Factor Authentication</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Enable Single Sign-On (SSO)</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Password Policy</label>
                    <select 
                      defaultValue="Strong (8+ chars, mixed case, numbers, symbols)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option>Basic (6+ characters)</option>
                      <option>Medium (8+ chars, mixed case)</option>
                      <option>Strong (8+ chars, mixed case, numbers, symbols)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Session Timeout</label>
                    <select 
                      defaultValue="30 minutes"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option>15 minutes</option>
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>4 hours</option>
                    </select>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Data Privacy</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Enable Data Encryption</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Anonymize Patient Data in Reports</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Enable Audit Logging</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button className="px-6 py-2 text-sm text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors">
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>

              {/* Compliance Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Compliance</h3>
                <p className="text-sm text-gray-600 mb-6">Configure compliance settings and monitoring</p>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Compliance Frameworks</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2" />
                        <span className="ml-2 text-sm text-gray-900">HIPAA</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2" />
                        <span className="ml-2 text-sm text-gray-900">HITECH</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2" />
                        <span className="ml-2 text-sm text-gray-900">GDPR</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-600 font-semibold">✓</span>
                      </div>
                      <div>
                        <p className="font-medium text-green-900">Compliance Status: Compliant</p>
                        <p className="text-sm text-green-700">Last compliance check: May 12, 2023</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Security Scan</h4>
                    <p className="text-sm text-gray-600 mb-4">Run a security scan to check for vulnerabilities</p>
                    <button className="px-4 py-2 text-sm text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors">
                      Run Scan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billing & Plans Tab */}
          {activeTab === 'Billing & Plans' && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Current Plan</h3>
                <p className="text-sm text-gray-600 mb-6">Manage your subscription and billing information</p>
                
                <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-lg p-6 border border-cyan-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">Professional Plan</h4>
                      <p className="text-sm text-gray-600">Up to 50 users, unlimited coding sessions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">$299</p>
                      <p className="text-sm text-gray-600">/month</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Current Period</p>
                      <p className="font-medium text-gray-900">May 1 - May 31, 2023</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Next Billing Date</p>
                      <p className="font-medium text-gray-900">June 1, 2023</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button className="px-4 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors">
                      Upgrade Plan
                    </button>
                    <button className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      Change Plan
                    </button>
                  </div>
                </div>
              </div>

              {/* Usage Statistics */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Usage Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#62d5e4] rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Active Users</p>
                        <p className="text-xl font-semibold text-gray-900">23/50</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#62d5e4] rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Charts Coded</p>
                        <p className="text-xl font-semibold text-gray-900">1,247</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#62d5e4] rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">API Calls</p>
                        <p className="text-xl font-semibold text-gray-900">45,678</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                      <p className="text-sm text-gray-600">Expires 12/2025</p>
                    </div>
                  </div>
                  <button className="px-3 py-1 text-sm text-[#62d5e4] hover:text-[#4bc5d6] transition-colors">
                    Edit
                  </button>
                </div>
                <button className="mt-4 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Add Payment Method
                </button>
              </div>

              {/* Billing History */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Billing History</h3>
                  <button className="px-3 py-1 text-sm text-[#62d5e4] hover:text-[#4bc5d6] transition-colors">
                    Download All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">May 1, 2023</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Professional Plan - Monthly</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">$299.00</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                            Paid
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="text-[#62d5e4] hover:text-[#4bc5d6] transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">Apr 1, 2023</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Professional Plan - Monthly</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">$299.00</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                            Paid
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="text-[#62d5e4] hover:text-[#4bc5d6] transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">Mar 1, 2023</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Professional Plan - Monthly</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">$299.00</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                            Paid
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="text-[#62d5e4] hover:text-[#4bc5d6] transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'Notifications' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Notification Preferences</h3>
                <p className="text-sm text-gray-600 mb-6">Configure how and when you receive notifications</p>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Email Notifications</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Coding Queue Updates</p>
                          <p className="text-sm text-gray-600">Get notified when new charts are assigned</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#62d5e4]"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">System Alerts</p>
                          <p className="text-sm text-gray-600">Important system updates and maintenance</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#62d5e4]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Performance Reports</p>
                          <p className="text-sm text-gray-600">Weekly and monthly coding performance summaries</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#62d5e4]"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">In-App Notifications</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">AI Suggestions</p>
                          <p className="text-sm text-gray-600">Notifications for new AI coding suggestions</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#62d5e4]"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Compliance Alerts</p>
                          <p className="text-sm text-gray-600">Warnings about potential compliance issues</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#62d5e4]"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button className="px-6 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors">
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audit & Reports Tab */}
          {activeTab === 'Audit & Reports' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Audit Trail</h3>
                <p className="text-sm text-gray-600 mb-6">Monitor system access and user activities</p>
                
                <div className="flex items-center gap-4 mb-6">
                  <input
                    type="date"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <input
                    type="date"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
                    <option>All Users</option>
                    <option>Admin</option>
                    <option>Supervisor</option>
                    <option>Coder</option>
                  </select>
                  <button className="px-4 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors">
                    Filter
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Timestamp</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">User</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Action</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Details</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">2023-05-15 14:30:22</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Dr. Johnson</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Chart Coded</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Patient ID: 12345, ICD-10: Z51.11</td>
                        <td className="px-4 py-3 text-sm text-gray-600">192.168.1.100</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">2023-05-15 14:25:15</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Dr. Martinez</td>
                        <td className="px-4 py-3 text-sm text-gray-600">User Login</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Successful authentication</td>
                        <td className="px-4 py-3 text-sm text-gray-600">192.168.1.101</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">2023-05-15 14:20:33</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Admin</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Settings Modified</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Updated AI confidence threshold</td>
                        <td className="px-4 py-3 text-sm text-gray-600">192.168.1.102</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Generate Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#62d5e4] rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Performance Report</h4>
                        <p className="text-sm text-gray-600">Coding accuracy and productivity metrics</p>
                      </div>
                    </div>
                    <button className="w-full px-4 py-2 text-sm text-[#62d5e4] border border-[#62d5e4] rounded-lg hover:bg-cyan-50 transition-colors">
                      Generate Report
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#62d5e4] rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Compliance Report</h4>
                        <p className="text-sm text-gray-600">HIPAA and coding compliance status</p>
                      </div>
                    </div>
                    <button className="w-full px-4 py-2 text-sm text-[#62d5e4] border border-[#62d5e4] rounded-lg hover:bg-cyan-50 transition-colors">
                      Generate Report
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#62d5e4] rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">User Activity Report</h4>
                        <p className="text-sm text-gray-600">User login and activity summary</p>
                      </div>
                    </div>
                    <button className="w-full px-4 py-2 text-sm text-[#62d5e4] border border-[#62d5e4] rounded-lg hover:bg-cyan-50 transition-colors">
                      Generate Report
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#62d5e4] rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Analytics Report</h4>
                        <p className="text-sm text-gray-600">Detailed analytics and trends</p>
                      </div>
                    </div>
                    <button className="w-full px-4 py-2 text-sm text-[#62d5e4] border border-[#62d5e4] rounded-lg hover:bg-cyan-50 transition-colors">
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}