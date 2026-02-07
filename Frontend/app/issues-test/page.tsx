"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Info } from "lucide-react"

interface VerificationResult {
  code: string
  description: string
  agent: string
  original_confidence: number
  is_appropriate: boolean
  verification_confidence: number
  concerns: string
  recommendations: string
  status: string
  final_score: number
}

const sampleVerificationResults: VerificationResult[] = [
  {
    code: "I10",
    description: "Essential hypertension",
    agent: "ICD-10",
    original_confidence: 50.0,
    is_appropriate: false,
    verification_confidence: 30,
    concerns: "The code I10 is for essential hypertension, but the patient's current chief complaint of chest pain and shortness of breath suggests an acute cardiovascular event. The history of hypertension supports this diagnosis, but I10 alone may not capture the complexity of the patient's condition.",
    recommendations: "Consider adding a more specific code (e.g., I11 - Hypertensive crisis) to reflect the patient's current chief complaint and potential acute management needs. Also, review other relevant codes that may support the patient's condition, such as I40-49 for cardiovascular disease or the specific type of cardiac event suspected.",
    status: "rejected",
    final_score: 36.0
  },
  {
    code: "E11.9",
    description: "Type 2 diabetes mellitus",
    agent: "ICD-10",
    original_confidence: 50.0,
    is_appropriate: false,
    verification_confidence: 20,
    concerns: "The selected code E11.9 lacks specificity for proper clinical documentation and billing accuracy.",
    recommendations: "Consider adding more specificity to the diagnosis by selecting a more narrow code that only represents the Type 2 diabetes without other related conditions. For example: E11.00 (with hyperosmolarity), E11.10 (with ketoacidosis), or E11.21 (with diabetic nephropathy).",
    status: "rejected",
    final_score: 29.0
  },
  {
    code: "Z51.11",
    description: "Encounter for antineoplastic chemotherapy",
    agent: "ICD-10",
    original_confidence: 85.0,
    is_appropriate: true,
    verification_confidence: 85,
    concerns: "",
    recommendations: "Code is appropriate for the documented encounter.",
    status: "approved",
    final_score: 85.0
  }
]

export default function IssuesTestPage() {
  const [showResults, setShowResults] = useState(false)

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'rejected':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'approved':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      default:
        return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Issues Display Test</h1>
          <p className="text-muted-foreground">
            Test the enhanced Issues tab display format showing code details, confidence scores, and issue classifications.
          </p>
        </div>

        <div className="mb-6">
          <Button 
            onClick={() => setShowResults(!showResults)}
            className="mb-4"
          >
            {showResults ? 'Hide' : 'Show'} Sample Issues
          </Button>
        </div>

        {showResults && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Verification Issues</h2>
            {sampleVerificationResults.map((result, index) => (
              <div key={index} className={`rounded-lg border p-4 ${getVerificationColor(result.status)}`}>
                <div className="flex items-start gap-3">
                  {getVerificationIcon(result.status)}
                  <div className="flex-1 min-w-0">
                    {/* Code with description - confidence score */}
                    <div className="mb-3">
                      <h4 className="font-semibold text-sm">
                        {result.code} - {result.description}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">Confidence:</span>
                        <div className="flex-1 max-w-32">
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-primary" 
                              style={{ width: `${result.final_score}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-medium">{result.final_score}%</span>
                      </div>
                    </div>

                    {/* Issue red/yellow indicator with score */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${
                          result.status === 'rejected' ? 'bg-red-500' : 
                          result.verification_confidence < 50 ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <span className="text-sm font-medium">
                          Issue Score: {result.verification_confidence}%
                        </span>
                        <Badge variant={result.status === 'approved' ? 'default' : 'destructive'}>
                          {result.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {/* Reason for considering it as Issue */}
                    {result.concerns && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Reason for Issue:
                        </p>
                        <p className="text-sm">{result.concerns}</p>
                      </div>
                    )}

                    {/* Recommendations */}
                    {result.recommendations && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Recommendations:
                        </p>
                        <p className="text-sm">{result.recommendations}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
