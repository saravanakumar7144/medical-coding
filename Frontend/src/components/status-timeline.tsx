import { Check, Clock, AlertCircle, XCircle } from "lucide-react";
import { cn } from "./ui/utils";

export type ClaimStatus = 
  | "draft"
  | "submitted"
  | "ch_rejected"
  | "ch_fixed"
  | "payer_rejected"
  | "era_accepted"
  | "posted"
  | "completed";

interface StatusTimelineProps {
  currentStatus: ClaimStatus;
  compact?: boolean;
}

const timelineSteps = [
  { id: "submitted", label: "Submitted", shortLabel: "Submit" },
  { id: "ch_rejected", label: "CH Rejected", shortLabel: "CH Rej" },
  { id: "ch_fixed", label: "Fixed", shortLabel: "Fixed" },
  { id: "payer_rejected", label: "Payer Rejected", shortLabel: "Payer Rej" },
  { id: "era_accepted", label: "ERA Accept", shortLabel: "ERA" },
  { id: "posted", label: "Posted", shortLabel: "Posted" },
  { id: "completed", label: "Completed", shortLabel: "Done" },
] as const;

const statusOrder: Record<ClaimStatus, number> = {
  draft: 0,
  submitted: 1,
  ch_rejected: 2,
  ch_fixed: 3,
  payer_rejected: 4,
  era_accepted: 5,
  posted: 6,
  completed: 7,
};

export function StatusTimeline({ currentStatus, compact = false }: StatusTimelineProps) {
  const currentOrder = statusOrder[currentStatus];

  const getStepStatus = (stepId: string) => {
    const stepOrder = statusOrder[stepId as ClaimStatus];
    
    if (stepOrder < currentOrder) return "completed";
    if (stepOrder === currentOrder) return "current";
    return "pending";
  };

  const getStatusIcon = (stepId: string) => {
    const status = getStepStatus(stepId);
    
    // Handle error states
    if (stepId === "ch_rejected" && currentOrder >= 2) {
      return <XCircle className="w-4 h-4" />;
    }
    if (stepId === "payer_rejected" && currentOrder >= 4) {
      return <AlertCircle className="w-4 h-4" />;
    }
    
    if (status === "completed") return <Check className="w-4 h-4" />;
    if (status === "current") return <Clock className="w-4 h-4" />;
    return <div className="w-2 h-2 rounded-full bg-gray-300" />;
  };

  const getStatusColor = (stepId: string) => {
    const status = getStepStatus(stepId);
    
    // Error states
    if (stepId === "ch_rejected" && currentOrder >= 2) {
      return "text-red-600 bg-red-50 border-red-200";
    }
    if (stepId === "payer_rejected" && currentOrder >= 4) {
      return "text-orange-600 bg-orange-50 border-orange-200";
    }
    
    if (status === "completed") return "text-green-600 bg-green-50 border-green-200";
    if (status === "current") return "text-[#62d5e4] bg-cyan-50 border-[#62d5e4]";
    return "text-gray-400 bg-gray-50 border-gray-200";
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between gap-2">
        {timelineSteps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step indicator */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                  getStatusColor(step.id)
                )}
              >
                {getStatusIcon(step.id)}
              </div>
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  getStepStatus(step.id) === "pending" ? "text-gray-400" : "text-gray-700"
                )}
              >
                {compact ? step.shortLabel : step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < timelineSteps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 bg-gray-200 relative">
                <div
                  className={cn(
                    "absolute inset-0 transition-all",
                    statusOrder[step.id as ClaimStatus] < currentOrder
                      ? "bg-green-400"
                      : "bg-transparent"
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
