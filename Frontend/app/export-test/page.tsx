"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"

export default function ExportTestPage() {
  const [isExporting, setIsExporting] = useState(false)
  const sampleSessionId = "914a6032-6ed2-4364-ac92-bdc5a5f5a132"

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      await api.exportCsv(sampleSessionId)
      toast.success("CSV export successful!")
    } catch (error) {
      console.error("CSV export failed:", error)
      toast.error(`CSV export failed: ${error}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await api.exportExcel(sampleSessionId)
      toast.success("Excel export successful!")
    } catch (error) {
      console.error("Excel export failed:", error)
      toast.error(`Excel export failed: ${error}`)
    } finally {
      setIsExporting(false)
    }
  }

  const testAPIConnection = async () => {
    try {
      const health = await api.healthCheck()
      toast.success(`API Connection OK: ${health.status}`)
    } catch (error) {
      console.error("API connection failed:", error)
      toast.error(`API connection failed: ${error}`)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Export Functionality Test</h1>
          <p className="text-muted-foreground">
            Test CSV and Excel export functionality that was previously showing "Internal Server Error".
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Button 
              onClick={testAPIConnection}
              variant="outline"
              className="w-full mb-4"
            >
              Test API Connection
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={handleExportCSV}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>

            <Button 
              onClick={handleExportExcel}
              disabled={isExporting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
          </div>

          {isExporting && (
            <div className="text-center text-muted-foreground">
              Processing export...
            </div>
          )}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Test Information:</h3>
            <p className="text-sm text-muted-foreground">
              Using session ID: {sampleSessionId}
            </p>
            <p className="text-sm text-muted-foreground">
              Backend confirmed both CSV and Excel exports are working correctly via PowerShell testing.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
