"use client";

import { cn } from "@/lib/utils";
import { useTamboStreamStatus } from "@tambo-ai/react";
import * as React from "react";
import { z } from "zod/v3";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Activity,
  Database,
  Wifi,
  Cpu,
  HardDrive,
  Clock,
  Users,
  Zap,
} from "lucide-react";

/**
 * Available icon types for metrics
 */
const iconMap = {
  info: Info,
  activity: Activity,
  database: Database,
  wifi: Wifi,
  cpu: Cpu,
  storage: HardDrive,
  clock: Clock,
  users: Users,
  zap: Zap,
} as const;

/**
 * Zod schema for individual metric item
 */
const metricItemSchema = z.object({
  label: z.string().describe("Label/name of the metric"),
  value: z.union([z.string(), z.number()]).describe("Value of the metric"),
  unit: z.string().optional().describe("Unit of measurement"),
  change: z.number().optional().describe("Percentage change"),
  icon: z
    .enum([
      "info",
      "activity",
      "database",
      "wifi",
      "cpu",
      "storage",
      "clock",
      "users",
      "zap",
    ])
    .optional()
    .describe("Icon for the metric"),
  status: z
    .enum(["normal", "warning", "critical", "success"])
    .optional()
    .describe("Status indicator for the metric"),
});

/**
 * Zod schema for MetricsList
 */
export const metricsListSchema = z.object({
  title: z.string().optional().describe("Title for the metrics list"),
  description: z
    .string()
    .optional()
    .describe("Optional description or subtitle"),
  metrics: z.array(metricItemSchema).describe("Array of metric items"),
  columns: z
    .enum(["1", "2", "3", "4"])
    .optional()
    .describe("Number of columns for grid layout"),
  variant: z
    .enum(["list", "grid", "compact"])
    .optional()
    .describe("Display variant"),
});

export type MetricsListProps = z.infer<typeof metricsListSchema>;

const statusStyles = {
  normal: "text-muted-foreground",
  warning: "text-yellow-600 dark:text-yellow-400",
  critical: "text-red-600 dark:text-red-400",
  success: "text-green-600 dark:text-green-400",
};

const statusDotStyles = {
  normal: "bg-muted-foreground",
  warning: "bg-yellow-500",
  critical: "bg-red-500",
  success: "bg-green-500",
};

/**
 * MetricsList component for displaying multiple key-value metrics
 * Perfect for system stats, usage overview, API responses with multiple fields, etc.
 */
export const MetricsList = React.forwardRef<HTMLDivElement, MetricsListProps>(
  (
    { title, description, metrics = [], columns = "2", variant = "list" },
    ref,
  ) => {
    const { streamStatus, propStatus } =
      useTamboStreamStatus<MetricsListProps>();

    if (streamStatus.isPending) {
      return (
        <div
          ref={ref}
          className="w-full rounded-lg border border-border bg-card p-4"
        >
          <div className="text-sm text-muted-foreground animate-pulse">
            Loading metrics...
          </div>
        </div>
      );
    }

    const isGrid = variant === "grid";
    const isCompact = variant === "compact";

    const columnClasses = {
      "1": "grid-cols-1",
      "2": "grid-cols-1 sm:grid-cols-2",
      "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      "4": "grid-cols-2 sm:grid-cols-4",
    };

    return (
      <div
        ref={ref}
        className="w-full rounded-lg border border-border bg-card overflow-hidden"
      >
        {(title || description) && (
          <div className="px-4 py-3 border-b border-border">
            {title && (
              <h3
                className={cn(
                  "text-sm font-semibold",
                  propStatus.title?.isStreaming && "animate-pulse",
                )}
              >
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>
        )}

        <div
          className={cn(
            isGrid || isCompact
              ? "grid gap-px bg-border"
              : "divide-y divide-border",
            isGrid && columnClasses[columns],
            isCompact && columnClasses[columns],
          )}
        >
          {metrics.map((metric, idx) => {
            const IconComponent = metric.icon ? iconMap[metric.icon] : null;
            const displayValue =
              typeof metric.value === "number"
                ? metric.value.toLocaleString()
                : metric.value;
            const status = metric.status ?? "normal";
            const hasChange = metric.change !== undefined;
            const isPositiveChange = hasChange && metric.change! > 0;
            const isNegativeChange = hasChange && metric.change! < 0;

            if (isGrid || isCompact) {
              return (
                <div
                  key={idx}
                  className={cn(
                    "bg-card",
                    isCompact ? "px-3 py-2" : "px-4 py-3",
                  )}
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    {IconComponent && (
                      <IconComponent className="h-3 w-3 shrink-0" />
                    )}
                    <span className="truncate">{metric.label}</span>
                    {metric.status && metric.status !== "normal" && (
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          statusDotStyles[status],
                        )}
                      />
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        isCompact ? "text-lg" : "text-xl",
                        "font-semibold",
                        statusStyles[status],
                      )}
                    >
                      {displayValue}
                    </span>
                    {metric.unit && (
                      <span className="text-xs text-muted-foreground">
                        {metric.unit}
                      </span>
                    )}
                    {hasChange && (
                      <span
                        className={cn(
                          "text-xs flex items-center gap-0.5 ml-1",
                          isPositiveChange &&
                            "text-green-600 dark:text-green-400",
                          isNegativeChange && "text-red-600 dark:text-red-400",
                          !isPositiveChange &&
                            !isNegativeChange &&
                            "text-muted-foreground",
                        )}
                      >
                        {isPositiveChange ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : isNegativeChange ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        {isPositiveChange ? "+" : ""}
                        {metric.change!.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            // List variant
            return (
              <div
                key={idx}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {IconComponent && (
                    <div className="rounded-full bg-muted p-1.5">
                      <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasChange && (
                    <span
                      className={cn(
                        "text-xs flex items-center gap-0.5",
                        isPositiveChange &&
                          "text-green-600 dark:text-green-400",
                        isNegativeChange && "text-red-600 dark:text-red-400",
                        !isPositiveChange &&
                          !isNegativeChange &&
                          "text-muted-foreground",
                      )}
                    >
                      {isPositiveChange ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : isNegativeChange ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                      {isPositiveChange ? "+" : ""}
                      {metric.change!.toFixed(1)}%
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      statusStyles[status],
                    )}
                  >
                    {displayValue}
                    {metric.unit && (
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        {metric.unit}
                      </span>
                    )}
                  </span>
                  {metric.status && metric.status !== "normal" && (
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        statusDotStyles[status],
                      )}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

MetricsList.displayName = "MetricsList";
