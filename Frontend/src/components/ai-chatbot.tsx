import { useState } from 'react';
import { MessageCircle, Send, X, Bot, User, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  suggestions?: string[];
}

export function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI medical coding assistant powered by advanced language models. I can help you with:\n\n• Code lookups (ICD-10, CPT, HCPCS)\n• Denial resolution strategies\n• Appeal letter generation\n• Coding accuracy checks\n• Revenue optimization tips\n\nHow can I assist you today?',
      sender: 'ai',
      timestamp: new Date(),
      suggestions: [
        'Help with denial code 197',
        'Find codes for diabetes',
        'Generate appeal letter',
        'Check coding accuracy'
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        sender: 'user',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setInputText('');

      // Simulate AI response
      setTimeout(() => {
        const response = getAiResponse(inputText);
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: response.text,
          sender: 'ai',
          timestamp: new Date(),
          suggestions: response.suggestions
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const getAiResponse = (userInput: string): { text: string; suggestions?: string[] } => {
    const input = userInput.toLowerCase();
    
    if (input.includes('denial') && (input.includes('197') || input.includes('auth'))) {
      return {
        text: 'CARC Code 197: Missing Authorization/Precertification\n\n**Recommended Action:**\n1. Contact payer immediately for retroactive authorization\n2. If denied, prepare appeal with medical necessity documentation\n3. Include:\n   • Provider\'s clinical notes\n   • Treatment plan justification\n   • Emergency circumstances (if applicable)\n\n**Success Rate:** 65% with proper documentation\n**Avg Resolution Time:** 25-30 days\n\nWould you like me to generate an appeal letter template?',
        suggestions: ['Generate appeal letter', 'Show similar cases', 'Payer contact info']
      };
    }
    
    if (input.includes('diabetes') || input.includes('e11')) {
      return {
        text: 'Type 2 Diabetes Mellitus Coding:\n\n**Primary Code:** E11.9 (without complications)\n\n**With Complications:**\n• E11.21 - with diabetic nephropathy\n• E11.36 - with diabetic cataract\n• E11.65 - with hyperglycemia\n• E11.69 - with other specified complication\n\n**HCC Impact:** E11.21 maps to HCC 18 (Diabetes with Chronic Complications)\n\n**Documentation Tips:**\n• Specify type (1 or 2)\n• Document all complications\n• Include control status (controlled/uncontrolled)',
        suggestions: ['HCC codes for diabetes', 'Show related CPT codes', 'Documentation checklist']
      };
    }
    
    if (input.includes('appeal') && input.includes('generate')) {
      return {
        text: '✨ **AI Appeal Letter Generator**\n\nI can create a professional appeal letter based on your denial details. I\'ll include:\n\n✓ Proper medical terminology\n✓ Supporting clinical rationale\n✓ Relevant CPT/ICD-10 references\n✓ Payer-specific guidelines\n✓ Strong medical necessity argument\n\nPlease provide:\n1. Claim number\n2. Denial reason/CARC code\n3. Service date\n4. Brief clinical summary\n\nOr would you like to use the AI Denials Workbench for automatic appeal generation?',
        suggestions: ['Open Denials Workbench', 'View sample appeal', 'Appeal success tips']
      };
    }
    
    if (input.includes('accuracy') || input.includes('check') || input.includes('verify')) {
      return {
        text: '🎯 **Coding Accuracy Analysis**\n\nYour current metrics:\n• Overall accuracy: 96.5%\n• HCC coding: 94.2%\n• E&M coding: 97.8%\n\n**Common Issues Detected:**\n1. Missing specificity in diabetes codes (8 cases)\n2. Undercoding E&M visits (5 cases)\n3. Missing HCC opportunities (3 cases)\n\n**AI Recommendations:**\n• Review diabetes documentation for complications\n• Use medical decision-making complexity for E&M\n• Capture all chronic conditions for HCC\n\nWant me to review specific charts?',
        suggestions: ['Show problem charts', 'HCC training tips', 'E&M level guidance']
      };
    }
    
    if (input.includes('hypertension') || input.includes('i10')) {
      return {
        text: 'Hypertension Coding Guide:\n\n**Essential Hypertension:** I10\n\n**Hypertensive Diseases:**\n• I11 - Hypertensive heart disease\n• I12 - Hypertensive chronic kidney disease\n• I13 - Hypertensive heart and CKD\n• I15 - Secondary hypertension\n\n**Coding Tips:**\n• Use I10 for benign, malignant, or unspecified\n• Document relationship to heart/kidney disease\n• Capture controlled vs uncontrolled status\n\n**HCC Impact:** I11-I13 map to HCC 85',
        suggestions: ['Related cardiovascular codes', 'HCC documentation tips', 'Common coding errors']
      };
    }
    
    if (input.includes('hcc') || input.includes('raf')) {
      return {
        text: '📊 **HCC & RAF Scoring**\n\nHierarchical Condition Categories (HCC) drive risk adjustment:\n\n**Top HCC Opportunities:**\n• Major depressive disorder → HCC 59\n• CHF → HCC 85\n• Diabetes with complications → HCC 18\n• COPD → HCC 111\n\n**RAF Score Impact:**\n• Each HCC adds to patient\'s risk score\n• Higher RAF = Higher reimbursement\n• Annual recapture required\n\n**Best Practices:**\n✓ Document ALL chronic conditions annually\n✓ Specify complications and severity\n✓ Use specific, not unspecified codes\n✓ Link diagnoses to current treatment',
        suggestions: ['HCC code list', 'RAF calculator', 'Documentation templates']
      };
    }
    
    if (input.includes('help') || input.includes('what can')) {
      return {
        text: '🤖 **AI Assistant Capabilities**\n\nI can help you with:\n\n**Coding & Documentation:**\n• ICD-10, CPT, HCPCS lookups\n• HCC/RAF analysis\n• Code accuracy verification\n• Documentation improvement tips\n\n**Denial Management:**\n• Denial reason analysis\n• Appeal letter generation\n• Resolution strategies\n• Success rate predictions\n\n**Productivity:**\n• Quick code searches\n• Guideline references\n• Best practice recommendations\n• Training resources\n\nWhat would you like help with?',
        suggestions: ['Code lookup', 'Denial help', 'HCC guidance', 'Generate appeal']
      };
    }
    
    return {
      text: 'I\'m here to help with medical coding and billing. I can assist with:\n\n• Code lookups and verification\n• Denial resolution strategies\n• Appeal letter generation\n• HCC and RAF scoring\n• Documentation guidelines\n• Coding accuracy checks\n\nPlease ask me about a specific code, denial, or coding scenario!',
      suggestions: ['Search ICD-10 codes', 'Help with denials', 'Check my accuracy', 'HCC guidance']
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-[#62d5e4] text-white rounded-full shadow-2xl hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-50 group"
        >
          <Sparkles className="w-7 h-7 group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-[#62d5e4] text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <div>
                <h3 className="font-medium">AI Medical Coding Assistant</h3>
                <p className="text-xs opacity-90">Powered by advanced AI</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={`flex items-start gap-2 ${
                    message.sender === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                        : 'bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700'
                    }`}
                  >
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-xs p-3 rounded-lg text-sm ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                        : 'bg-gray-50 text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="whitespace-pre-line">{message.text}</p>
                  </div>
                </div>
                
                {/* Quick Reply Suggestions */}
                {message.suggestions && message.sender === 'ai' && (
                  <div className="ml-9 mt-2 flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputText(suggestion);
                        }}
                        className="text-xs px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200 hover:bg-purple-100 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about coding..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="px-3 py-2 bg-[#62d5e4] text-white rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}