"use client"

import { useState, useCallback } from "react"
import { api, MedicalCode, VerificationResult as ApiVerificationResult, PatientData } from "@/lib/api"
import { toast } from "sonner"

interface AnalysisOptions {
  includeIcd10?: boolean
  includeCpt?: boolean
  includeHcpcs?: boolean
  confidenceThreshold?: number
}

// Use the API verification result type
type VerificationResult = ApiVerificationResult

export function useMedicalCoding() {
  const [sessionId, setSessionId] = useState<string>("")
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [suggestedCodes, setSuggestedCodes] = useState<MedicalCode[]>([])
  const [selectedCodes, setSelectedCodes] = useState<MedicalCode[]>([])
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([])
  const [searchResults, setSearchResults] = useState<MedicalCode[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const createSession = useCallback(async () => {
    try {
      setIsLoading(true)
      const session = await api.createSession()
      setSessionId(session.session_id)
      return session.session_id
    } catch (error) {
      console.error("Failed to create session:", error)
      toast.error(`Failed to create session: ${error}`)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const uploadDocument = useCallback(async (file: File) => {
    try {
      setIsUploading(true)
      const result = await api.uploadDocument(file, sessionId)
      
      // Set patient data with extracted content
      if (result.patient_data) {
        setPatientData({
          id: result.session_id,
          name: result.filename || file.name,
          text: result.patient_data?.text || "",
          chiefComplaint: result.patient_data?.chiefComplaint,
          vitalSigns: result.patient_data?.vitalSigns,
          history: result.patient_data?.history,
          examination: result.patient_data?.examination,
          dob: result.patient_data?.dob,
          gender: result.patient_data?.gender,
          visitDate: result.patient_data?.visitDate,
          provider: result.patient_data?.provider
        })
      }
      
      if (result.session_id && result.session_id !== sessionId) {
        setSessionId(result.session_id)
      }
      
      return result
    } catch (error) {
      console.error("Failed to upload document:", error)
      toast.error(`Failed to upload document: ${error}`)
      throw error
    } finally {
      setIsUploading(false)
    }
  }, [sessionId])

  const runAnalysis = useCallback(async (sessionId: string, options: AnalysisOptions) => {
    try {
      setIsAnalyzing(true)
      // Map the options to backend format
      const backendOptions = {
        run_icd10: options.includeIcd10 ?? true,
        run_cpt: options.includeCpt ?? true,
        run_hcpcs: options.includeHcpcs ?? true
      }
      const result = await api.runAnalysis(sessionId, backendOptions)
      
      if (result.suggested_codes) {
        setSuggestedCodes(result.suggested_codes)
      }
      
      return result
    } catch (error) {
      console.error("Failed to run analysis:", error)
      toast.error(`Failed to run analysis: ${error}`)
      throw error
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const searchCodes = useCallback(async (query: string, codeType: string = "all") => {
    try {
      setIsSearching(true)
      const result = await api.searchCodes(query, codeType)
      setSearchResults(result.results || [])
      return result
    } catch (error) {
      console.error("Failed to search codes:", error)
      toast.error(`Failed to search codes: ${error}`)
      throw error
    } finally {
      setIsSearching(false)
    }
  }, [])

  const selectCode = useCallback(async (sessionId: string, code: MedicalCode) => {
    try {
      await api.selectCode(sessionId, code)
      
      // Add to selected codes if not already present
      setSelectedCodes(prev => {
        const exists = prev.some(c => c.code === code.code)
        if (!exists) {
          return [...prev, code]
        }
        return prev
      })
      
    } catch (error) {
      console.error("Failed to select code:", error)
      toast.error(`Failed to select code: ${error}`)
      throw error
    }
  }, [])

  const addManualCode = useCallback(async (
    sessionId: string, 
    code: string, 
    description: string, 
    codeType: string, 
    confidence: number = 1.0
  ) => {
    try {
      await api.addManualCode(sessionId, code, description, codeType, confidence)
      
      const manualCode: MedicalCode = {
        code,
        description,
        type: codeType as "ICD-10" | "CPT" | "HCPCS",
        confidence,
        source: "manual"
      }
      
      setSelectedCodes(prev => [...prev, manualCode])
      
    } catch (error) {
      console.error("Failed to add manual code:", error)
      toast.error(`Failed to add manual code: ${error}`)
      throw error
    }
  }, [])

  const removeCode = useCallback(async (code: string) => {
    try {
      if (sessionId) {
        await api.removeSelectedCode(sessionId, code)
      }
      
      setSelectedCodes(prev => prev.filter(c => c.code !== code))
      
    } catch (error) {
      console.error("Failed to remove code:", error)
      toast.error(`Failed to remove code: ${error}`)
      throw error
    }
  }, [sessionId])

  const verifyCodes = useCallback(async () => {
    if (!sessionId || selectedCodes.length === 0) {
      toast.error("No codes to verify")
      return
    }

    try {
      setIsVerifying(true)
      const result = await api.verifyCodes(sessionId, selectedCodes)
      
      if (result.verification_results) {
        setVerificationResults(result.verification_results)
      }
      
      return result
    } catch (error) {
      console.error("Failed to verify codes:", error)
      toast.error(`Failed to verify codes: ${error}`)
      throw error
    } finally {
      setIsVerifying(false)
    }
  }, [sessionId, selectedCodes])

  const clearSearch = useCallback(() => {
    setSearchResults([])
  }, [])

  const exportToCSV = useCallback(async (sessionId: string) => {
    try {
      await api.exportCsv(sessionId)
    } catch (error) {
      console.error("Failed to export CSV:", error)
      throw error
    }
  }, [])

  const exportToExcel = useCallback(async (sessionId: string) => {
    try {
      await api.exportExcel(sessionId)
    } catch (error) {
      console.error("Failed to export Excel:", error)
      throw error
    }
  }, [])

  return {
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
    addManualCode,
    removeCode,
    verifyCodes,
    clearSearch,
    exportToCSV,
    exportToExcel
  }
}
