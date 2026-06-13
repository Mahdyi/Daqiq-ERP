import { DataTableColumn } from './data-table-column.model';
import { DataTableSelectionMode, DataTableSortDirection } from './data-table.types';

export interface DataTableConfig<TData> {
  readonly columns: readonly DataTableColumn<TData>[];
  readonly selectionMode?: DataTableSelectionMode;
  readonly showRowActions?: boolean;
}

export interface DataTablePageEvent {
  readonly pageIndex: number;
  readonly pageSize: number;
}

export interface DataTableSort<TData> {
  readonly field: keyof TData;
  readonly direction: DataTableSortDirection;
}

export interface DataTableRowContext<TData> {
  readonly $implicit: TData;
  readonly row: TData;
  readonly rowIndex: number;
}

export interface DataTableLabels {
  readonly loading: string;
  readonly empty: string;
  readonly actions: string;
  readonly previousPage: string;
  readonly nextPage: string;
  readonly page: string;
  readonly of: string;
}

export const DEFAULT_DATA_TABLE_LABELS: DataTableLabels = {
  loading: 'در حال بارگذاری',
  empty: 'داده‌ای برای نمایش وجود ندارد.',
  actions: 'عملیات',
  previousPage: 'صفحه قبل',
  nextPage: 'صفحه بعد',
  page: 'صفحه',
  of: 'از'
};
