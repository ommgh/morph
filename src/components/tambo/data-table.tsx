"use client";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTamboStreamStatus } from "@tambo-ai/react";
import * as React from "react";
import { z } from "zod/v3";

/**
 * Zod schema for DataTable column definition
 */
const columnSchema = z.object({
  key: z.string().describe("The key/property name in the data object"),
  label: z.string().describe("Display label for the column header"),
  align: z
    .enum(["left", "center", "right"])
    .optional()
    .describe("Text alignment for this column"),
});

/**
 * Zod schema for DataTable
 */
export const dataTableSchema = z.object({
  title: z.string().optional().describe("Optional title for the table"),
  columns: z.array(columnSchema).describe("Column definitions for the table"),
  data: z
    .array(z.record(z.unknown()))
    .describe("Array of data objects to display in the table"),
  caption: z.string().optional().describe("Optional table caption/description"),
  striped: z
    .boolean()
    .optional()
    .describe("Whether to show alternating row colors"),
  compact: z.boolean().optional().describe("Whether to use compact row height"),
});

export type DataTableProps = z.infer<typeof dataTableSchema>;

/**
 * DataTable component for displaying tabular data
 * Perfect for financial records, user lists, transaction history, etc.
 */
export const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  (
    {
      title,
      columns = [],
      data = [],
      caption,
      striped = false,
      compact = false,
    },
    ref,
  ) => {
    const { streamStatus } = useTamboStreamStatus<DataTableProps>();

    if (streamStatus.isPending) {
      return (
        <div
          ref={ref}
          className="w-full rounded-lg border border-border bg-card p-4"
        >
          <div className="text-sm text-muted-foreground animate-pulse">
            Loading table data...
          </div>
        </div>
      );
    }

    const formatValue = (value: unknown): React.ReactNode => {
      if (value === null || value === undefined) return "—";
      if (typeof value === "boolean") return value ? "Yes" : "No";
      if (typeof value === "number") {
        // Format numbers nicely
        return value.toLocaleString();
      }
      if (typeof value === "object") {
        return JSON.stringify(value);
      }
      return String(value);
    };

    return (
      <div ref={ref} className="w-full rounded-lg border border-border bg-card">
        {title && (
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">{title}</h3>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right",
                  )}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground py-8"
                >
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => (
                <TableRow
                  key={idx}
                  className={cn(striped && idx % 2 === 1 && "bg-muted/50")}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        compact && "py-1.5",
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right",
                      )}
                    >
                      {formatValue(row[col.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {caption && (
          <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
            {caption}
          </div>
        )}
      </div>
    );
  },
);

DataTable.displayName = "DataTable";
