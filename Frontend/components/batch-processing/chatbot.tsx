"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Bot, Code, FileSpreadsheet, FilePlus2, Send, User, AlertTriangle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatbotProps {
  contextType?: "general" | "patient" | "batch"
  patient?: any
  batchSummary?: any
}

export function Chatbot({ contextType = "general", patient = null, batchSummary = null }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: getInitialMessage(contextType, patient, batchSummary),
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = (text?: string) => {
    const messageText = text || input
    if (!messageText.trim()) return

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(messageText, contextType, patient, batchSummary)
      const assistantMessage: Message = {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const suggestedQueries = getSuggestedQueries(contextType, patient, batchSummary)

  return (
    <Card className="h-full flex flex-col card-shadow fade-in">
      <CardHeader className="p-3 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-info flex items-center justify-center">
            <Bot className="h-4 w-4 text-info-foreground" />
          </div>
          <div>
            <CardTitle>AI Coding Assistant</CardTitle>
            <CardDescription>
              {contextType === "patient"
                ? "Ask about this patient's coding"
                : contextType === "batch"
                  ? "Get insights on this batch of patients"
                  : "Ask questions about coding, verification, or guidelines"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-3 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-20rem)]">
          <div className="flex flex-col gap-3">
            {messages.map((message, index) => (
              <div key={index} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "flex max-w-[85%] gap-2 rounded-lg p-3",
                    message.role === "user" ? "user-input" : "ai-response",
                  )}
                >
                  <div className="flex-shrink-0 mt-1">
                    {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="whitespace-pre-line text-sm">{message.content}</div>
                    <div className="mt-1 text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="ai-response rounded-lg p-3">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <div className="border-t p-3">
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestedQueries.map((query, index) => (
            <button
              key={index}
              onClick={() => handleSendMessage(query.text)}
              className="flex items-center text-xs bg-light hover:bg-light/80 text-foreground rounded-full px-3 py-1 transition-colors dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {query.icon && <query.icon className="h-3 w-3 mr-1" />}
              {query.text}
            </button>
          ))}
        </div>
      </div>

      <CardFooter className="p-3 pt-0">
        <div className="flex w-full items-center gap-2">
          <Input
            placeholder={`Ask about ${
              contextType === "patient"
                ? "this patient's coding"
                : contextType === "batch"
                  ? "this batch of patients"
                  : "coding, guidelines, or verification"
            }...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="bg-info hover:bg-info/80"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

// Helper functions
function getInitialMessage(contextType: string, patient: any, batchSummary: any): string {
  switch (contextType) {
    case "patient":
      if (patient) {
        const patientName = patient.name
        const conditions = patient.conditions.join(", ")
        return `I'm analyzing ${patientName}'s chart with conditions: ${conditions}.\n\nMy AI analysis suggests ${patient.suggestedCodes.length} appropriate codes with an average confidence of ${getAverageConfidence(patient.suggestedCodes)}%.\n\nHow can I assist with coding for this case?`
      }
      return "I'm analyzing this patient's chart. How can I assist with the coding for this specific case?"

    case "batch":
      if (batchSummary) {
        return `I've analyzed this batch of ${batchSummary.totalPatients} patient records.\n\n• ${batchSummary.verificationRate}% of records have been AI-verified\n• ${batchSummary.highConfidenceRate}% of codes have high confidence (≥90%)\n\nI've detected some common issues in this batch that may need attention. How can I help you understand or address these issues?`
      }
      return "I'm reviewing this batch of patient records. I can help identify patterns, suggest codes, or answer questions about specific cases."

    default:
      return "Hello! I'm your AI coding assistant powered by Ollama. I can help with code suggestions, verification against guidelines, and answering your coding questions. How can I assist you today?"
  }
}

function generateAIResponse(userInput: string, contextType: string, patient: any, batchSummary: any): string {
  const userInputLower = userInput.toLowerCase()

  // Patient-specific responses
  if (contextType === "patient" && patient) {
    if (userInputLower.includes("verify") || userInputLower.includes("appropriate")) {
      const verifiedCodes = patient.suggestedCodes
        .filter((code: any) => code.confidence >= 90)
        .map((code: any) => `${code.code} (${code.description})`)
        .join("\n• ")

      return `Based on my analysis of the documentation for ${patient.name}, I've verified the following codes as appropriate:\n\n• ${verifiedCodes}\n\n${patient.aiVerified ? "All codes meet verification criteria." : "There are some potential issues with code specificity that may require review."}`
    } else if (userInputLower.includes("suggest more specific") || userInputLower.includes("more specific")) {
      const lowConfidenceCodes = patient.suggestedCodes.filter((code: any) => code.confidence < 90)

      if (lowConfidenceCodes.length > 0) {
        const codeToImprove = lowConfidenceCodes[0]

        if (codeToImprove.code === "I10") {
          return "Instead of I10 (Essential hypertension), you might consider I11.9 (Hypertensive heart disease without heart failure) since the documentation mentions cardiac involvement. This would more accurately reflect the patient's condition."
        } else if (codeToImprove.code.startsWith("E11")) {
          return "For the diabetes code E11.9, I suggest using E11.21 (Type 2 diabetes mellitus with diabetic nephropathy) as the documentation indicates early kidney involvement based on the lab values."
        } else {
          return `For the code ${codeToImprove.code} (${codeToImprove.description}), I recommend checking if more specific documentation is available. The current code is somewhat general and may not capture the full clinical picture.`
        }
      } else {
        return "Based on my review of the documentation, the current codes are appropriately specific and match the documented conditions well. No further specificity is needed unless additional documentation is available."
      }
    } else if (userInputLower.includes("explain") || userInputLower.includes("justify")) {
      const highestConfidenceCode = [...patient.suggestedCodes].sort((a: any, b: any) => b.confidence - a.confidence)[0]

      return `I suggested code ${highestConfidenceCode.code} (${highestConfidenceCode.description}) with ${highestConfidenceCode.confidence}% confidence because:\n\n1. It directly corresponds to the documented condition "${patient.conditions[0]}"\n2. The documentation provides sufficient specificity for this code\n3. The code aligns with current ICD-10-CM guidelines\n4. The medical record supports this diagnosis with appropriate clinical evidence\n\nWould you like me to explain any other code suggestions?`
    }
  }

  // Batch-specific responses
  if (contextType === "batch" && batchSummary) {
    if (userInputLower.includes("common issues") || userInputLower.includes("problems")) {
      return `In this batch, I've identified several common issues:\n\n1. ${batchSummary.commonIssues[0]}\n2. ${batchSummary.commonIssues[1]}\n3. ${batchSummary.commonIssues[2]}\n\nThese issues could potentially impact reimbursement and compliance. Would you like me to help formulate a corrective action plan?`
    } else if (userInputLower.includes("patterns") || userInputLower.includes("trends")) {
      return `I've analyzed this batch and found these key patterns:\n\n• 43% of patients have hypertension-related diagnoses\n• 35% have diabetes-related conditions\n• 22% have respiratory conditions\n\nThe most frequent code is I10 (Essential hypertension), appearing in 38% of patient records. This suggests a focus on cardiovascular disease management would be valuable for this patient population.`
    } else if (userInputLower.includes("improve") || userInputLower.includes("recommendation")) {
      return `Based on my analysis, here are my recommendations to improve coding accuracy in this batch:\n\n1. Focus on documenting specificity for chronic conditions, particularly diabetes and hypertension\n2. Ensure combination codes are used when appropriate (e.g., diabetes with complications)\n3. Review documentation for patients with CKD to ensure stage is specified\n4. Address the pattern of using unspecified codes when documentation supports more specific coding\n\nImplementing these recommendations could improve coding accuracy by approximately 14% and potentially increase appropriate reimbursement.`
    }
  }

  // General responses
  if (userInputLower.includes("guideline") || userInputLower.includes("check coding")) {
    return "According to the latest ICD-10-CM guidelines (FY 2023), when coding diabetes mellitus (E11.9), you should:\n\n1. Assign as many codes as necessary to identify all associated conditions\n2. Sequence diabetes codes first, followed by manifestation codes\n3. Use additional codes for any insulin use (Z79.4) or oral antidiabetic drug use (Z79.84)\n\nIs there a specific aspect of the guidelines you'd like me to elaborate on?"
  } else if (userInputLower.includes("suggest") || userInputLower.includes("recommendation")) {
    return "Based on the documentation, I recommend:\n\n• E11.9 for Type 2 diabetes\n• I10 for hypertension\n• E78.5 for hyperlipidemia\n\nI also noticed the patient has documented chronic kidney disease, which might warrant code N18.9 or a more specific code if the stage is documented. Would you like me to analyze this further?"
  } else if (userInputLower.includes("help") || userInputLower.includes("assist")) {
    return "I can help with several tasks:\n\n• Suggesting appropriate ICD-10 codes for conditions\n• Verifying code accuracy and compliance\n• Explaining coding guidelines and updates\n• Identifying potential documentation gaps\n• Providing educational resources for specific coding scenarios\n\nWhat specific assistance do you need today?"
  } else if (userInputLower.includes("replace coder") || userInputLower.includes("automate")) {
    return "I'm designed to augment human coders rather than replace them entirely. While I can automate many coding tasks with high accuracy, human expertise remains valuable for:\n\n• Complex clinical scenarios requiring nuanced judgment\n• Cases where documentation is ambiguous or incomplete\n• Quality assurance and compliance oversight\n• Training and improving the AI system\n\nThe most effective approach is typically a human-AI collaboration, combining my speed and consistency with human expertise and judgment."
  } else {
    return "I understand you're asking about medical coding. Could you provide more specific details about what you need help with? I can assist with code selection, verification, guideline interpretation, or answer specific questions about patient cases."
  }
}

function getSuggestedQueries(contextType: string, patient: any, batchSummary: any) {
  const generalQueries = [
    { text: "Check coding guidelines", icon: FileSpreadsheet },
    { text: "How can you help me?", icon: ChevronRight },
    { text: "Explain recent ICD-10 changes", icon: Code },
  ]

  if (contextType === "patient" && patient) {
    return [
      { text: "Verify these codes", icon: Code },
      { text: "Suggest more specific codes", icon: FilePlus2 },
      { text: "Explain code selection", icon: ChevronRight },
      { text: "Documentation gaps?", icon: AlertTriangle },
    ]
  } else if (contextType === "batch" && batchSummary) {
    return [
      { text: "Common issues in this batch", icon: AlertTriangle },
      { text: "Improvement recommendations", icon: ChevronRight },
      { text: "Patient patterns and trends", icon: FileSpreadsheet },
      { text: "Highest risk cases", icon: AlertTriangle },
    ]
  }

  return generalQueries
}

function getAverageConfidence(codes: any[]): number {
  if (!codes || codes.length === 0) return 0
  const sum = codes.reduce((total, code) => total + code.confidence, 0)
  return Math.round(sum / codes.length)
}
