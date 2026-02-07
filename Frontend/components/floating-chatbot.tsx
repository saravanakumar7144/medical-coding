"use client"

import type React from "react"

import { useState } from "react"
import { Bot, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

// Common chatbot quick replies
const quickReplies = [
  "Check coding guidelines",
  "Verify this code",
  "Common errors in this batch",
  "Suggest more specific codes",
]

export function FloatingChatbot({ contextType = "general" }: { contextType?: "general" | "patient" | "batch" }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: getInitialMessage(contextType),
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const toggleChatbot = () => {
    setIsOpen(!isOpen)
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
      const aiResponse = generateAIResponse(messageText, contextType)
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

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <Card className={cn("w-80 md:w-96 h-[500px] mb-4 flex flex-col animate-fadeIn", !isOpen && "hidden")}>
          <CardHeader className="p-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-info flex items-center justify-center">
                  <Bot className="h-4 w-4 text-info-foreground" />
                </div>
                <CardTitle className="text-md">AI Coding Assistant</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={toggleChatbot} className="h-7 w-7">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-3 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="flex flex-col gap-3">
                {messages.map((message, index) => (
                  <div key={index} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg p-3",
                        message.role === "user" ? "user-input" : "ai-response",
                      )}
                    >
                      <div className="text-sm">{message.content}</div>
                      <div className="mt-1 text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
              </div>
            </ScrollArea>
          </CardContent>
          <div className="p-3 border-t">
            <div className="flex flex-wrap gap-2 mb-3">
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(reply)}
                  className="text-xs bg-light hover:bg-light/80 text-info rounded-full px-3 py-1 transition-colors dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
          <CardFooter className="p-3 pt-0">
            <div className="flex w-full items-center gap-2">
              <Input
                placeholder="Ask me anything..."
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
                <Bot className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
      <Button
        onClick={toggleChatbot}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg bg-info hover:bg-info/90",
          isOpen && "bg-muted hover:bg-muted/90",
        )}
      >
        <Bot className="h-6 w-6" />
      </Button>
    </div>
  )
}

// Helper functions
function getInitialMessage(contextType: string): string {
  switch (contextType) {
    case "patient":
      return "I'm analyzing this patient's chart. How can I assist with the coding for this specific case?"
    case "batch":
      return "I'm reviewing this batch of patient records. I can help identify patterns, suggest codes, or answer questions about specific cases."
    default:
      return "Hello! I'm your AI coding assistant powered by Ollama. How can I help you today?"
  }
}

function generateAIResponse(userInput: string, contextType: string): string {
  const userInputLower = userInput.toLowerCase()

  // Patient-specific responses
  if (contextType === "patient") {
    if (userInputLower.includes("verify this code") || userInputLower.includes("appropriate")) {
      return "Based on the documentation, the code E11.9 (Type 2 diabetes mellitus without complications) is appropriate. The patient's condition is well-controlled with no documented complications. Would you like me to suggest any additional codes for comorbidities?"
    } else if (userInputLower.includes("suggest more specific")) {
      return "Instead of I10 (Essential hypertension), you might consider I11.9 (Hypertensive heart disease without heart failure) since the patient has documented left ventricular hypertrophy on their echocardiogram. This would more accurately reflect the patient's condition."
    }
  }

  // Batch-specific responses
  if (contextType === "batch") {
    if (userInputLower.includes("common errors")) {
      return "In this batch, I've identified several common issues:\n\n1. Missing 7th characters for fracture codes (28% of cases)\n2. Unspecified hypertension codes when documentation supports more specific codes (17% of cases)\n3. Missing combination codes for diabetes with complications (12% of cases)\n\nWould you like me to help correct these issues?"
    } else if (userInputLower.includes("patterns")) {
      return "I've analyzed this batch and found that 43% of patients have hypertension-related diagnoses, 35% have diabetes-related conditions, and 22% have respiratory conditions. The most frequent code is I10, appearing in 38% of patient records."
    }
  }

  // General responses
  if (userInputLower.includes("guideline") || userInputLower.includes("check coding")) {
    return "According to the latest ICD-10-CM guidelines (FY 2023), when coding diabetes mellitus (E11.9), you should:\n\n1. Assign as many codes as necessary to identify all associated conditions\n2. Sequence diabetes codes first, followed by manifestation codes\n3. Use additional codes for any insulin use (Z79.4) or oral antidiabetic drug use (Z79.84)\n\nIs there a specific aspect of the guidelines you'd like me to elaborate on?"
  } else if (userInputLower.includes("suggest") || userInputLower.includes("recommendation")) {
    return "Based on the documentation, I recommend:\n\n• E11.9 for Type 2 diabetes\n• I10 for hypertension\n• E78.5 for hyperlipidemia\n\nI also noticed the patient has documented chronic kidney disease, which might warrant code N18.9 or a more specific code if the stage is documented. Would you like me to analyze this further?"
  } else if (userInputLower.includes("help") || userInputLower.includes("assist")) {
    return "I can help with several tasks:\n\n• Suggesting appropriate ICD-10 codes for conditions\n• Verifying code accuracy and compliance\n• Explaining coding guidelines and updates\n• Identifying potential documentation gaps\n• Providing educational resources for specific coding scenarios\n\nWhat specific assistance do you need today?"
  } else {
    return "I understand you're asking about medical coding. Could you provide more specific details about what you need help with? I can assist with code selection, verification, guideline interpretation, or answer specific questions about patient cases."
  }
}
