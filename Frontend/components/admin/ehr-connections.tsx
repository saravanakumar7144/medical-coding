"use client"

import { useState, useEffect } from "react"
import { Activity, Plus, RefreshCw, Server, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface EHRConnection {
  connection_id: string
  ehr_type: string
  organization_name: string
  base_url: string
  poll_interval_seconds: number
  is_active: boolean
  use_mock_data: boolean
  last_sync_at?: string
  last_sync_status?: string
  last_sync_error?: string
}

interface SyncStatus {
  connection_id: string
  organization_name: string
  ehr_type: string
  is_active: boolean
  last_sync_at?: string
  last_sync_status?: string
  resource_types: {
    Patient?: { records_processed: number; records_created: number; records_updated: number; last_sync_time?: string }
    Encounter?: { records_processed: number; records_created: number; records_updated: number; last_sync_time?: string }
    Condition?: { records_processed: number; records_created: number; records_updated: number; last_sync_time?: string }
    Procedure?: { records_processed: number; records_created: number; records_updated: number; last_sync_time?: string }
  }
}

export function EHRConnections() {
  const [connections, setConnections] = useState<EHRConnection[]>([])
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // New connection form state
  const [newConnection, setNewConnection] = useState({
    ehr_type: "epic",
    organization_name: "",
    base_url: "",
    poll_interval_seconds: 30,
    use_mock_data: true,
    client_id: "",
    client_secret: "",
    private_key: "",
  })

  // Fetch EHR connections on mount
  useEffect(() => {
    fetchConnections()
    fetchSyncStatus()
    // Poll sync status every 30 seconds
    const interval = setInterval(fetchSyncStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/ehr/connections", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setConnections(data)
      }
    } catch (err) {
      console.error("Failed to fetch EHR connections:", err)
    }
  }

  const fetchSyncStatus = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/ehr/sync-status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setSyncStatuses(data)
      }
    } catch (err) {
      console.error("Failed to fetch sync status:", err)
    }
  }

  const handleAddConnection = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/ehr/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newConnection),
      })

      if (response.ok) {
        await fetchConnections()
        setIsAddDialogOpen(false)
        setNewConnection({
          ehr_type: "epic",
          organization_name: "",
          base_url: "",
          poll_interval_seconds: 30,
          use_mock_data: true,
          client_id: "",
          client_secret: "",
          private_key: "",
        })
      } else {
        const errorData = await response.json()
        setError(errorData.detail || "Failed to create connection")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualSync = async (connectionId: string) => {
    try {
      const token = localStorage.getItem("access_token")
      await fetch(`http://localhost:8000/api/ehr/sync/${connectionId}/trigger`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      // Refresh sync status after triggering
      setTimeout(fetchSyncStatus, 2000)
    } catch (err) {
      console.error("Failed to trigger manual sync:", err)
    }
  }

  const handleToggleActive = async (connectionId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem("access_token")
      await fetch(`http://localhost:8000/api/ehr/connections/${connectionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !isActive }),
      })
      await fetchConnections()
    } catch (err) {
      console.error("Failed to toggle connection:", err)
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      case "running":
        return <Badge className="bg-blue-100 text-blue-800">Syncing</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
    }
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Never"
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>EHR Connections</CardTitle>
            <CardDescription>Manage Electronic Health Record system integrations</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Connection
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add EHR Connection</DialogTitle>
                <DialogDescription>Configure a new Electronic Health Record system integration</DialogDescription>
              </DialogHeader>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ehr-type">EHR System</Label>
                    <Select value={newConnection.ehr_type} onValueChange={(value) => setNewConnection({ ...newConnection, ehr_type: value })}>
                      <SelectTrigger id="ehr-type">
                        <SelectValue placeholder="Select EHR system" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="epic">Epic (FHIR R4)</SelectItem>
                        <SelectItem value="athena">athenahealth</SelectItem>
                        <SelectItem value="cerner">Cerner (FHIR R4)</SelectItem>
                        <SelectItem value="meditech">Meditech</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization-name">Organization Name</Label>
                    <Input
                      id="organization-name"
                      placeholder="Springfield Medical Center"
                      value={newConnection.organization_name}
                      onChange={(e) => setNewConnection({ ...newConnection, organization_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="base-url">FHIR Base URL</Label>
                  <Input
                    id="base-url"
                    placeholder="https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4"
                    value={newConnection.base_url}
                    onChange={(e) => setNewConnection({ ...newConnection, base_url: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="poll-interval">Poll Interval (seconds)</Label>
                    <Input
                      id="poll-interval"
                      type="number"
                      min="10"
                      value={newConnection.poll_interval_seconds}
                      onChange={(e) => setNewConnection({ ...newConnection, poll_interval_seconds: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="use-mock-data" className="flex items-center gap-2">
                      Use Mock Data
                    </Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="use-mock-data"
                        checked={newConnection.use_mock_data}
                        onCheckedChange={(checked) => setNewConnection({ ...newConnection, use_mock_data: checked })}
                      />
                      <Label htmlFor="use-mock-data" className="text-sm text-muted-foreground">
                        {newConnection.use_mock_data ? "Testing with mock FHIR data" : "Real EHR connection"}
                      </Label>
                    </div>
                  </div>
                </div>

                {!newConnection.use_mock_data && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="client-id">Client ID</Label>
                      <Input
                        id="client-id"
                        type="text"
                        value={newConnection.client_id}
                        onChange={(e) => setNewConnection({ ...newConnection, client_id: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client-secret">Client Secret</Label>
                      <Input
                        id="client-secret"
                        type="password"
                        value={newConnection.client_secret}
                        onChange={(e) => setNewConnection({ ...newConnection, client_secret: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="private-key">Private Key (for JWT)</Label>
                      <textarea
                        id="private-key"
                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="-----BEGIN RSA PRIVATE KEY-----"
                        value={newConnection.private_key}
                        onChange={(e) => setNewConnection({ ...newConnection, private_key: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddConnection} disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Connection"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* Active Connections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Connections</CardTitle>
          <CardDescription>Manage and monitor your EHR system connections</CardDescription>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No EHR connections configured</p>
              <p className="text-sm">Add a connection to start syncing patient data</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>EHR System</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead>Poll Interval</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((connection) => (
                  <TableRow key={connection.connection_id}>
                    <TableCell className="font-medium">{connection.organization_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {connection.ehr_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(connection.last_sync_status)}
                        {getStatusBadge(connection.last_sync_status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(connection.last_sync_at)}
                    </TableCell>
                    <TableCell>{connection.poll_interval_seconds}s</TableCell>
                    <TableCell>
                      <Badge variant={connection.use_mock_data ? "secondary" : "default"}>
                        {connection.use_mock_data ? "Mock Data" : "Live"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManualSync(connection.connection_id)}
                          title="Trigger manual sync"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={connection.is_active}
                          onCheckedChange={() => handleToggleActive(connection.connection_id, connection.is_active)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sync Status Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Synchronization Status
          </CardTitle>
          <CardDescription>Real-time sync progress and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {syncStatuses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No sync activity yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {syncStatuses.map((status) => (
                <div key={status.connection_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{status.organization_name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{status.ehr_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status.last_sync_status)}
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(status.last_sync_at)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(status.resource_types).map(([resourceType, stats]) => (
                      <div key={resourceType} className="rounded-lg border p-3">
                        <div className="text-sm font-medium text-muted-foreground mb-1">{resourceType}s</div>
                        <div className="text-2xl font-bold">{stats.records_processed || 0}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="text-green-600">+{stats.records_created || 0}</span> /{" "}
                          <span className="text-blue-600">~{stats.records_updated || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
