export type DataTableSelectionMode = 'none' | 'single' | 'multiple';

export type DataTableSortDirection = 'asc' | 'desc';

export type DataTableColumnAlign = 'start' | 'center' | 'end';

export type DataTableRowKey<TData> =
  | keyof TData
  | ((row: TData, rowIndex: number) => string | number);
