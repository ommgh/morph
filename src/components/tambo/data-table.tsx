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
import { useSafeTamboStreamStatus } from "@/hooks/use-safe-tambo";
import * as React from "react";
import { z } from "zod/v3";

/**
 * Zod schema for DataTable column definition
 */
const columnSchema = z.object({
  key: z.string().describe("Column identifier/header key"),
  label: z.string().describe("Display label for the column header"),
  align: z
    .enum(["left", "center", "right"])
    .optional()
    .describe("Text alignment for this column"),
});

/**
 * Zod schema for a table row - array of cell values matching column order
 */
const rowSchema = z.object({
  cells: z
    .array(z.string())
    .describe(
      "Array of cell values as strings, in the same order as columns. Convert numbers, dates, and other values to strings.",
    ),
});

/**
 * Zod schema for DataTable
 * Uses explicit row/cell structure instead of dynamic record types
 */
export const dataTableSchema = z.object({
  title: z.string().optional().describe("Optional title for the table"),
  columns: z
    .array(columnSchema)
    .describe(
      "Column definitions for the table headers. Define columns first, then provide row data matching this order.",
    ),
  rows: z
    .array(rowSchema)
    .describe(
      "Array of row objects, each containing a cells array. Cell values must be strings and match the column order.",
    ),
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
      rows = [],
      caption,
      striped = false,
      compact = false,
    },
    ref,
  ) => {
    const { streamStatus } = useSafeTamboStreamStatus<DataTableProps>();

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
              {columns.map((col, colIdx) => (
                <TableHead
                  key={col.key || colIdx}
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
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length || 1}
                  className="text-center text-muted-foreground py-8"
                >
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, rowIdx) => (
                <TableRow
                  key={rowIdx}
                  className={cn(striped && rowIdx % 2 === 1 && "bg-muted/50")}
                >
                  {(row?.cells ?? []).map((cell, cellIdx) => {
                    const col = columns[cellIdx];
                    return (
                      <TableCell
                        key={cellIdx}
                        className={cn(
                          compact && "py-1.5",
                          col?.align === "center" && "text-center",
                          col?.align === "right" && "text-right",
                        )}
                      >
                        {cell ?? "—"}
                      </TableCell>
                    );
                  })}
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
