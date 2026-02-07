"use client"

import type React from "react"

import { useState } from "react"
import { Bot, Check, FileSpreadsheet, FileUp, Filter, Search, User, Code, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PatientDetails } from "@/components/batch-processing/patient-details"
import { Chatbot } from "@/components/batch-processing/chatbot"
import { FloatingChatbot } from "@/components/floating-chatbot"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

// Sample data for processed patients
const samplePatients = [
  {
    id: "P-1001",
    name: "John Smith",
    age: 58,
    gender: "Male",
    conditions: ["Type 2 diabetes mellitus", "Essential hypertension", "Hyperlipidemia"],
    suggestedCodes: [
      { code: "E11.9", description: "Type 2 diabetes mellitus without complications", confidence: 95 },
      { code: "I10", description: "Essential (primary) hypertension", confidence: 98 },
      { code: "E78.5", description: "Hyperlipidemia, unspecified", confidence: 90 },
    ],
    status: "processed",
    aiVerified: true,
    verificationNotes: "All codes verified against documentation. No discrepancies found.",
  },
  {
    id: "P-1002",
    name: "Sarah Williams",
    age: 42,
    gender: "Female",
    conditions: ["Migraine with aura", "Anxiety disorder", "Vitamin D deficiency"],
    suggestedCodes: [
      {
        code: "G43.109",
        description: "Migraine with aura, not intractable, without status migrainosus",
        confidence: 88,
      },
      { code: "F41.9", description: "Anxiety disorder, unspecified", confidence: 90 },
      { code: "E55.9", description: "Vitamin D deficiency, unspecified", confidence: 94 },
    ],
    status: "processed",
    aiVerified: true,
    verificationNotes: "All codes match documentation. Consider more specific anxiety code if documentation supports.",
  },
  {
    id: "P-1003",
    name: "Michael Brown",
    age: 65,
    gender: "Male",
    conditions: ["COPD", "Atrial fibrillation", "Osteoarthritis"],
    suggestedCodes: [
      { code: "J44.9", description: "Chronic obstructive pulmonary disease, unspecified", confidence: 96 },
      { code: "I48.91", description: "Unspecified atrial fibrillation", confidence: 93 },
      { code: "M19.90", description: "Unspecified osteoarthritis, unspecified site", confidence: 89 },
    ],
    status: "processed",
    aiVerified: false,
    verificationNotes:
      "Documentation suggests persistent atrial fibrillation (I48.11) rather than unspecified (I48.91). Please review.",
  },
  {
    id: "P-1004",
    name: "Emily Davis",
    age: 35,
    gender: "Female",
    conditions: ["Asthma", "Allergic rhinitis", "Eczema"],
    suggestedCodes: [
      { code: "J45.909", description: "Unspecified asthma, uncomplicated", confidence: 94 },
      { code: "J30.9", description: "Allergic rhinitis, unspecified", confidence: 91 },
      { code: "L30.9", description: "Dermatitis, unspecified", confidence: 85 },
    ],
    status: "processed",
    aiVerified: true,
    verificationNotes: "All codes accurate. Documentation supports diagnoses.",
  },
  {
    id: "P-1005",
    name: "Robert Miller",
    age: 72,
    gender: "Male",
    conditions: ["Congestive heart failure", "Chronic kidney disease", "Gout"],
    suggestedCodes: [
      { code: "I50.9", description: "Heart failure, unspecified", confidence: 92 },
      { code: "N18.9", description: "Chronic kidney disease, unspecified", confidence: 90 },
      { code: "M10.9", description: "Gout, unspecified", confidence: 88 },
    ],
    status: "processed",
    aiVerified: false,
    verificationNotes:
      "CKD stage is documented as Stage 3 in labs. Consider N18.3 instead of N18.9. Heart failure type not specified.",
  },
]

export function BatchProcessing() {
  const [fileUploaded, setFileUploaded] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processed, setProcessed] = useState(false)
  const [progress, setProgress] = useState(0)
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showChatbot, setShowChatbot] = useState(false)
  const [batchSummary, setBatchSummary] = useState<any>(null)
  const [filterVerified, setFilterVerified] = useState<boolean | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileUploaded(true)
    }
  }

  const handleProcessFile = () => {
    setProcessing(true)

    // Simulate processing with progress updates
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += 5
      setProgress(currentProgress)

      if (currentProgress >= 100) {
        clearInterval(interval)
        setProcessing(false)
        setProcessed(true)
        setPatients(samplePatients)
        generateBatchSummary(samplePatients)
      }
    }, 200)
  }

  const generateBatchSummary = (patientData: any[]) => {
    // Calculate some statistics for the batch
    const totalPatients = patientData.length
    const verifiedPatients = patientData.filter((p) => p.aiVerified).length
    const totalCodes = patientData.reduce((sum, p) => sum + p.suggestedCodes.length, 0)
    const highConfidenceCodes = patientData.reduce(
      (sum, p) => sum + p.suggestedCodes.filter((c: any) => c.confidence >= 90).length,
      0,
    )

    setBatchSummary({
      totalPatients,
      verifiedPatients,
      verificationRate: ((verifiedPatients / totalPatients) * 100).toFixed(1),
      totalCodes,
      highConfidenceCodes,
      highConfidenceRate: ((highConfidenceCodes / totalCodes) * 100).toFixed(1),
      commonIssues: [
        "Missing specificity in chronic conditions (32%)",
        "Unspecified codes when documentation supports specificity (18%)",
        "Missing combination codes for related conditions (14%)",
      ],
    })
  }

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient)
    setShowChatbot(false)
  }

  const toggleChatbot = () => {
    setShowChatbot(!showChatbot)
    if (!showChatbot) {
      setSelectedPatient(null)
    }
  }

  const filteredPatients = patients.filter((patient) => {
    // Apply text search
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.conditions.some((condition: string) => condition.toLowerCase().includes(searchTerm.toLowerCase()))

    // Apply verification filter
    const matchesVerificationFilter = filterVerified === null || patient.aiVerified === filterVerified

    return matchesSearch && matchesVerificationFilter
  })

  const toggleVerificationFilter = (status: boolean | null) => {
    setFilterVerified(status)
  }

  return (
    <div className="space-y-4">
      {!processed ? (
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Upload Patient Data</CardTitle>
            <CardDescription>
              Upload a CSV or Excel file containing patient information and medical conditions for AI-powered batch
              processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="file-upload">Patient Data File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">Supported formats: CSV, Excel (.xlsx, .xls)</p>
            </div>

            {fileUploaded && !processing && (
              <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-6 sm:p-8">
                <FileSpreadsheet className="h-12 w-12 text-info" />
                <div className="text-center">
                  <p className="font-medium">File ready for processing</p>
                  <p className="text-sm text-muted-foreground">
                    Our AI model will analyze patient data and suggest appropriate medical codes
                  </p>
                </div>
                <Button onClick={handleProcessFile} className="bg-info hover:bg-info/80">
                  <FileUp className="mr-2 h-4 w-4" />
                  Process File
                </Button>
              </div>
            )}

            {processing && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-6 sm:p-8 animate-pulse">
                  <div className="text-center">
                    <p className="font-medium">Processing patient data...</p>
                    <p className="text-sm text-muted-foreground">
                      The Ollama AI model is analyzing patient conditions and generating coding suggestions
                    </p>
                  </div>
                  <div className="w-full max-w-md">
                    <Progress value={progress} className="h-2 bg-secondary" />
                    <p className="mt-2 text-center text-sm text-muted-foreground">{progress}% complete</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {batchSummary && (
            <Card className="card-shadow bg-light mb-4 fade-in dark:bg-slate-800">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle>Batch Summary</CardTitle>
                  <Button variant="outline" size="sm" onClick={toggleChatbot} className="sm:ml-auto">
                    <Bot className="mr-2 h-4 w-4" />
                    {showChatbot ? "Hide AI Assistant" : "Get AI Insights"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="stat-card bg-white dark:bg-slate-900">
                    <p className="text-sm text-muted-foreground">Total Patients</p>
                    <p className="text-xl font-bold">{batchSummary.totalPatients}</p>
                  </div>
                  <div className="stat-card bg-white dark:bg-slate-900">
                    <p className="text-sm text-muted-foreground">AI Verified</p>
                    <p className="text-xl font-bold text-success">{batchSummary.verificationRate}%</p>
                  </div>
                  <div className="stat-card bg-white dark:bg-slate-900">
                    <p className="text-sm text-muted-foreground">Total Codes</p>
                    <p className="text-xl font-bold">{batchSummary.totalCodes}</p>
                  </div>
                  <div className="stat-card bg-white dark:bg-slate-900">
                    <p className="text-sm text-muted-foreground">High Confidence</p>
                    <p className="text-xl font-bold text-info">{batchSummary.highConfidenceRate}%</p>
                  </div>
                </div>

                <Alert className="bg-warning/10 border-warning/20">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertTitle className="text-warning">Common Issues Detected</AlertTitle>
                  <AlertDescription>
                    <ul className="text-sm mt-1 space-y-1">
                      {batchSummary.commonIssues.map((issue: string, i: number) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Card className="h-full card-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Patient List</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant={filterVerified === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleVerificationFilter(null)}
                        className={cn(filterVerified === null ? "bg-info hover:bg-info/80" : "")}
                      >
                        All
                      </Button>
                      <Button
                        variant={filterVerified === true ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleVerificationFilter(true)}
                        className={cn(filterVerified === true ? "bg-success hover:bg-success/80" : "")}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Verified
                      </Button>
                      <Button
                        variant={filterVerified === false ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleVerificationFilter(false)}
                        className={cn(filterVerified === false ? "bg-warning hover:bg-warning/80" : "")}
                      >
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Issues
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{patients.length} patients processed with AI-suggested codes</CardDescription>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search patients..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-24rem)]">
                    <div className="space-y-1 p-2">
                      {filteredPatients.map((patient) => (
                        <div
                          key={patient.id}
                          className={cn(
                            "cursor-pointer rounded-md p-3 transition-colors hover:bg-light dark:hover:bg-slate-800",
                            selectedPatient?.id === patient.id ? "bg-light dark:bg-slate-800" : "",
                            "fade-in",
                          )}
                          onClick={() => handlePatientSelect(patient)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{patient.name}</div>
                            <Badge
                              variant="outline"
                              className={cn(
                                patient.aiVerified ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
                              )}
                            >
                              {patient.id}
                            </Badge>
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {patient.age} years, {patient.gender}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {patient.conditions.map((condition: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-light dark:bg-slate-700">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                          <div className="mt-2 flex items-center gap-1">
                            <Code className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {patient.suggestedCodes.length} suggested codes
                            </span>
                            {patient.aiVerified ? (
                              <Badge variant="outline" className="ml-auto text-xs bg-success/10 text-success">
                                <Check className="mr-1 h-3 w-3" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="ml-auto text-xs bg-warning/10 text-warning">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Review needed
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {filteredPatients.length === 0 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No patients found matching your search criteria
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter className="border-t p-4">
                  <Button variant="outline" className="w-full">
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload New File
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {showChatbot ? (
                <Chatbot contextType="batch" batchSummary={batchSummary} />
              ) : selectedPatient ? (
                <PatientDetails patient={selectedPatient} />
              ) : (
                <Card className="h-full flex items-center justify-center card-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-light dark:bg-slate-800">
                      <User className="h-6 w-6 text-info" />
                    </div>
                    <h3 className="text-lg font-medium">Select a Patient</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Select a patient from the list to view details and coding suggestions
                    </p>
                    <div className="mt-6">
                      <Button variant="outline" className="mx-auto" onClick={toggleChatbot}>
                        <Bot className="mr-2 h-4 w-4" />
                        Get Batch AI Insights
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {/* Floating chatbot button - only show in patient view mode */}
      {processed && selectedPatient && !showChatbot && <FloatingChatbot contextType="patient" />}
    </div>
  )
}
