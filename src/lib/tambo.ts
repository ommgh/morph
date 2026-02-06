/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import { Graph, graphSchema } from "@/components/tambo/graph";
import { SelectForm, selectFormSchema } from "@/components/tambo/select-form";
import { DataTable, dataTableSchema } from "@/components/tambo/data-table";
import { StatsCard, statsCardSchema } from "@/components/tambo/stats-card";
import {
  ProgressTracker,
  progressTrackerSchema,
} from "@/components/tambo/progress-tracker";
import { TodoList, todoListSchema } from "@/components/tambo/todo-list";
import {
  MetricsList,
  metricsListSchema,
} from "@/components/tambo/metrics-list";
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

import { fetchData } from "@/services/data-fetcher";

/**
 * tools
 *
 * This array contains all the Tambo tools that are registered for use within the application.
 * Each tool is defined with its name, description, and expected props. The tools
 * can be controlled by AI to dynamically fetch data based on user interactions.
 */

export const tools: TamboTool[] = [
  {
    name: "fetch_data",
    description: `Fetch data from any API URL. Use this tool when the user wants to retrieve data from an external API or URL. 
After fetching, analyze the response structure:
- If the data is an array of objects with consistent keys, use DataTable to display it
- If it's a single numeric value with context (like a count, amount, or score), use StatsCard
- If it's an array of items with completion status or tasks, use TodoList
- If it contains progress/goal data (current vs target values), use ProgressTracker
- If it's an object with multiple key-value pairs (stats, usage, metrics), use MetricsList
- If it contains time-series data or datasets suitable for visualization, use Graph
- For user choices or selections needed, use SelectForm`,
    tool: fetchData,
    inputSchema: z
      .object({
        url: z
          .string()
          .describe("The full URL of the API endpoint to fetch from"),
        method: z
          .enum(["GET", "POST", "PUT", "DELETE"])
          .optional()
          .describe("HTTP method to use (defaults to GET)"),
        authToken: z
          .string()
          .optional()
          .describe(
            "Optional Bearer token for Authorization header (without 'Bearer ' prefix)",
          ),
        contentType: z
          .enum([
            "application/json",
            "application/x-www-form-urlencoded",
            "text/plain",
          ])
          .optional()
          .describe("Content-Type header value (defaults to application/json)"),
        bodyJson: z
          .string()
          .optional()
          .describe(
            "Optional JSON string for request body in POST/PUT requests. Must be valid JSON.",
          ),
      })
      .describe("Parameters for fetching data from an API"),
    outputSchema: z.object({
      success: z.boolean(),
      data: z.unknown(),
      status: z.number(),
      dataType: z.enum(["array", "object", "primitive"]),
      itemCount: z.number().optional(),
      keys: z.array(z.string()).optional(),
      error: z.string().optional(),
    }),
  },
  // Add more tools here
];

/**
 * components
 *
 * This array contains all the Tambo components that are registered for use within the application.
 * Each component is defined with its name, description, and expected props. The components
 * can be controlled by AI to dynamically render UI elements based on user interactions.
 */
export const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "Use this when you want to display a chart. It supports bar, line, and pie charts. When you see data generally use this component. IMPORTANT: When asked to create a graph, always generate it first in the chat - do NOT add it directly to the canvas/dashboard. Let the user decide if they want to add it.",
    component: Graph,
    propsSchema: graphSchema,
  },
  {
    name: "SelectForm",
    description:
      "ALWAYS use this component instead of listing options as bullet points in text. Whenever you need to ask the user a question and would normally follow up with bullet points or numbered options, use this component instead. For yes/no or single-choice questions, use mode='single'. For questions where the user can select multiple options, use mode='multi' (default). Each group has a label (the question) and options (the choices). Examples: 'Would you like to continue?' with Yes/No options, or 'Which regions interest you?' with multiple region options.",
    component: SelectForm,
    propsSchema: selectFormSchema,
  },
  {
    name: "DataTable",
    description:
      "Use this component to display tabular data in rows and columns. Perfect for financial records, transaction history, user lists, inventory. First define columns with key and label, then provide rows where each row has a cells array of string values matching the column order. Example: columns=[{key:'name',label:'Name'},{key:'amount',label:'Amount'}], rows=[{cells:['John','$100']},{cells:['Jane','$200']}]. Convert all values to strings.",
    component: DataTable,
    propsSchema: dataTableSchema,
  },
  {
    name: "StatsCard",
    description:
      "Use this component to display a single key metric or statistic prominently. Perfect for dashboards showing metrics like total revenue, active users, steps walked, calories burned, or any single important number. Supports change indicators (up/down arrows with percentages), icons, and status variants (success/warning/danger). Use when you have one primary value to highlight with optional comparison to a previous period.",
    component: StatsCard,
    propsSchema: statsCardSchema,
  },
  {
    name: "ProgressTracker",
    description:
      "Use this component to display progress towards goals or targets. Perfect for fitness tracking (steps, calories, water intake), task completion percentages, quotas, or any scenario where you have current values vs target values. Shows progress bars with completion percentages. Use when data contains pairs of current/target values or goal-oriented metrics.",
    component: ProgressTracker,
    propsSchema: progressTrackerSchema,
  },
  {
    name: "TodoList",
    description:
      "Use this component to display task lists, to-do items, or any list of actionable items. Perfect for task management, shopping lists, project checklists, or API responses containing items with completion status. Supports priorities (low/medium/high), due dates, categories, and interactive checkbox toggling. Use when data represents a list of tasks or items that can be marked as complete/incomplete.",
    component: TodoList,
    propsSchema: todoListSchema,
  },
  {
    name: "MetricsList",
    description:
      "Use this component to display multiple key-value metrics in a list or grid format. Perfect for system stats, usage overview, API quota displays, account summaries, or any response with multiple related metrics. Supports icons, status indicators (warning/critical/success), change percentages, and different layout variants (list/grid/compact). Use when you have multiple related metrics to display together rather than individually.",
    component: MetricsList,
    propsSchema: metricsListSchema,
  },
  // Add more components here
];
