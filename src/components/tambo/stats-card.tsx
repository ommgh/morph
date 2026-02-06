"use client";

import { cn } from "@/lib/utils";
import { useTamboStreamStatus } from "@tambo-ai/react";
import * as React from "react";
import { z } from "zod/v3";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  DollarSign,
  Users,
  BarChart3,
  Zap,
  Heart,
  Target,
  Clock,
  Flame,
} from "lucide-react";

/**
 * Available icon types for StatsCard
 */
const iconMap = {
  activity: Activity,
  dollar: DollarSign,
  users: Users,
  chart: BarChart3,
  zap: Zap,
  heart: Heart,
  target: Target,
  clock: Clock,
  flame: Flame,
  trending_up: TrendingUp,
  trending_down: TrendingDown,
} as const;

/**
 * Zod schema for StatsCard
 */
export const statsCardSchema = z.object({
  title: z.string().describe("Title/label for the stat"),
  value: z
    .union([z.string(), z.number()])
    .describe("The main value to display"),
  change: z
    .number()
    .optional()
    .describe("Percentage change from previous period (positive or negative)"),
  changeLabel: z
    .string()
    .optional()
    .describe("Label for the change, e.g., 'from last month'"),
  icon: z
    .enum([
      "activity",
      "dollar",
      "users",
      "chart",
      "zap",
      "heart",
      "target",
      "clock",
      "flame",
      "trending_up",
      "trending_down",
    ])
    .optional()
    .describe("Icon to display with the stat"),
  suffix: z
    .string()
    .optional()
    .describe("Suffix for the value, e.g., 'steps', 'kcal', '%'"),
  variant: z
    .enum(["default", "success", "warning", "danger"])
    .optional()
    .describe("Color variant based on the stat status"),
});

export type StatsCardProps = z.infer<typeof statsCardSchema>;

const variantStyles = {
  default: "border-border",
  success: "border-green-500/30 bg-green-500/5",
  warning: "border-yellow-500/30 bg-yellow-500/5",
  danger: "border-red-500/30 bg-red-500/5",
};

const iconVariantStyles = {
  default: "bg-muted text-muted-foreground",
  success: "bg-green-500/10 text-green-600 dark:text-green-400",
  warning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
};

/**
 * StatsCard component for displaying single metrics
 * Perfect for dashboards showing steps, calories, revenue, user counts, etc.
 */
export const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  (
    {
      title,
      value,
      change,
      changeLabel = "from last period",
      icon,
      suffix,
      variant = "default",
    },
    ref,
  ) => {
    const { streamStatus, propStatus } = useTamboStreamStatus<StatsCardProps>();

    if (streamStatus.isPending) {
      return (
        <div
          ref={ref}
          className="rounded-lg border border-border bg-card p-4 min-w-[180px]"
        >
          <div className="text-sm text-muted-foreground animate-pulse">
            Loading...
          </div>
        </div>
      );
    }

    const IconComponent = icon ? iconMap[icon] : null;
    const displayValue =
      typeof value === "number" ? value.toLocaleString() : value;
    const isPositiveChange = change !== undefined && change > 0;
    const isNegativeChange = change !== undefined && change < 0;

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card p-4 min-w-[180px] transition-colors",
          variantStyles[variant],
        )}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p
              className={cn(
                "text-sm font-medium text-muted-foreground",
                propStatus.title?.isStreaming && "animate-pulse",
              )}
            >
              {title}
            </p>
            <p
              className={cn(
                "text-2xl font-bold tracking-tight",
                propStatus.value?.isStreaming && "animate-pulse",
              )}
            >
              {displayValue}
              {suffix && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {suffix}
                </span>
              )}
            </p>
          </div>
          {IconComponent && (
            <div className={cn("rounded-full p-2", iconVariantStyles[variant])}>
              <IconComponent className="h-4 w-4" />
            </div>
          )}
        </div>

        {change !== undefined && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            {isPositiveChange ? (
              <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
            ) : isNegativeChange ? (
              <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
            ) : (
              <Minus className="h-3 w-3 text-muted-foreground" />
            )}
            <span
              className={cn(
                "font-medium",
                isPositiveChange && "text-green-600 dark:text-green-400",
                isNegativeChange && "text-red-600 dark:text-red-400",
                !isPositiveChange &&
                  !isNegativeChange &&
                  "text-muted-foreground",
              )}
            >
              {isPositiveChange ? "+" : ""}
              {change.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">{changeLabel}</span>
          </div>
        )}
      </div>
    );
  },
);

StatsCard.displayName = "StatsCard";
