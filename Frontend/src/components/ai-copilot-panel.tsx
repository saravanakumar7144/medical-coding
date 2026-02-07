import { useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  FileCode,
  Shield,
  DollarSign,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Brain,
  Zap,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

export type CopilotContext = 
  | 'eligibility'
  | 'coding'
  | 'charge-entry'
  | 'rules'
  | 'submit'
  | 'acknowledgments'
  | 'era'
  | 'denials'
  | 'patient-billing';

interface CopilotSuggestion {
  id: string;
  title: string;
  description: string;
  confidence: number;
  action: string;
  expectedOutcome: string;
  estimatedTime?: string;
  type: 'fix' | 'optimize' | 'suggest' | 'generate';
  changes?: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
}

interface AICopilotPanelProps {
  context: CopilotContext;
  onApplySuggestion?: (suggestionId: string) => void;
}

// Context-specific suggestions
const suggestionsByContext: Record<CopilotContext, CopilotSuggestion[]> = {
  eligibility: [
    {
      id: 'cob-nudge',
      title: 'COB Configuration Detected',
      description: 'Secondary payer (BCBS) identified. Configure coordination of benefits for optimal reimbursement.',
      confidence: 92,
      action: 'Auto-configure Secondary Payer',
      expectedOutcome: 'Secondary claim auto-generated after primary payment',
      estimatedTime: '30 seconds',
      type: 'suggest',
    },
  ],
  coding: [
    {
      id: 'code-specificity',
      title: 'Increase Code Specificity',
      description: 'E11.9 can be more specific. E11.65 (Type 2 DM with hyperglycemia) may reduce denial risk by 23%.',
      confidence: 88,
      action: 'Upgrade to E11.65',
      expectedOutcome: '23% lower denial risk, $12 higher allowed amount',
      estimatedTime: '10 seconds',
      type: 'optimize',
      changes: [
        { field: 'Diagnosis Code 1', oldValue: 'E11.9', newValue: 'E11.65' },
      ],
    },
    {
      id: 'hcc-capture',
      title: 'HCC Capture Opportunity',
      description: 'E11.65 maps to HCC 19 (Diabetes without complications). RAF impact: +0.104',
      confidence: 95,
      action: 'Accept HCC Code',
      expectedOutcome: 'HCC 19 captured, RAF score +0.104',
      type: 'suggest',
    },
  ],
  'charge-entry': [],
  rules: [],
  submit: [],
  acknowledgments: [
    {
      id: 'explain-fix-aaa02',
      title: 'Clearinghouse Reject Explained',
      description: 'AAA02: Invalid/Missing Provider Identifier. NPI field in Box 24J is likely blank or incorrect.',
      confidence: 96,
      action: 'Auto-fix Provider NPI',
      expectedOutcome: 'Claim resubmitted with correct NPI 1234567890',
      estimatedTime: '15 seconds',
      type: 'fix',
      changes: [
        { field: 'Box 24J - Rendering Provider NPI', oldValue: '(blank)', newValue: '1234567890' },
      ],
    },
  ],
  era: [
    {
      id: 'era-triage',
      title: 'Payment Mismatch Detected',
      description: 'Expected $150, received $130. Likely incorrect contractual adjustment.',
      confidence: 84,
      action: 'Categorize as "Incorrect Amount"',
      expectedOutcome: 'Flagged for appeal, $20 recovery potential',
      type: 'suggest',
    },
    {
      id: 'refund-suggest',
      title: 'Overpayment Refund Required',
      description: 'Duplicate payment detected: $75.00 overpaid on 10/12/24',
      confidence: 98,
      action: 'Create Refund Request',
      expectedOutcome: 'Refund initiated, compliance maintained',
      type: 'generate',
    },
  ],
  denials: [
    {
      id: 'denial-playbook',
      title: 'CO-197 Resolution Playbook',
      description: 'Precertification absent. Standard resolution: Obtain retro-auth if within 30 days, otherwise bill patient.',
      confidence: 91,
      action: 'Apply Standard Playbook',
      expectedOutcome: 'End Action: Bill Patient (timely filing expired)',
      estimatedTime: '20 seconds',
      type: 'suggest',
    },
    {
      id: 'appeal-letter',
      title: 'Generate Appeal Letter',
      description: 'AI-drafted appeal with supporting evidence and policy citations.',
      confidence: 87,
      action: 'Generate Letter',
      expectedOutcome: 'Editable appeal letter ready for review',
      estimatedTime: '45 seconds',
      type: 'generate',
    },
  ],
  'patient-billing': [
    {
      id: 'patient-statement',
      title: 'Patient Statement Ready',
      description: 'Generate statement for $70.00 patient responsibility with payment options.',
      confidence: 99,
      action: 'Generate Statement',
      expectedOutcome: 'PDF statement with online payment link',
      estimatedTime: '10 seconds',
      type: 'generate',
    },
  ],
};

export function AICopilotPanel({ context, onApplySuggestion }: AICopilotPanelProps) {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<CopilotSuggestion | null>(null);

  const suggestions = suggestionsByContext[context] || [];

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApply = (suggestion: CopilotSuggestion) => {
    if (suggestion.changes && suggestion.changes.length > 0) {
      // Show diff preview
      setSelectedSuggestion(suggestion);
      setDiffModalOpen(true);
    } else {
      // Direct apply
      onApplySuggestion?.(suggestion.id);
    }
  };

  const confirmApply = () => {
    if (selectedSuggestion) {
      onApplySuggestion?.(selectedSuggestion.id);
      setDiffModalOpen(false);
      setSelectedSuggestion(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fix':
        return <Zap className="w-4 h-4 text-yellow-600" />;
      case 'optimize':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'suggest':
        return <Sparkles className="w-4 h-4 text-cyan-600" />;
      case 'generate':
        return <Brain className="w-4 h-4 text-purple-600" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'fix':
        return 'Quick Fix';
      case 'optimize':
        return 'Optimization';
      case 'suggest':
        return 'Suggestion';
      case 'generate':
        return 'Generate';
      default:
        return 'AI Assist';
    }
  };

  if (suggestions.length === 0) {
    return (
      <div className="h-full p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold">AI Copilot</h3>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-cyan-50 border border-purple-200 rounded-lg text-center">
          <Brain className="w-8 h-8 mx-auto text-purple-400 mb-2" />
          <p className="text-sm text-purple-900">No suggestions for this step</p>
          <p className="text-xs text-purple-700 mt-1">
            Continue working, and I'll provide assistance when needed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-cyan-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold">AI Copilot</h3>
          <Badge className="ml-auto bg-purple-100 text-purple-700" variant="secondary">
            {suggestions.length} {suggestions.length === 1 ? 'suggestion' : 'suggestions'}
          </Badge>
        </div>
        <p className="text-xs text-gray-600 mt-1">Context-aware assistance for this step</p>
      </div>

      {/* Suggestions */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {suggestions.map((suggestion) => {
          const isExpanded = expandedCards[suggestion.id];

          return (
            <Card key={suggestion.id} className="border-purple-200 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(suggestion.type)}
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(suggestion.type)}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm">{suggestion.title}</CardTitle>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 shrink-0" variant="secondary">
                    {suggestion.confidence}%
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-2">
                  {suggestion.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {/* Expected Outcome */}
                <div className="p-3 bg-green-50 border border-green-200 rounded text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-green-900">Expected Outcome</p>
                      <p className="text-green-700 mt-1">{suggestion.expectedOutcome}</p>
                    </div>
                  </div>
                </div>

                {/* Time Estimate */}
                {suggestion.estimatedTime && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Est. time: {suggestion.estimatedTime}</span>
                  </div>
                )}

                {/* Changes Preview */}
                {suggestion.changes && suggestion.changes.length > 0 && (
                  <Collapsible open={isExpanded} onOpenChange={() => toggleCard(suggestion.id)}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between text-xs h-auto py-2">
                        <span>Preview changes ({suggestion.changes.length})</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-3">
                      {suggestion.changes.map((change, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded text-xs space-y-2">
                          <p className="font-medium text-gray-700">{change.field}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 line-through">{change.oldValue}</span>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <span className="text-green-600 font-medium">{change.newValue}</span>
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Apply Button */}
                <Button
                  onClick={() => handleApply(suggestion)}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {suggestion.action}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Diff Preview Modal */}
      <Dialog open={diffModalOpen} onOpenChange={setDiffModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Changes</DialogTitle>
            <DialogDescription>
              Confirm the changes before applying to the claim
            </DialogDescription>
          </DialogHeader>

          {selectedSuggestion && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                <p className="text-sm font-medium text-purple-900">{selectedSuggestion.title}</p>
                <p className="text-xs text-purple-700 mt-1">{selectedSuggestion.description}</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Changes to be applied:</p>
                {selectedSuggestion.changes?.map((change, idx) => (
                  <div key={idx} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 border-b">
                      <p className="text-sm font-medium">{change.field}</p>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Current</p>
                        <div className="p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm text-red-900 font-mono">{change.oldValue}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">New</p>
                        <div className="p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm text-green-900 font-mono">{change.newValue}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-xs font-medium text-green-900">Expected Outcome</p>
                <p className="text-xs text-green-700 mt-1">{selectedSuggestion.expectedOutcome}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDiffModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmApply}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm & Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}