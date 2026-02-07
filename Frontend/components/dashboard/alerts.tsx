import { AlertCircle, AlertTriangle, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Sample data for alerts
const alertsData = [
  {
    id: 1,
    type: "error",
    title: "Missing Modifier",
    description: "Patient P-1001 (John Smith) has a bilateral procedure code without modifier 50.",
    time: "10 minutes ago",
  },
  {
    id: 2,
    type: "warning",
    title: "Documentation Gap",
    description: "Patient P-1003 (Michael Brown) has COPD diagnosis but missing spirometry results.",
    time: "25 minutes ago",
  },
  {
    id: 3,
    type: "info",
    title: "Payer Update",
    description: "Medicare has updated coding requirements for telehealth services effective June 1.",
    time: "1 hour ago",
  },
  {
    id: 4,
    type: "warning",
    title: "Potential Undercoding",
    description: "Patient P-1005 (Robert Miller) has documented comorbidities that aren't reflected in coding.",
    time: "2 hours ago",
  },
  {
    id: 5,
    type: "error",
    title: "Compliance Risk",
    description: "Multiple high-level E/M codes used for same patient within 7-day period.",
    time: "3 hours ago",
  },
]

export function Alerts() {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-5 w-5" />
      case "warning":
        return <AlertTriangle className="h-5 w-5" />
      case "info":
        return <Info className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getAlertVariant = (type: string) => {
    switch (type) {
      case "error":
        return "destructive"
      case "warning":
        return "warning"
      case "info":
        return "info"
      default:
        return "default"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>System Alerts</CardTitle>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Errors: 2
          </Badge>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Warnings: 2
          </Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Info: 1
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {alertsData.map((alert) => (
          <Alert key={alert.id} variant={getAlertVariant(alert.type) as any}>
            <div className="flex items-start">
              {getAlertIcon(alert.type)}
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <AlertTitle>{alert.title}</AlertTitle>
                  <span className="text-xs text-muted-foreground">{alert.time}</span>
                </div>
                <AlertDescription className="mt-1">{alert.description}</AlertDescription>
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  )
}
