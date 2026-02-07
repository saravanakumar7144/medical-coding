"use client"

import { useState, useEffect } from "react"
import { ArrowUpDown, Clock, FileText, MoreHorizontal, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

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

export function WorkQueue() {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [patients, setPatients] = useState<Patient[]>([])
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPatientsAndEncounters()
  }, [])

  const fetchPatientsAndEncounters = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("access_token")

      // Fetch patients
      const patientsResponse = await fetch("http://localhost:8000/api/claims/patients?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json()
        setPatients(patientsData)
      }

      // Fetch encounters
      const encountersResponse = await fetch("http://localhost:8000/api/claims/encounters?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (encountersResponse.ok) {
        const encountersData = await encountersResponse.json()
        setEncounters(encountersData)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "urgent":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const getEHRBadge = (sourceEHR?: string) => {
    if (!sourceEHR) return null

    const ehrColors: Record<string, string> = {
      epic: "bg-purple-100 text-purple-800",
      athena: "bg-green-100 text-green-800",
      cerner: "bg-blue-100 text-blue-800",
      meditech: "bg-orange-100 text-orange-800",
    }

    return (
      <Badge variant="outline" className={`${ehrColors[sourceEHR] || "bg-gray-100 text-gray-800"} capitalize`}>
        <Database className="mr-1 h-3 w-3" />
        {sourceEHR}
      </Badge>
    )
  }

  // Combine patients with their encounters
  const workQueueItems = patients.map((patient) => {
    const patientEncounters = encounters.filter((enc) => enc.patient_id === patient.patient_id)
    const latestEncounter = patientEncounters.sort(
      (a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime()
    )[0]

    return {
      id: patient.mrn || patient.patient_id.substring(0, 8),
      patientName: `${patient.first_name} ${patient.last_name}`,
      dateOfService: latestEncounter?.service_date || "N/A",
      status: latestEncounter ? "pending" : "no-encounter",
      priority: patient.source_ehr ? "high" : "medium",
      sourceEHR: patient.source_ehr || latestEncounter?.source_ehr,
      lastSynced: patient.last_synced_at,
      patient_id: patient.patient_id,
    }
  })

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Work Queue</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Clock className="mr-2 h-4 w-4" />
              History
            </Button>
          </div>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">
              <Button variant="ghost" onClick={() => handleSort("id")} className="flex items-center gap-1 px-0">
                ID
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("patientName")}
                className="flex items-center gap-1 px-0"
              >
                Patient
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Date of Service</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Last Synced</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))
          ) : workQueueItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No patients found. EHR sync will populate this queue automatically.
              </TableCell>
            </TableRow>
          ) : (
            workQueueItems.map((item) => (
              <TableRow key={item.patient_id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>{item.patientName}</TableCell>
                <TableCell>{item.dateOfService !== "N/A" ? new Date(item.dateOfService).toLocaleDateString() : "N/A"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`${getStatusColor(item.status)} capitalize`}>
                    {item.status.replace("-", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{item.priority}</TableCell>
                <TableCell>{getEHRBadge(item.sourceEHR) || <span className="text-muted-foreground text-sm">Manual</span>}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.lastSynced ? new Date(item.lastSynced).toLocaleString() : "-"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View Chart</DropdownMenuItem>
                      <DropdownMenuItem>Assign</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Change Priority</DropdownMenuItem>
                      {item.sourceEHR && <DropdownMenuItem>View FHIR Data</DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
