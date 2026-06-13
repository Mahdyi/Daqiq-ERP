import { DataTableColumnAlign } from './data-table.types';

interface DataTableColumnBase<TData> {
  readonly id: string;
  readonly header: string;
  readonly align?: DataTableColumnAlign;
  readonly width?: string;
  readonly sortable?: boolean;
  readonly cellClass?: string;
  readonly formatter?: (value: unknown, row: TData) => string;
}

export type DataTableColumn<TData> = DataTableColumnBase<TData> &
  (
    | {
        readonly field: keyof TData;
        readonly valueAccessor?: never;
      }
    | {
        readonly field?: never;
        readonly valueAccessor: (row: TData) => unknown;
      }
  );
