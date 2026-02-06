"use client";

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useSafeTamboStreamStatus } from "@/hooks/use-safe-tambo";
import * as React from "react";
import { z } from "zod/v3";
import { CheckCircle2, Circle, Target } from "lucide-react";

/**
 * Zod schema for individual progress item
 */
const progressItemSchema = z.object({
  label: z.string().describe("Label for the progress item"),
  current: z.number().describe("Current value"),
  target: z.number().describe("Target/goal value"),
  unit: z
    .string()
    .optional()
    .describe("Unit of measurement, e.g., 'steps', 'kcal'"),
  color: z
    .enum(["default", "blue", "green", "orange", "red", "purple"])
    .optional()
    .describe("Color theme for the progress bar"),
});

/**
 * Zod schema for ProgressTracker
 */
export const progressTrackerSchema = z.object({
  title: z.string().optional().describe("Title for the progress tracker"),
  items: z
    .array(progressItemSchema)
    .describe("Array of progress items to track"),
  showPercentage: z
    .boolean()
    .optional()
    .describe("Whether to show percentage completion"),
  variant: z
    .enum(["default", "compact", "detailed"])
    .optional()
    .describe("Display variant for the progress items"),
});

export type ProgressTrackerProps = z.infer<typeof progressTrackerSchema>;

const colorStyles = {
  default: "[&>[data-slot=progress-indicator]]:bg-primary",
  blue: "[&>[data-slot=progress-indicator]]:bg-blue-500",
  green: "[&>[data-slot=progress-indicator]]:bg-green-500",
  orange: "[&>[data-slot=progress-indicator]]:bg-orange-500",
  red: "[&>[data-slot=progress-indicator]]:bg-red-500",
  purple: "[&>[data-slot=progress-indicator]]:bg-purple-500",
};

/**
 * ProgressTracker component for displaying goal progress
 * Perfect for fitness tracking, task completion, goals, quotas, etc.
 */
export const ProgressTracker = React.forwardRef<
  HTMLDivElement,
  ProgressTrackerProps
>(({ title, items = [], showPercentage = true, variant = "default" }, ref) => {
  const { streamStatus, propStatus } =
    useSafeTamboStreamStatus<ProgressTrackerProps>();

  if (streamStatus.isPending) {
    return (
      <div
        ref={ref}
        className="w-full rounded-lg border border-border bg-card p-4"
      >
        <div className="text-sm text-muted-foreground animate-pulse">
          Loading progress...
        </div>
      </div>
    );
  }

  const isCompact = variant === "compact";
  const isDetailed = variant === "detailed";

  return (
    <div
      ref={ref}
      className="w-full rounded-lg border border-border bg-card p-4 space-y-4"
    >
      {title && (
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <h3
            className={cn(
              "text-sm font-semibold",
              propStatus.title?.isStreaming && "animate-pulse",
            )}
          >
            {title}
          </h3>
        </div>
      )}

      <div className={cn("space-y-4", isCompact && "space-y-2")}>
        {(items ?? []).map((item, idx) => {
          const current = item.current ?? 0;
          const target = item.target ?? 1; // Avoid division by zero
          const percentage = Math.min((current / target) * 100, 100);
          const isComplete = current >= target;
          const color = item.color ?? "default";

          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="text-muted-foreground">
                  <span
                    className={cn(
                      "font-semibold",
                      isComplete && "text-green-600 dark:text-green-400",
                    )}
                  >
                    {current.toLocaleString()}
                  </span>
                  <span className="mx-1">/</span>
                  <span>{target.toLocaleString()}</span>
                  {item.unit && <span className="ml-1">{item.unit}</span>}
                  {showPercentage && !isCompact && (
                    <span className="ml-2 text-xs">
                      ({percentage.toFixed(0)}%)
                    </span>
                  )}
                </div>
              </div>

              <Progress
                value={percentage}
                className={cn("h-2", colorStyles[color])}
              />

              {isDetailed && (
                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span>
                    {isComplete
                      ? "Goal reached! 🎉"
                      : `${(target - current).toLocaleString()} ${item.unit || "more"} to go`}
                  </span>
                  {!isComplete && percentage >= 75 && (
                    <span className="text-orange-600 dark:text-orange-400">
                      Almost there!
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

ProgressTracker.displayName = "ProgressTracker";
