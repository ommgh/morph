"use client";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTamboComponentState, useTamboStreamStatus } from "@tambo-ai/react";
import * as React from "react";
import { z } from "zod/v3";
import { Circle, CheckCircle2, Clock, AlertCircle } from "lucide-react";

/**
 * Zod schema for individual todo item
 */
const todoItemSchema = z.object({
  id: z.string().describe("Unique identifier for the todo item"),
  title: z.string().describe("Title/description of the todo"),
  completed: z.boolean().optional().describe("Whether the todo is completed"),
  priority: z
    .enum(["low", "medium", "high"])
    .optional()
    .describe("Priority level of the todo"),
  dueDate: z
    .string()
    .optional()
    .describe("Due date in ISO format or readable string"),
  category: z.string().optional().describe("Category or tag for the todo"),
});

/**
 * Zod schema for TodoList
 */
export const todoListSchema = z.object({
  title: z.string().optional().describe("Title for the todo list"),
  items: z.array(todoItemSchema).describe("Array of todo items"),
  showCompleted: z
    .boolean()
    .optional()
    .describe("Whether to show completed items"),
  interactive: z
    .boolean()
    .optional()
    .describe("Whether users can toggle todo completion"),
});

export type TodoListProps = z.infer<typeof todoListSchema>;
type TodoItem = z.infer<typeof todoItemSchema>;

const priorityStyles = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const priorityIcons = {
  low: Circle,
  medium: Clock,
  high: AlertCircle,
};

/**
 * TodoList component for displaying task lists
 * Perfect for task management, project tracking, shopping lists, etc.
 */
export const TodoList = React.forwardRef<HTMLDivElement, TodoListProps>(
  ({ title, items = [], showCompleted = true, interactive = true }, ref) => {
    const { streamStatus, propStatus } = useTamboStreamStatus<TodoListProps>();
    const [completedIds, setCompletedIds] = useTamboComponentState<string[]>(
      "completedIds",
      items.filter((item) => item.completed).map((item) => item.id),
    );

    if (streamStatus.isPending) {
      return (
        <div
          ref={ref}
          className="w-full rounded-lg border border-border bg-card p-4"
        >
          <div className="text-sm text-muted-foreground animate-pulse">
            Loading todos...
          </div>
        </div>
      );
    }

    const toggleTodo = (id: string) => {
      if (!interactive) return;
      const current = completedIds ?? [];
      if (current.includes(id)) {
        setCompletedIds(current.filter((x) => x !== id));
      } else {
        setCompletedIds([...current, id]);
      }
    };

    const isCompleted = (item: TodoItem) =>
      completedIds?.includes(item.id) ?? item.completed ?? false;

    const visibleItems = showCompleted
      ? items
      : items.filter((item) => !isCompleted(item));

    const completedCount = items.filter(isCompleted).length;
    const totalCount = items.length;

    return (
      <div
        ref={ref}
        className="w-full rounded-lg border border-border bg-card overflow-hidden"
      >
        {(title || totalCount > 0) && (
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
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
            <span className="text-xs text-muted-foreground">
              {completedCount}/{totalCount} completed
            </span>
          </div>
        )}

        <div className="divide-y divide-border">
          {visibleItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {items.length === 0 ? "No items yet" : "All tasks completed! 🎉"}
            </div>
          ) : (
            visibleItems.map((item) => {
              const completed = isCompleted(item);
              const PriorityIcon = item.priority
                ? priorityIcons[item.priority]
                : null;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 transition-colors",
                    interactive && "hover:bg-muted/50 cursor-pointer",
                    completed && "opacity-60",
                  )}
                  onClick={() => toggleTodo(item.id)}
                >
                  {interactive ? (
                    <Checkbox
                      checked={completed}
                      onCheckedChange={() => toggleTodo(item.id)}
                      className="mt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        completed && "line-through text-muted-foreground",
                      )}
                    >
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {item.priority && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            priorityStyles[item.priority],
                          )}
                        >
                          {PriorityIcon && (
                            <PriorityIcon className="h-2.5 w-2.5 mr-0.5" />
                          )}
                          {item.priority}
                        </Badge>
                      )}
                      {item.category && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {item.category}
                        </Badge>
                      )}
                      {item.dueDate && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {item.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  },
);

TodoList.displayName = "TodoList";
