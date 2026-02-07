"use client"

import { useState } from "react"
import {
  Bot,
  Check,
  Copy,
  Edit,
  FileText,
  Info,
  AlertTriangle,
  Code,
  ChevronRight,
  ClipboardList,
  Building,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface PatientDetailsProps {
  patient: any
}

export function PatientDetails({ patient }: PatientDetailsProps) {
  const [selectedCodes, setSelectedCodes] = useState<string[]>(patient.suggestedCodes.map((code: any) => code.code))
  const [notes, setNotes] = useState(patient.verificationNotes || "")
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "rejected">(
    patient.aiVerified ? "verified" : "pending",
  )
  const [showAIInsights, setShowAIInsights] = useState(false)

  const toggleCodeSelection = (code: string) => {
    if (selectedCodes.includes(code)) {
      setSelectedCodes(selectedCodes.filter((c) => c !== code))
    } else {
      setSelectedCodes([...selectedCodes, code])
    }
  }

  const handleVerify = () => {
    setVerificationStatus("verified")
  }

  const handleReject = () => {
    setVerificationStatus("rejected")
  }

  const toggleAIInsights = () => {
    setShowAIInsights(!showAIInsights)
  }

  const averageConfidence =
    patient.suggestedCodes.reduce((sum: number, code: any) => sum + code.confidence, 0) / patient.suggestedCodes.length

  // Sample hospital data
  const hospitalData = {
    name: "General Hospital",
    admissionDate: "2023-05-15",
    department: "Internal Medicine",
    attendingPhysician: "Dr. Johnson",
    mrn: "MRN-" + patient.id.substring(2),
    insuranceProvider: "Blue Cross Blue Shield",
    visitType: "Inpatient",
    roomNumber: "304-B",
  }

  return (
    <Card className="h-full flex flex-col card-shadow fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{patient.name}</CardTitle>
            <CardDescription>
              {patient.age} years, {patient.gender} | Patient ID: {patient.id}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAIInsights}
              className={cn("hidden sm:flex", showAIInsights && "bg-light")}
            >
              <Bot className="mr-2 h-4 w-4" />
              {showAIInsights ? "Hide AI Insights" : "Show AI Insights"}
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy Patient ID</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <FileText className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Full Record</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        <div className="flex flex-col lg:flex-row h-full">
          {showAIInsights && (
            <div className="w-full lg:w-64 border-r bg-light p-3 flex flex-col">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Bot className="h-4 w-4 mr-1 text-info" />
                AI Insights
              </h3>
              <ScrollArea className="flex-1">
                <div className="space-y-3">
                  <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800">
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Confidence Score</h4>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold">{Math.round(averageConfidence)}%</span>
                      <Badge
                        variant="outline"
                        className={
                          averageConfidence >= 90 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                        }
                      >
                        {averageConfidence >= 90 ? "High" : "Moderate"}
                      </Badge>
                    </div>
                    <Progress
                      value={averageConfidence}
                      className="h-1.5"
                      indicatorClassName={averageConfidence >= 90 ? "bg-success" : "bg-warning"}
                    />
                  </div>

                  <Alert
                    className={cn(
                      "p-3",
                      patient.aiVerified ? "bg-success/10 border-success/20" : "bg-warning/10 border-warning/20",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {patient.aiVerified ? (
                        <Check className="h-4 w-4 mt-0.5 text-success" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mt-0.5 text-warning" />
                      )}
                      <div>
                        <AlertTitle className={patient.aiVerified ? "text-success" : "text-warning"}>
                          {patient.aiVerified ? "AI Verified" : "Verification Needed"}
                        </AlertTitle>
                        <AlertDescription className="text-xs">
                          {patient.aiVerified
                            ? "All codes match documentation with high confidence"
                            : "Some code specificity issues detected"}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>

                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">AI Recommendations</h4>
                    <div className="space-y-2 text-xs">
                      {!patient.aiVerified && (
                        <div className="flex gap-2 rounded-lg bg-white p-2 shadow-sm dark:bg-slate-800">
                          <AlertTriangle className="h-3 w-3 mt-0.5 text-warning flex-shrink-0" />
                          <p>Consider more specific code for {patient.conditions[0]}</p>
                        </div>
                      )}
                      <div className="flex gap-2 rounded-lg bg-white p-2 shadow-sm dark:bg-slate-800">
                        <Info className="h-3 w-3 mt-0.5 text-info flex-shrink-0" />
                        <p>Documentation supports all selected diagnoses</p>
                      </div>
                      <div className="flex gap-2 rounded-lg bg-white p-2 shadow-sm dark:bg-slate-800">
                        <ChevronRight className="h-3 w-3 mt-0.5 text-info flex-shrink-0" />
                        <p>Consider adding Z codes for long-term medication use</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full bg-white dark:bg-slate-800"
                onClick={toggleAIInsights}
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Show Coding Interface
              </Button>
            </div>
          )}

          <div className={cn("flex-1", !showAIInsights && "w-full")}>
            <Tabs defaultValue="coding" className="h-full flex flex-col">
              <TabsList className="mx-4 mt-4">
                <TabsTrigger value="coding">Coding</TabsTrigger>
                <TabsTrigger value="conditions">Conditions</TabsTrigger>
                <TabsTrigger value="hospital">Hospital Details</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="coding" className="flex-1 overflow-auto p-4 pt-0">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">AI-Suggested Codes</h3>
                    <div className="space-y-3">
                      {patient.suggestedCodes.map((code: any) => (
                        <div
                          key={code.code}
                          className={cn(
                            "rounded-lg border p-3 transition-all",
                            code.confidence >= 90 ? "high-confidence" : "low-confidence",
                            "hover:shadow-md fade-in",
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    code.confidence >= 90 ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
                                  )}
                                >
                                  ICD-10
                                </Badge>
                                <span className="font-semibold text-info">{code.code}</span>
                                <span className="font-medium">{code.description}</span>
                              </div>
                            </div>
                            <Button
                              variant={selectedCodes.includes(code.code) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleCodeSelection(code.code)}
                              className={selectedCodes.includes(code.code) ? "bg-info hover:bg-info/80" : ""}
                            >
                              {selectedCodes.includes(code.code) ? <Check className="h-4 w-4" /> : "Add"}
                            </Button>
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>AI Confidence</span>
                              <span className="font-medium">{code.confidence}%</span>
                            </div>
                            <Progress
                              value={code.confidence}
                              className="h-1.5 mt-1"
                              indicatorClassName={code.confidence >= 90 ? "bg-success" : "bg-warning"}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Selected Codes</h3>
                    <div className="rounded-lg border p-3">
                      {selectedCodes.length > 0 ? (
                        <div className="space-y-2">
                          {selectedCodes.map((code) => {
                            const codeDetails = patient.suggestedCodes.find((c: any) => c.code === code)
                            return (
                              <div key={code} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-info/10 text-info">
                                    ICD-10
                                  </Badge>
                                  <span className="font-semibold text-info">{code}</span>
                                  <span>{codeDetails?.description || "Unknown code"}</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => toggleCodeSelection(code)}>
                                  Remove
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No codes selected</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="conditions" className="flex-1 overflow-auto p-4 pt-0">
                <div>
                  <h3 className="text-lg font-medium mb-2">Medical Conditions</h3>
                  <div className="space-y-3">
                    {patient.conditions.map((condition: string, index: number) => (
                      <div key={index} className="rounded-lg border p-3 fade-in hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{condition}</div>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        {patient.suggestedCodes[index] && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Suggested code:</span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  patient.suggestedCodes[index].confidence >= 90
                                    ? "bg-success/10 text-success"
                                    : "bg-warning/10 text-warning",
                                )}
                              >
                                {patient.suggestedCodes[index].code}
                              </Badge>
                              <span>{patient.suggestedCodes[index].description}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs mt-1">
                              <span>AI Confidence</span>
                              <span className="font-medium">{patient.suggestedCodes[index].confidence}%</span>
                            </div>
                            <Progress
                              value={patient.suggestedCodes[index].confidence}
                              className="h-1 mt-1"
                              indicatorClassName={
                                patient.suggestedCodes[index].confidence >= 90 ? "bg-success" : "bg-warning"
                              }
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="hospital" className="flex-1 overflow-auto p-4 pt-0">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Building className="h-5 w-5 mr-2 text-info" />
                      Hospital Information
                    </h3>
                    <div className="rounded-lg border p-4 space-y-4 hover:shadow-md transition-all">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Hospital</h4>
                          <p className="font-medium">{hospitalData.name}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Department</h4>
                          <p className="font-medium">{hospitalData.department}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Admission Date</h4>
                          <p className="font-medium">{hospitalData.admissionDate}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Visit Type</h4>
                          <p className="font-medium">{hospitalData.visitType}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Attending Physician</h4>
                          <p className="font-medium">{hospitalData.attendingPhysician}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Room Number</h4>
                          <p className="font-medium">{hospitalData.roomNumber}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Medical Record Number</h4>
                          <p className="font-medium">{hospitalData.mrn}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Insurance Provider</h4>
                          <p className="font-medium">{hospitalData.insuranceProvider}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Treatment Summary</h3>
                    <div className="rounded-lg border p-4 hover:shadow-md transition-all">
                      <p className="text-sm">
                        Patient was admitted with complaints of {patient.conditions.join(", ")}. Initial assessment
                        showed stable vital signs with mild discomfort. Treatment plan includes medication management
                        and monitoring of symptoms. Patient is responding well to current treatment protocol.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="verification" className="flex-1 overflow-auto p-4 pt-0">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Verification Status</h3>
                    <div className="rounded-lg border p-4 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            verificationStatus === "verified"
                              ? "bg-success/20 text-success"
                              : verificationStatus === "rejected"
                                ? "bg-warning/20 text-warning"
                                : "bg-light text-info",
                          )}
                        >
                          {verificationStatus === "verified" ? (
                            <Check className="h-4 w-4" />
                          ) : verificationStatus === "rejected" ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : (
                            <Code className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{verificationStatus}</p>
                          <p className="text-sm text-muted-foreground">
                            {verificationStatus === "verified"
                              ? "Coding has been verified for accuracy"
                              : verificationStatus === "rejected"
                                ? "Coding has been rejected and needs review"
                                : "Coding needs verification"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">AI Verification</h3>
                    <div className="rounded-lg border p-4 hover:shadow-md transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">Accuracy Score</p>
                          <Badge
                            variant="outline"
                            className={patient.aiVerified ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}
                          >
                            {Math.round(averageConfidence)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {patient.aiVerified
                            ? "The AI model has verified the coding with high confidence based on patient conditions and medical guidelines."
                            : "The AI model has detected potential issues with the coding that may require human review."}
                        </p>
                        <Separator className="my-2" />
                        <div className="space-y-2">
                          <p className="font-medium">Verification Notes</p>
                          {patient.aiVerified ? (
                            <ul className="text-sm space-y-1 list-disc pl-5">
                              <li>All conditions have appropriate ICD-10 codes</li>
                              <li>Code specificity is appropriate for documented conditions</li>
                              <li>No contradictory or duplicate codes detected</li>
                            </ul>
                          ) : (
                            <Alert className="bg-warning/10 border-warning/20">
                              <AlertTriangle className="h-4 w-4 text-warning" />
                              <AlertTitle className="text-warning text-sm">Review Needed</AlertTitle>
                              <AlertDescription className="text-sm">
                                <ul className="text-sm space-y-1 list-disc pl-5 mt-1">
                                  <li>Consider more specific codes for conditions</li>
                                  <li>Check for missing combination codes</li>
                                  <li>Review documentation for specificity</li>
                                </ul>
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Coder Notes</h3>
                    <Textarea
                      placeholder="Add your verification notes here..."
                      className="min-h-[100px]"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="flex-1 overflow-auto p-4 pt-0">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Add notes about this case here..."
                    className="min-h-[200px]"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <div className="rounded-lg border p-4 hover:shadow-md transition-all">
                    <h3 className="text-md font-medium mb-2">AI Documentation Analysis</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-2">
                        <Info className="h-4 w-4 text-info flex-shrink-0" />
                        <p>Documentation supports the primary diagnoses with sufficient clinical evidence.</p>
                      </div>
                      {!patient.aiVerified && (
                        <div className="flex gap-2">
                          <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                          <p>Some conditions lack specific documentation for more granular coding.</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Info className="h-4 w-4 text-info flex-shrink-0" />
                        <p>All required elements for billing are present in the documentation.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t p-4 flex justify-between">
        <Button variant="outline">Save Draft</Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReject}
            className="bg-warning/10 text-warning hover:bg-warning/20 hover:text-warning border-warning/20"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Reject
          </Button>
          <Button onClick={handleVerify} className="bg-success hover:bg-success/80">
            <Check className="mr-2 h-4 w-4" />
            Verify & Complete
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
