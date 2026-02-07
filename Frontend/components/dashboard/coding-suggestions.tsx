import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

// Sample data for AI coding suggestions
const codingSuggestions = [
  {
    patientId: "P-1001",
    patientName: "John Smith",
    diagnosis: "Type 2 diabetes mellitus without complications",
    suggestedCodes: [
      { code: "E11.9", description: "Type 2 diabetes mellitus without complications", confidence: 92 },
      { code: "I10", description: "Essential (primary) hypertension", confidence: 85 },
      { code: "E78.5", description: "Hyperlipidemia, unspecified", confidence: 78 },
    ],
  },
  {
    patientId: "P-1003",
    patientName: "Michael Brown",
    diagnosis: "Acute bronchitis with COPD exacerbation",
    suggestedCodes: [
      { code: "J44.1", description: "Chronic obstructive pulmonary disease with acute exacerbation", confidence: 94 },
      { code: "J20.9", description: "Acute bronchitis, unspecified", confidence: 89 },
      { code: "J45.901", description: "Unspecified asthma with (acute) exacerbation", confidence: 65 },
    ],
  },
  {
    patientId: "P-1005",
    patientName: "Robert Miller",
    diagnosis: "Chest pain, unspecified",
    suggestedCodes: [
      { code: "R07.9", description: "Chest pain, unspecified", confidence: 88 },
      { code: "I20.9", description: "Angina pectoris, unspecified", confidence: 72 },
      { code: "R07.89", description: "Other chest pain", confidence: 65 },
    ],
  },
]

export function CodingSuggestions() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {codingSuggestions.map((suggestion) => (
        <Card key={suggestion.patientId} className="overflow-hidden">
          <CardHeader className="bg-muted/50 pb-2">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{suggestion.patientId}</p>
                <CardTitle className="text-lg">{suggestion.patientName}</CardTitle>
              </div>
              <button className="text-sm text-blue-600 hover:underline">View Chart</button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-medium">Diagnosis:</p>
            <p className="mb-4 text-sm">{suggestion.diagnosis}</p>
            <p className="mb-2 text-sm font-medium">AI-Suggested Codes:</p>
            <div className="space-y-3">
              {suggestion.suggestedCodes.map((code) => (
                <div key={code.code} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      <span className="text-blue-600">{code.code}</span> - {code.description}
                    </div>
                    <span className="text-sm font-medium">{code.confidence}%</span>
                  </div>
                  <Progress value={code.confidence} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
