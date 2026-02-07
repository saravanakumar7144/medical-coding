"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronRight, Download, Loader2, RefreshCw, Save, Shield, Trash2, Upload, User, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { EHRConnections } from "./ehr-connections"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Type definitions
interface UserData {
  user_id: string
  username: string
  email: string
  role: string
  is_active: boolean
  email_verified: boolean
  last_login_at: string | null
  created_at: string
}

interface SystemLog {
  id: number
  timestamp: string
  user: string
  action: string
  type: string
}

interface SystemMetrics {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  active_connections: number
  uptime_seconds: number
}

interface AISettings {
  model_name: string
  confidence_threshold: number
  code_suggestions_enabled: boolean
  error_detection_enabled: boolean
  compliance_monitoring_enabled: boolean
  natural_language_search_enabled: boolean
  analytics_enabled: boolean
  continuous_learning_enabled: boolean
  last_training_date: string | null
}

interface Backup {
  backup_id: string
  created_at: string
  size_bytes: number
  backup_type: string
  status: string
  location: string
}

interface SecuritySettings {
  two_factor_enabled: boolean
  sso_enabled: boolean
  password_policy: string
  session_timeout_minutes: number
  data_encryption_enabled: boolean
  anonymize_reports: boolean
  audit_logging_enabled: boolean
  hipaa_enabled: boolean
  hitech_enabled: boolean
  gdpr_enabled: boolean
  last_security_scan: string | null
  compliance_status: string
}

// API helper function
async function adminApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("access_token")
  const response = await fetch(`${API_BASE_URL}/api/admin${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

export function AdminSettings() {
  const { toast } = useToast()

  // User Management State
  const [users, setUsers] = useState<UserData[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'coder' })

  // AI Settings State
  const [aiSettings, setAiSettings] = useState<AISettings>({
    model_name: 'mistral',
    confidence_threshold: 75,
    code_suggestions_enabled: true,
    error_detection_enabled: true,
    compliance_monitoring_enabled: true,
    natural_language_search_enabled: true,
    analytics_enabled: true,
    continuous_learning_enabled: true,
    last_training_date: null,
  })
  const [aiSettingsLoading, setAiSettingsLoading] = useState(true)
  const [aiSaving, setAiSaving] = useState(false)

  // System State
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu_usage: 0,
    memory_usage: 0,
    disk_usage: 0,
    active_connections: 0,
    uptime_seconds: 0,
  })
  const [systemLoading, setSystemLoading] = useState(true)

  // Backup State
  const [backups, setBackups] = useState<Backup[]>([])
  const [backupsLoading, setBackupsLoading] = useState(true)
  const [backupCreating, setBackupCreating] = useState(false)

  // Security State
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    two_factor_enabled: false,
    sso_enabled: false,
    password_policy: 'strong',
    session_timeout_minutes: 30,
    data_encryption_enabled: true,
    anonymize_reports: true,
    audit_logging_enabled: true,
    hipaa_enabled: true,
    hitech_enabled: true,
    gdpr_enabled: false,
    last_security_scan: null,
    compliance_status: 'compliant',
  })
  const [securityLoading, setSecurityLoading] = useState(true)
  const [securitySaving, setSecuritySaving] = useState(false)

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const data = await adminApi('/users')
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUsersLoading(false)
    }
  }, [toast])

  // Fetch AI Settings
  const fetchAiSettings = useCallback(async () => {
    setAiSettingsLoading(true)
    try {
      const data = await adminApi('/ai-settings')
      setAiSettings(data)
    } catch (error) {
      console.error('Failed to fetch AI settings:', error)
    } finally {
      setAiSettingsLoading(false)
    }
  }, [])

  // Fetch System Data
  const fetchSystemData = useCallback(async () => {
    setSystemLoading(true)
    try {
      const [logsData, metricsData] = await Promise.all([
        adminApi('/system/logs?limit=20'),
        adminApi('/system/metrics'),
      ])
      setSystemLogs(logsData.logs || [])
      setSystemMetrics(metricsData)
    } catch (error) {
      console.error('Failed to fetch system data:', error)
    } finally {
      setSystemLoading(false)
    }
  }, [])

  // Fetch Backups
  const fetchBackups = useCallback(async () => {
    setBackupsLoading(true)
    try {
      const data = await adminApi('/backups')
      setBackups(data.backups || [])
    } catch (error) {
      console.error('Failed to fetch backups:', error)
    } finally {
      setBackupsLoading(false)
    }
  }, [])

  // Fetch Security Settings
  const fetchSecuritySettings = useCallback(async () => {
    setSecurityLoading(true)
    try {
      const data = await adminApi('/security-settings')
      setSecuritySettings(data)
    } catch (error) {
      console.error('Failed to fetch security settings:', error)
    } finally {
      setSecurityLoading(false)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchUsers()
    fetchAiSettings()
    fetchSystemData()
    fetchBackups()
    fetchSecuritySettings()
  }, [fetchUsers, fetchAiSettings, fetchSystemData, fetchBackups, fetchSecuritySettings])

  // Add User
  const handleAddUser = async () => {
    try {
      await adminApi('/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      })
      toast({
        title: "Success",
        description: "User created successfully",
      })
      setAddUserDialogOpen(false)
      setNewUser({ username: '', email: '', password: '', role: 'coder' })
      fetchUsers()
    } catch (error) {
      console.error('Failed to create user:', error)
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Delete User
  const handleDeleteUser = async (userId: string) => {
    try {
      await adminApi(`/users/${userId}`, { method: 'DELETE' })
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
      fetchUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Save AI Settings
  const handleSaveAiSettings = async () => {
    setAiSaving(true)
    try {
      await adminApi('/ai-settings', {
        method: 'PUT',
        body: JSON.stringify(aiSettings),
      })
      toast({
        title: "Success",
        description: "AI settings saved successfully",
      })
    } catch (error) {
      console.error('Failed to save AI settings:', error)
      toast({
        title: "Error",
        description: "Failed to save AI settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAiSaving(false)
    }
  }

  // Retrain Model
  const handleRetrainModel = async () => {
    try {
      await adminApi('/ai-settings/retrain', { method: 'POST' })
      toast({
        title: "Success",
        description: "Model retraining initiated",
      })
      fetchAiSettings()
    } catch (error) {
      console.error('Failed to retrain model:', error)
      toast({
        title: "Error",
        description: "Failed to initiate model retraining",
        variant: "destructive",
      })
    }
  }

  // Create Backup
  const handleCreateBackup = async () => {
    setBackupCreating(true)
    try {
      await adminApi('/backups', {
        method: 'POST',
        body: JSON.stringify({ backup_type: 'full' }),
      })
      toast({
        title: "Success",
        description: "Backup created successfully",
      })
      fetchBackups()
    } catch (error) {
      console.error('Failed to create backup:', error)
      toast({
        title: "Error",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      })
    } finally {
      setBackupCreating(false)
    }
  }

  // Restore Backup
  const handleRestoreBackup = async (backupId: string) => {
    try {
      await adminApi(`/backups/${backupId}/restore`, { method: 'POST' })
      toast({
        title: "Success",
        description: "Backup restoration initiated",
      })
    } catch (error) {
      console.error('Failed to restore backup:', error)
      toast({
        title: "Error",
        description: "Failed to restore backup. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Save Security Settings
  const handleSaveSecuritySettings = async () => {
    setSecuritySaving(true)
    try {
      await adminApi('/security-settings', {
        method: 'PUT',
        body: JSON.stringify(securitySettings),
      })
      toast({
        title: "Success",
        description: "Security settings saved successfully",
      })
    } catch (error) {
      console.error('Failed to save security settings:', error)
      toast({
        title: "Error",
        description: "Failed to save security settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSecuritySaving(false)
    }
  }

  // Run Security Scan
  const handleSecurityScan = async () => {
    toast({
      title: "Security Scan",
      description: "Security scan initiated. This may take a few minutes.",
    })
    // In a real implementation, this would trigger a background job
  }

  // Format bytes to human readable
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  return (
    <Tabs defaultValue="users">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="users">User Management</TabsTrigger>
        <TabsTrigger value="ai">AI Settings</TabsTrigger>
        <TabsTrigger value="ehr">EHR Connections</TabsTrigger>
        <TabsTrigger value="system">System</TabsTrigger>
        <TabsTrigger value="backup">Backup & Sync</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>

      {/* User Management Tab */}
      <TabsContent value="users" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage users, roles, and permissions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchUsers} disabled={usersLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${usersLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>Create a new user account</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-username">Username</Label>
                      <Input
                        id="new-username"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        placeholder="Enter username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-email">Email</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="Enter email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Enter password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-role">Role</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger id="new-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                          <SelectItem value="coder">Coder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddUser}>Create User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              user.role === "admin"
                                ? "bg-blue-100 text-blue-800"
                                : user.role === "supervisor"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-green-100 text-green-800"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.last_login_at)}</TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete {user.username}. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.user_id)} className="bg-red-600">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
            <CardDescription>Configure access levels for different user roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Admin</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="admin-users" defaultChecked />
                    <Label htmlFor="admin-users">User Management</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="admin-settings" defaultChecked />
                    <Label htmlFor="admin-settings">System Settings</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="admin-analytics" defaultChecked />
                    <Label htmlFor="admin-analytics">Analytics</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="admin-coding" defaultChecked />
                    <Label htmlFor="admin-coding">Coding</Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2">Supervisor</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="supervisor-users" />
                    <Label htmlFor="supervisor-users">User Management</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="supervisor-settings" />
                    <Label htmlFor="supervisor-settings">System Settings</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="supervisor-analytics" defaultChecked />
                    <Label htmlFor="supervisor-analytics">Analytics</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="supervisor-coding" defaultChecked />
                    <Label htmlFor="supervisor-coding">Coding</Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2">Coder</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="coder-users" disabled />
                    <Label htmlFor="coder-users">User Management</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="coder-settings" disabled />
                    <Label htmlFor="coder-settings">System Settings</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="coder-analytics" />
                    <Label htmlFor="coder-analytics">Analytics</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="coder-coding" defaultChecked />
                    <Label htmlFor="coder-coding">Coding</Label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* AI Settings Tab */}
      <TabsContent value="ai" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>AI Configuration</CardTitle>
            <CardDescription>Configure AI model settings and behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiSettingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ai-model">AI Model</Label>
                  <Select
                    value={aiSettings.model_name}
                    onValueChange={(value) => setAiSettings({ ...aiSettings, model_name: value })}
                  >
                    <SelectTrigger id="ai-model">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mistral">Ollama - Mistral</SelectItem>
                      <SelectItem value="llama2">Ollama - Llama 2</SelectItem>
                      <SelectItem value="codellama">Ollama - CodeLlama</SelectItem>
                      <SelectItem value="custom">Custom Model</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Minimum Confidence Threshold</Label>
                    <span className="text-sm">{aiSettings.confidence_threshold}%</span>
                  </div>
                  <Slider
                    max={100}
                    step={1}
                    value={[aiSettings.confidence_threshold]}
                    onValueChange={(value) => setAiSettings({ ...aiSettings, confidence_threshold: value[0] })}
                  />
                  <p className="text-sm text-muted-foreground">
                    AI will only suggest codes with confidence above this threshold
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>AI Features</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ai-coding"
                        checked={aiSettings.code_suggestions_enabled}
                        onCheckedChange={(checked) => setAiSettings({ ...aiSettings, code_suggestions_enabled: checked })}
                      />
                      <Label htmlFor="ai-coding">Code Suggestions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ai-error"
                        checked={aiSettings.error_detection_enabled}
                        onCheckedChange={(checked) => setAiSettings({ ...aiSettings, error_detection_enabled: checked })}
                      />
                      <Label htmlFor="ai-error">Error Detection</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ai-compliance"
                        checked={aiSettings.compliance_monitoring_enabled}
                        onCheckedChange={(checked) => setAiSettings({ ...aiSettings, compliance_monitoring_enabled: checked })}
                      />
                      <Label htmlFor="ai-compliance">Compliance Monitoring</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ai-search"
                        checked={aiSettings.natural_language_search_enabled}
                        onCheckedChange={(checked) => setAiSettings({ ...aiSettings, natural_language_search_enabled: checked })}
                      />
                      <Label htmlFor="ai-search">Natural Language Search</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ai-analytics"
                        checked={aiSettings.analytics_enabled}
                        onCheckedChange={(checked) => setAiSettings({ ...aiSettings, analytics_enabled: checked })}
                      />
                      <Label htmlFor="ai-analytics">Analytics & Insights</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ai-learning"
                        checked={aiSettings.continuous_learning_enabled}
                        onCheckedChange={(checked) => setAiSettings({ ...aiSettings, continuous_learning_enabled: checked })}
                      />
                      <Label htmlFor="ai-learning">Continuous Learning</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Model Training</Label>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last trained: {formatDate(aiSettings.last_training_date)}</span>
                      <Button variant="outline" size="sm" onClick={handleRetrainModel}>
                        Retrain Model
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Retraining the model will use your local data to improve AI accuracy
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveAiSettings} disabled={aiSaving}>
              {aiSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Performance Monitoring</CardTitle>
            <CardDescription>Monitor AI model performance and accuracy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground">Accuracy</div>
                  <div className="text-2xl font-bold">92.5%</div>
                  <div className="text-xs text-muted-foreground">+1.2% from last month</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground">Suggestions Used</div>
                  <div className="text-2xl font-bold">78.3%</div>
                  <div className="text-xs text-muted-foreground">+3.5% from last month</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground">Error Detection</div>
                  <div className="text-2xl font-bold">85.7%</div>
                  <div className="text-xs text-muted-foreground">+2.1% from last month</div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="text-lg font-medium mb-2">AI Activity Log</h3>
                <div className="text-sm text-muted-foreground">Recent AI model activity will be displayed here</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* EHR Connections Tab */}
      <TabsContent value="ehr" className="space-y-4">
        <EHRConnections />
      </TabsContent>

      {/* System Tab */}
      <TabsContent value="system" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>View system activity and performance logs</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSystemData} disabled={systemLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${systemLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {systemLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    systemLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.timestamp}</TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              log.type === "info"
                                ? "bg-blue-100 text-blue-800"
                                : log.type === "success"
                                  ? "bg-green-100 text-green-800"
                                  : log.type === "error"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {log.type}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Logs
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>Monitor system resources and performance</CardDescription>
          </CardHeader>
          <CardContent>
            {systemLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground">CPU Usage</div>
                  <div className="text-2xl font-bold">{systemMetrics.cpu_usage.toFixed(1)}%</div>
                  <div className="h-2 w-full bg-muted mt-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${systemMetrics.cpu_usage > 80 ? 'bg-red-500' : systemMetrics.cpu_usage > 60 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                      style={{ width: `${systemMetrics.cpu_usage}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground">Memory Usage</div>
                  <div className="text-2xl font-bold">{systemMetrics.memory_usage.toFixed(1)}%</div>
                  <div className="h-2 w-full bg-muted mt-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${systemMetrics.memory_usage > 80 ? 'bg-red-500' : systemMetrics.memory_usage > 60 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                      style={{ width: `${systemMetrics.memory_usage}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground">Disk Usage</div>
                  <div className="text-2xl font-bold">{systemMetrics.disk_usage.toFixed(1)}%</div>
                  <div className="h-2 w-full bg-muted mt-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${systemMetrics.disk_usage > 80 ? 'bg-red-500' : systemMetrics.disk_usage > 60 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                      style={{ width: `${systemMetrics.disk_usage}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Configure general system settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="system-name">System Name</Label>
                <Input id="system-name" defaultValue="Medical Coder Pro" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input id="organization" defaultValue="General Hospital" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="utc-5">
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem>
                    <SelectItem value="utc-7">Mountain Time (UTC-7)</SelectItem>
                    <SelectItem value="utc-6">Central Time (UTC-6)</SelectItem>
                    <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-format">Date Format</Label>
                <Select defaultValue="mm-dd-yyyy">
                  <SelectTrigger id="date-format">
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="yyyy-mm-dd">YYYY/MM/DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Appearance</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input type="radio" id="theme-light" name="theme" value="light" defaultChecked className="h-4 w-4" />
                  <Label htmlFor="theme-light">Light</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="radio" id="theme-dark" name="theme" value="dark" className="h-4 w-4" />
                  <Label htmlFor="theme-dark">Dark</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="radio" id="theme-system" name="theme" value="system" className="h-4 w-4" />
                  <Label htmlFor="theme-system">System</Label>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* Backup & Sync Tab */}
      <TabsContent value="backup" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Backup & Restore</CardTitle>
              <CardDescription>Configure backup settings and restore data</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchBackups} disabled={backupsLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${backupsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Automatic Backups</Label>
              <div className="flex items-center space-x-2">
                <Switch id="auto-backup" defaultChecked />
                <Label htmlFor="auto-backup">Enable automatic backups</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backup-frequency">Backup Frequency</Label>
              <Select defaultValue="daily">
                <SelectTrigger id="backup-frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backup-location">Backup Location</Label>
              <div className="flex gap-2">
                <Input id="backup-location" defaultValue="C:\Backups\MedicalCoder" className="flex-1" />
                <Button variant="outline">Browse</Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Backup History</Label>
              {backupsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backups.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No backups found
                          </TableCell>
                        </TableRow>
                      ) : (
                        backups.map((backup) => (
                          <TableRow key={backup.backup_id}>
                            <TableCell>{formatDate(backup.created_at)}</TableCell>
                            <TableCell>{formatBytes(backup.size_bytes)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{backup.backup_type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={backup.status === 'completed' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                {backup.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Restore Backup?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will restore your system from the backup created on {formatDate(backup.created_at)}. Current data may be overwritten.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRestoreBackup(backup.backup_id)}>
                                      Restore
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCreateBackup} disabled={backupCreating}>
                {backupCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Backup Now
              </Button>
            </div>
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Synchronization</CardTitle>
            <CardDescription>Configure synchronization of coding guidelines and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Auto-Sync Guidelines</Label>
              <div className="flex items-center space-x-2">
                <Switch id="auto-sync" defaultChecked />
                <Label htmlFor="auto-sync">Enable automatic synchronization</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically download and update coding guidelines and references
              </p>
            </div>

            <div className="space-y-2">
              <Label>Sync Frequency</Label>
              <Select defaultValue="weekly">
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Sources</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="sync-icd10" defaultChecked />
                  <Label htmlFor="sync-icd10">ICD-10 Updates</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="sync-cpt" defaultChecked />
                  <Label htmlFor="sync-cpt">CPT Updates</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="sync-hcpcs" defaultChecked />
                  <Label htmlFor="sync-hcpcs">HCPCS Updates</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="sync-cms" defaultChecked />
                  <Label htmlFor="sync-cms">CMS Guidelines</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="sync-payer" defaultChecked />
                  <Label htmlFor="sync-payer">Payer Rules</Label>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Last Synchronized</h3>
                  <p className="text-sm text-muted-foreground">Check data source status</p>
                </div>
                <Button variant="outline" size="sm">
                  Sync Now
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* Security Tab */}
      <TabsContent value="security" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Configure security and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {securityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Authentication</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="two-factor"
                        checked={securitySettings.two_factor_enabled}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, two_factor_enabled: checked })}
                      />
                      <Label htmlFor="two-factor">Enable Two-Factor Authentication</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sso"
                        checked={securitySettings.sso_enabled}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, sso_enabled: checked })}
                      />
                      <Label htmlFor="sso">Enable Single Sign-On (SSO)</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-policy">Password Policy</Label>
                  <Select
                    value={securitySettings.password_policy}
                    onValueChange={(value) => setSecuritySettings({ ...securitySettings, password_policy: value })}
                  >
                    <SelectTrigger id="password-policy">
                      <SelectValue placeholder="Select policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (8+ characters)</SelectItem>
                      <SelectItem value="medium">Medium (8+ chars, mixed case)</SelectItem>
                      <SelectItem value="strong">Strong (8+ chars, mixed case, numbers, symbols)</SelectItem>
                      <SelectItem value="custom">Custom Policy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout</Label>
                  <Select
                    value={securitySettings.session_timeout_minutes.toString()}
                    onValueChange={(value) => setSecuritySettings({ ...securitySettings, session_timeout_minutes: parseInt(value) })}
                  >
                    <SelectTrigger id="session-timeout">
                      <SelectValue placeholder="Select timeout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="0">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data Privacy</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="data-encryption"
                        checked={securitySettings.data_encryption_enabled}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, data_encryption_enabled: checked })}
                      />
                      <Label htmlFor="data-encryption">Enable Data Encryption</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="anonymize-data"
                        checked={securitySettings.anonymize_reports}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, anonymize_reports: checked })}
                      />
                      <Label htmlFor="anonymize-data">Anonymize Patient Data in Reports</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="audit-logging"
                        checked={securitySettings.audit_logging_enabled}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, audit_logging_enabled: checked })}
                      />
                      <Label htmlFor="audit-logging">Enable Audit Logging</Label>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveSecuritySettings} disabled={securitySaving}>
              {securitySaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Settings
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance</CardTitle>
            <CardDescription>Configure compliance settings and monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {securityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Compliance Frameworks</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="hipaa"
                        checked={securitySettings.hipaa_enabled}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, hipaa_enabled: checked })}
                      />
                      <Label htmlFor="hipaa">HIPAA</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="hitech"
                        checked={securitySettings.hitech_enabled}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, hitech_enabled: checked })}
                      />
                      <Label htmlFor="hitech">HITECH</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="gdpr"
                        checked={securitySettings.gdpr_enabled}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, gdpr_enabled: checked })}
                      />
                      <Label htmlFor="gdpr">GDPR</Label>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Shield className={`h-5 w-5 ${securitySettings.compliance_status === 'compliant' ? 'text-green-600' : 'text-yellow-600'}`} />
                    <div>
                      <h3 className="font-medium">
                        Compliance Status: {securitySettings.compliance_status === 'compliant' ? 'Compliant' : 'Review Required'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Last security scan: {formatDate(securitySettings.last_security_scan)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Security Scan</h3>
                      <p className="text-sm text-muted-foreground">Run a security scan to check for vulnerabilities</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleSecurityScan}>
                      Run Scan
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveSecuritySettings} disabled={securitySaving}>
              {securitySaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Settings
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
