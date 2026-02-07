import { useState, useCallback } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

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

interface CreateConnectionRequest {
  ehr_type: string
  organization_name: string
  base_url: string
  poll_interval_seconds: number
  use_mock_data: boolean
  client_id?: string
  client_secret?: string
  private_key?: string
}

interface Patient {
  patient_id: string
  first_name: string
  last_name: string
  mrn: string
  date_of_birth: string
  source_ehr?: string
  last_synced_at?: string
}

interface Encounter {
  encounter_id: string
  patient_id: string
  service_date: string
  encounter_type: string
  source_ehr?: string
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token")
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

export function useEHRApi() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // EHR Connections
  const fetchConnections = useCallback(async (): Promise<EHRConnection[]> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ehr/connections`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch connections")
      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createConnection = useCallback(async (data: CreateConnectionRequest): Promise<EHRConnection | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ehr/connections`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to create connection")
      }
      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateConnection = useCallback(
    async (connectionId: string, data: Partial<EHRConnection>): Promise<EHRConnection | null> => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/api/ehr/connections/${connectionId}`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        })
        if (!response.ok) throw new Error("Failed to update connection")
        return await response.json()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        return null
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const deleteConnection = useCallback(async (connectionId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ehr/connections/${connectionId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      return response.ok
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Sync Status
  const fetchSyncStatus = useCallback(async (): Promise<SyncStatus[]> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ehr/sync-status`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch sync status")
      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const triggerManualSync = useCallback(async (connectionId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ehr/sync/${connectionId}/trigger`, {
        method: "POST",
        headers: getAuthHeaders(),
      })
      return response.ok
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetSyncState = useCallback(async (connectionId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ehr/sync/${connectionId}/reset`, {
        method: "POST",
        headers: getAuthHeaders(),
      })
      return response.ok
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Patients & Encounters
  const fetchPatients = useCallback(async (limit: number = 50): Promise<Patient[]> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/claims/patients?limit=${limit}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch patients")
      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchEncounters = useCallback(async (limit: number = 50): Promise<Encounter[]> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/claims/encounters?limit=${limit}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch encounters")
      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    error,
    // EHR Connections
    fetchConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    // Sync Status
    fetchSyncStatus,
    triggerManualSync,
    resetSyncState,
    // Patients & Encounters
    fetchPatients,
    fetchEncounters,
  }
}
