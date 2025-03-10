import { cn } from "@/lib/utils";
import { STEPS } from "../utils/statusUtils";

interface StepLabelsProps {
  currentStepIndex: number;
  getStatusText: (step: string) => string;
  type: "label" | "timestamp";
  getTimestamp?: (step: string) => string;
}

export const StepLabels = ({ currentStepIndex, getStatusText, type, getTimestamp }: StepLabelsProps) => {
  return (
    <div className="flex justify-between">
      {STEPS.map((step, index) => {
        const isActive = index <= currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const shouldShow = type === "label" ? 
          index <= currentStepIndex : // For labels, show only up to current step
          (type === "timestamp" && index <= currentStepIndex); // For timestamps, show only up to current step
        
        return (
          <div 
            key={`${type}-${step}`}
            className={cn(
              "w-[25%] text-xs",
              type === "label" ? (
                isCurrent 
                  ? "font-bold text-[#000000] dark:text-white" 
                  : "font-medium text-[#000000A6] dark:text-[#FFFFFFA6]"
              ) : (
                isCurrent
                  ? "font-medium text-[#000000] dark:text-white"
                  : "text-[#000000A6] dark:text-[#FFFFFFA6]"
              ),
              "text-center",
              !shouldShow && "invisible" // Make it invisible but preserve the space
            )}
          >
            {type === "label" ? (
              <div className="flex items-center justify-center gap-3">
                <div className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-full",
                  isCurrent
                    ? "bg-[#000000] dark:bg-white" // Active step circle colors
                    : "bg-[#e0e0e0] dark:bg-[#2a2a2b]" // Inactive step circle colors
                )}>
                  <span className={cn(
                    "text-xs font-medium",
                    isCurrent
                      ? "text-white dark:text-[#000000]" // Active step number colors
                      : "text-[#000000A6] dark:text-[#FFFFFFA6]" // Updated inactive step number colors
                  )}>
                    {index + 1}
                  </span>
                </div>
                <span className="relative">
                  {getStatusText(step)}
                </span>
              </div>
            ) : (
              getTimestamp?.(step)
            )}
          </div>
        );
      })}
    </div>
  );
};