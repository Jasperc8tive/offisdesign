'use client';

import * as React from 'react';
import { Checkbox, Skeleton, Stack, Text } from '@offisdesign/ui';
import { cn } from '@offisdesign/utils';

export interface Column<T> {
  key: string;
  header: string;
  /** Optional fixed width. */
  width?: string;
  render: (row: T) => React.ReactNode;
}

interface Props<T> {
  rows: T[] | undefined;
  columns: Column<T>[];
  isLoading?: boolean;
  isError?: boolean;
  emptyText?: string;
  /** When provided, renders a leading checkbox column for bulk selection. */
  selection?: {
    rowKey: (row: T) => string;
    selectedIds: Set<string>;
    onChange: (next: Set<string>) => void;
  };
  /** Per-row click handler — usually navigation to a detail page. */
  onRowClick?: (row: T) => void;
}

/**
 * Minimal admin data table. Columns are declared at the call site; the
 * component owns layout, hover state, and bulk selection.
 */
export function DataTable<T>({
  rows,
  columns,
  isLoading,
  isError,
  emptyText = 'No results.',
  selection,
  onRowClick,
}: Props<T>) {
  if (isLoading) {
    return (
      <Stack gap={2} aria-label="Loading">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </Stack>
    );
  }
  if (isError) {
    return <Text tone="primary">Could not load this list.</Text>;
  }
  if (!rows || rows.length === 0) {
    return <Text tone="muted">{emptyText}</Text>;
  }

  const allSelected =
    selection !== undefined &&
    rows.length > 0 &&
    rows.every((r) => selection.selectedIds.has(selection.rowKey(r)));

  function toggleAll() {
    if (!selection) return;
    if (allSelected) selection.onChange(new Set());
    else selection.onChange(new Set(rows!.map((r) => selection.rowKey(r))));
  }

  function toggleRow(id: string) {
    if (!selection) return;
    const next = new Set(selection.selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selection.onChange(next);
  }

  return (
    <div className="border-default overflow-hidden rounded-md border">
      <table className="w-full border-collapse text-left">
        <thead className="bg-canvas-subtle text-secondary border-default border-b">
          <tr>
            {selection && (
              <th className="w-10 px-3 py-2">
                <Checkbox aria-label="Select all" checked={allSelected} onChange={toggleAll} />
              </th>
            )}
            {columns.map((c) => (
              <th
                key={c.key}
                className="font-body text-body-sm px-3 py-2 font-semibold"
                style={c.width ? { width: c.width } : undefined}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = selection?.rowKey(row);
            const selected = id !== undefined && selection!.selectedIds.has(id);
            return (
              <tr
                key={id ?? Math.random()}
                className={cn(
                  'border-default hover:bg-primary-subtle/40 border-b transition-colors last:border-b-0',
                  selected && 'bg-primary-subtle/60',
                  onRowClick && 'cursor-pointer',
                )}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('input,button,a')) return;
                  onRowClick?.(row);
                }}
              >
                {selection && (
                  <td className="px-3 py-2">
                    <Checkbox
                      aria-label="Select row"
                      checked={selected}
                      onChange={() => toggleRow(id!)}
                    />
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className="font-body text-body-sm px-3 py-2">
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
