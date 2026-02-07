"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FileUpload } from "@/components/ui/file-upload"
import { useMedicalCoding } from "@/hooks/use-medical-coding"
import { MedicalCode } from "@/lib/api"
import { toast } from "sonner"
import { 
  Check, 
  Plus, 
  Save, 
  FileText, 
  Search, 
  AlertCircle, 
  Info, 
  X,
  Trash2,
  Upload,
  Loader2,
  RefreshCw,
  Sparkles,
  CheckCircle,
  Download,
  FileSpreadsheet
} from "lucide-react"

export function ChartCodingWorkspace() {
  const {
    sessionId,
    patientData,
    suggestedCodes,
    selectedCodes,
    verificationResults,
    searchResults,
    isLoading,
    isAnalyzing,
    isUploading,
    isSearching,
    isVerifying,
    createSession,
    uploadDocument,
    runAnalysis,
    searchCodes,
    selectCode,
    removeCode,
    verifyCodes,
    exportToCSV,
    exportToExcel
  } = useMedicalCoding()

  const [notes, setNotes] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [codeTypeFilter, setCodeTypeFilter] = useState("all")
  const [isExporting, setIsExporting] = useState(false)

  // Initialize session on component mount
  useEffect(() => {
    if (!sessionId) {
      createSession().catch(console.error)
    }
  }, [sessionId, createSession])

  // Enhanced handlers
  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return
    
    try {
      const file = files[0]
      const result = await uploadDocument(file)
      toast.success(`Document uploaded successfully: ${file.name}`)
      
      // If analysis is needed, run it automatically
      if (result.session_id) {
        await runAnalysis(result.session_id, {
          includeIcd10: true,
          includeCpt: true,
          includeHcpcs: true,
          confidenceThreshold: 0.8 // Only show codes above 80%
        })
      }
    } catch (error) {
      console.error("Upload failed:", error)
    }
  }, [uploadDocument, runAnalysis])

  const handleRunAnalysis = useCallback(async () => {
    if (!sessionId) {
      toast.error("No session available. Please upload a document first.")
      return
    }
    
    try {
      await runAnalysis(sessionId, {
        includeIcd10: true,
        includeCpt: true,
        includeHcpcs: true,
        confidenceThreshold: 0.8 // Only show codes above 80%
      })
      toast.success("Analysis completed successfully!")
    } catch (error) {
      console.error("Analysis failed:", error)
    }
  }, [sessionId, runAnalysis])

  const handleSearchCodes = useCallback(async () => {
    if (!searchQuery.trim()) return
    
    try {
      await searchCodes(searchQuery, codeTypeFilter)
    } catch (error) {
      console.error("Search failed:", error)
    }
  }, [searchQuery, codeTypeFilter, searchCodes])

  const handleSelectCode = useCallback(async (code: MedicalCode) => {
    if (!sessionId) {
      toast.error("No session available")
      return
    }
    
    try {
      await selectCode(sessionId, code)
      toast.success(`Code ${code.code} added successfully`)
    } catch (error) {
      console.error("Failed to select code:", error)
    }
  }, [sessionId, selectCode])

  const handleRemoveCode = useCallback(async (code: MedicalCode) => {
    try {
      await removeCode(code.code)
      toast.success(`Code ${code.code} removed successfully`)
    } catch (error) {
      console.error("Failed to remove code:", error)
    }
  }, [removeCode])

  const handleVerifyCodes = useCallback(async () => {
    if (!sessionId || selectedCodes.length === 0) {
      toast.error("Please select some codes first")
      return
    }
    
    try {
      await verifyCodes()
      toast.success("Code verification completed!")
    } catch (error) {
      console.error("Verification failed:", error)
    }
  }, [sessionId, selectedCodes, verifyCodes])

  // Export handlers
  const handleExport = useCallback(async (format: 'csv' | 'excel') => {
    if (!sessionId) {
      toast.error("No session available for export")
      return
    }
    
    setIsExporting(true)
    try {
      if (format === 'csv') {
        await exportToCSV(sessionId)
        toast.success("CSV export completed successfully!")
      } else {
        await exportToExcel(sessionId)
        toast.success("Excel export completed successfully!")
      }
    } catch (error) {
      console.error(`${format.toUpperCase()} export failed:`, error)
      toast.error(`${format.toUpperCase()} export failed: ${error}`)
    } finally {
      setIsExporting(false)
    }
  }, [sessionId, exportToCSV, exportToExcel])

  // Utility functions
  const getCodeTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'ICD-10':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'CPT':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'HCPCS':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

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

  // Filter codes above 80% confidence
  const filteredSuggestedCodes = suggestedCodes.filter(code => 
    (code.confidence || 0) >= 0.8
  )

  // Check if a code is already selected
  const isCodeSelected = useCallback((code: MedicalCode) => {
    return selectedCodes.some(selectedCode => selectedCode.code === code.code)
  }, [selectedCodes])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-12rem)]">
      {/* Patient Chart Panel */}
      <Card className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Patient Chart</h2>
          <div className="flex gap-2">
            <FileUpload 
              onFileSelect={(file) => handleFileUpload([file])}
              disabled={isUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload PDF"}
            </FileUpload>
            <Button variant="outline" size="sm">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Patient Demographics */}
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span>{" "}
                <span className="text-muted-foreground">
                  {patientData?.name || "N/A"}
                </span>
              </div>
              <div>
                <span className="font-medium">ID:</span>{" "}
                <span className="text-muted-foreground">
                  {patientData?.id || "N/A"}
                </span>
              </div>
              <div>
                <span className="font-medium">DOB:</span>{" "}
                <span className="text-muted-foreground">
                  {patientData?.dob || "N/A"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Gender:</span>{" "}
                <span className="text-muted-foreground">
                  {patientData?.gender || "N/A"}
                </span>
              </div>
              <div>
                <span className="font-medium">Visit:</span>{" "}
                <span className="text-muted-foreground">
                  {patientData?.visitDate || "N/A"}
                </span>
              </div>
              <div>
                <span className="font-medium">Provider:</span>{" "}
                <span className="text-muted-foreground">
                  {patientData?.provider || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic sections based on extracted data */}
          <Accordion type="multiple" className="w-full">
            {/* Extracted Raw Content */}
            <AccordionItem value="extracted-raw-content">
              <AccordionTrigger className="text-sm font-medium">
                Extracted Raw Content
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div className="max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-md border">
                    <pre className="text-xs whitespace-pre-wrap text-gray-700 font-mono leading-relaxed">
                      {patientData?.text || "No document content extracted"}
                    </pre>
                  </div>
                  {patientData?.text && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Source:</span> Raw text extracted from uploaded document
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Chief Complaint */}
            <AccordionItem value="chief-complaint">
              <AccordionTrigger className="text-sm font-medium">
                Chief Complaint
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    {patientData?.chiefComplaint || "No chief complaint recorded"}
                  </p>
                  {patientData?.chiefComplaint && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Source:</span> Extracted from uploaded document
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Vital Signs */}
            <AccordionItem value="vital-signs">
              <AccordionTrigger className="text-sm font-medium">
                Vital Signs
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">BP:</span>{" "}
                    <span className={patientData?.vitalSigns?.bp ? "text-foreground" : "text-muted-foreground"}>
                      {patientData?.vitalSigns?.bp || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Pulse:</span>{" "}
                    <span className={patientData?.vitalSigns?.pulse ? "text-foreground" : "text-muted-foreground"}>
                      {patientData?.vitalSigns?.pulse || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Resp:</span>{" "}
                    <span className={patientData?.vitalSigns?.resp ? "text-foreground" : "text-muted-foreground"}>
                      {patientData?.vitalSigns?.resp || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Temp:</span>{" "}
                    <span className={patientData?.vitalSigns?.temp ? "text-foreground" : "text-muted-foreground"}>
                      {patientData?.vitalSigns?.temp || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Height:</span>{" "}
                    <span className={patientData?.vitalSigns?.height ? "text-foreground" : "text-muted-foreground"}>
                      {patientData?.vitalSigns?.height || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Weight:</span>{" "}
                    <span className={patientData?.vitalSigns?.weight ? "text-foreground" : "text-muted-foreground"}>
                      {patientData?.vitalSigns?.weight || "N/A"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">BMI:</span>{" "}
                    <span className={patientData?.vitalSigns?.bmi ? "text-foreground" : "text-muted-foreground"}>
                      {patientData?.vitalSigns?.bmi || "N/A"}
                    </span>
                  </div>
                </div>
                {(patientData?.vitalSigns?.bp || patientData?.vitalSigns?.pulse) && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">Source:</span> Extracted from uploaded document
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* History */}
            <AccordionItem value="history">
              <AccordionTrigger className="text-sm font-medium">
                History
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <div className="max-h-40 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">
                      {patientData?.history || "No history recorded"}
                    </p>
                  </div>
                  {patientData?.history && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Source:</span> Extracted from uploaded document
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Examination */}
            <AccordionItem value="examination">
              <AccordionTrigger className="text-sm font-medium">
                Examination
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <div className="max-h-40 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">
                      {patientData?.examination || "No examination details recorded"}
                    </p>
                  </div>
                  {patientData?.examination && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Source:</span> Extracted from uploaded document
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Assessment */}
            <AccordionItem value="assessment">
              <AccordionTrigger className="text-sm font-medium">
                Assessment
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <div className="max-h-40 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">
                      {patientData?.assessment || "No assessment recorded"}
                    </p>
                  </div>
                  {patientData?.assessment && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Source:</span> Extracted from uploaded document
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Plan */}
            <AccordionItem value="plan">
              <AccordionTrigger className="text-sm font-medium">
                Plan
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <div className="max-h-40 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">
                      {patientData?.plan || "No treatment plan recorded"}
                    </p>
                  </div>
                  {patientData?.plan && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Source:</span> Extracted from uploaded document
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </Card>

      {/* Coding Panel */}
      <Card className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">Coding</h2>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                AI Codes: {filteredSuggestedCodes.length}
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4" />
                Selected: {selectedCodes.length}
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Issues: {verificationResults.length}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setNotes("")}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Select onValueChange={(value) => handleExport(value as 'csv' | 'excel')}>
              <SelectTrigger className="w-[120px]" disabled={isExporting}>
                <SelectValue placeholder={isExporting ? "Exporting..." : "Export"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="ai-suggestions" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="ai-suggestions">AI Suggestions</TabsTrigger>
            <TabsTrigger value="search">Code Search</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* AI Suggestions Tab */}
          <TabsContent value="ai-suggestions" className="flex-1 overflow-y-auto p-4 pt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">AI-Suggested Codes (&gt;80% confidence)</h3>
                <Button
                  size="sm"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Run AI Analysis
                </Button>
              </div>

              {isAnalyzing && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Analyzing document...</p>
                </div>
              )}

              {!isAnalyzing && filteredSuggestedCodes.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No AI suggestions available. Upload a document and run analysis.
                  </p>
                </div>
              )}

              {filteredSuggestedCodes.map((code, index) => (
                <div key={`${code.code}-${index}`} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={getCodeTypeColor(code.type)}>
                          {code.type}
                        </Badge>
                        <span className="font-medium">{code.code}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{code.description}</p>
                      {code.reasoning && (
                        <p className="text-xs text-muted-foreground mb-2">{code.reasoning}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={isCodeSelected(code) ? "destructive" : "default"}
                      onClick={() => {
                        if (isCodeSelected(code)) {
                          handleRemoveCode(code)
                        } else {
                          handleSelectCode(code)
                        }
                      }}
                      className="ml-2"
                    >
                      {isCodeSelected(code) ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">AI Confidence</span>
                    <span className="font-medium">{((code.confidence || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={(code.confidence || 0) * 100} 
                    className="h-2 mt-1"
                  />
                </div>
              ))}

              {/* Selected Codes Section */}
              {selectedCodes.length > 0 && (
                <div className="border-t pt-4 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium">Selected Codes</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleVerifyCodes}
                      disabled={isVerifying}
                    >
                      {isVerifying ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Verify Codes
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {selectedCodes.map((code, index) => (
                      <div key={`selected-${code.code}-${index}`} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getCodeTypeColor(code.type)}>
                            {code.type}
                          </Badge>
                          <span className="font-medium text-sm">{code.code}</span>
                          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {code.description}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveCode(code)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Code Search Tab */}
          <TabsContent value="search" className="flex-1 overflow-y-auto p-4 pt-0">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for medical codes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchCodes()}
                />
                <Select value={codeTypeFilter} onValueChange={setCodeTypeFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="ICD-10">ICD-10</SelectItem>
                    <SelectItem value="CPT">CPT</SelectItem>
                    <SelectItem value="HCPCS">HCPCS</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearchCodes} disabled={isSearching}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {isSearching && (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Searching...</p>
                </div>
              )}

              <div className="space-y-2">
                {searchResults.map((code, index) => (
                  <div key={`search-${code.code}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={getCodeTypeColor(code.type)}>
                          {code.type}
                        </Badge>
                        <span className="font-medium">{code.code}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{code.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={isCodeSelected(code) ? "destructive" : "default"}
                      onClick={() => {
                        if (isCodeSelected(code)) {
                          handleRemoveCode(code)
                        } else {
                          handleSelectCode(code)
                        }
                      }}
                    >
                      {isCodeSelected(code) ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              {searchResults.length === 0 && !isSearching && searchQuery && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No codes found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues" className="flex-1 overflow-y-auto p-4 pt-0">
            <div className="space-y-4">
              {isVerifying && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Verifying codes...</p>
                </div>
              )}

              {!isVerifying && verificationResults.length === 0 && selectedCodes.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Select some codes first to see verification issues
                  </p>
                </div>
              )}

              {verificationResults.map((result: any, index: number) => (
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

              {verificationResults.length === 0 && selectedCodes.length > 0 && !isVerifying && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No verification issues found. Click "Verify Codes" to check for issues.
                  </p>
                  <Button onClick={handleVerifyCodes}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Verify Codes
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="flex-1 overflow-y-auto p-4 pt-0">
            <div className="space-y-4">
              <Textarea 
                placeholder="Add notes about this case here..." 
                className="min-h-[300px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button>Save Notes</Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
