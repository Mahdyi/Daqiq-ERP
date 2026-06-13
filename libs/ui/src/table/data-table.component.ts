import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  input,
  output
} from '@angular/core';

import { DataTableColumn } from './data-table-column.model';
import {
  DEFAULT_DATA_TABLE_LABELS,
  DataTableLabels,
  DataTablePageEvent,
  DataTableRowContext,
  DataTableSort
} from './data-table.model';
import { DataTableRowKey, DataTableSelectionMode } from './data-table.types';

@Component({
  selector: 'daqiq-data-table',
  imports: [NgTemplateOutlet],
  template: `
    <div class="ui-data-table">
      <div class="ui-data-table__viewport">
        <table>
          <thead>
            <tr>
              @if (selectionMode() !== 'none') {
                <th class="ui-data-table__selection-column" scope="col"></th>
              }

              @for (column of columns(); track column.id) {
                <th
                  scope="col"
                  [class]="'ui-data-table__align-' + (column.align ?? 'start')"
                  [style.width]="column.width ?? null"
                >
                  @if (isSortable(column)) {
                    <button
                      class="ui-data-table__sort-button"
                      type="button"
                      (click)="toggleSort(column)"
                    >
                      <span>{{ column.header }}</span>
                      <i [class]="sortIcon(column)" aria-hidden="true"></i>
                    </button>
                  } @else {
                    {{ column.header }}
                  }
                </th>
              }

              @if (rowActionsTemplate()) {
                <th class="ui-data-table__actions-column" scope="col">{{ labels().actions }}</th>
              }
            </tr>
          </thead>

          <tbody>
            @if (loading()) {
              <tr>
                <td class="ui-data-table__state" [attr.colspan]="displayedColumnCount()">
                  <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
                  <span>{{ labels().loading }}</span>
                </td>
              </tr>
            } @else if (rows().length === 0) {
              <tr>
                <td class="ui-data-table__state" [attr.colspan]="displayedColumnCount()">
                  {{ labels().empty }}
                </td>
              </tr>
            } @else {
              @for (row of rows(); track trackRow(row, $index); let rowIndex = $index) {
                <tr
                  [class.ui-data-table__row--selected]="isSelected(row, rowIndex)"
                  (click)="activateRow(row, rowIndex)"
                >
                  @if (selectionMode() !== 'none') {
                    <td class="ui-data-table__selection-column">
                      <input
                        [type]="selectionMode() === 'multiple' ? 'checkbox' : 'radio'"
                        [name]="selectionMode() === 'single' ? selectionName() : null"
                        [checked]="isSelected(row, rowIndex)"
                        aria-label="انتخاب ردیف"
                        (click)="$event.stopPropagation()"
                        (change)="toggleSelection(row, rowIndex)"
                      />
                    </td>
                  }

                  @for (column of columns(); track column.id) {
                    <td
                      [class]="
                        'ui-data-table__align-' +
                        (column.align ?? 'start') +
                        (column.cellClass ? ' ' + column.cellClass : '')
                      "
                    >
                      {{ renderCell(row, column) }}
                    </td>
                  }

                  @if (rowActionsTemplate(); as actionsTemplate) {
                    <td class="ui-data-table__actions-column" (click)="$event.stopPropagation()">
                      <ng-container
                        [ngTemplateOutlet]="actionsTemplate"
                        [ngTemplateOutletContext]="rowContext(row, rowIndex)"
                      />
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <footer class="ui-data-table__footer">
        <span>
          {{ labels().page }} {{ pageIndex() + 1 }} {{ labels().of }} {{ pageCount() }}
        </span>

        <div class="ui-data-table__pager">
          <button
            type="button"
            [disabled]="!canGoPrevious()"
            [attr.aria-label]="labels().previousPage"
            (click)="goToPreviousPage()"
          >
            <i class="pi pi-chevron-right" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            [disabled]="!canGoNext()"
            [attr.aria-label]="labels().nextPage"
            (click)="goToNextPage()"
          >
            <i class="pi pi-chevron-left" aria-hidden="true"></i>
          </button>
        </div>
      </footer>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .ui-data-table {
      overflow: hidden;
      border: 1px solid var(--erp-border-color, #e2e8f0);
      border-radius: var(--erp-layout-radius-md, 0.5rem);
      background: var(--erp-card-bg, #fff);
    }

    .ui-data-table__viewport {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: auto;
    }

    th,
    td {
      border-block-end: 1px solid var(--erp-border-color, #e2e8f0);
      padding: 0.75rem 1rem;
      vertical-align: middle;
      white-space: nowrap;
    }

    th {
      background: var(--erp-surface-page, #f8fafc);
      color: var(--erp-text-muted-color, #64748b);
      font-size: var(--erp-font-size-sm, 0.8125rem);
      font-weight: var(--erp-font-weight-semibold, 600);
    }

    tbody tr {
      cursor: default;
      transition: background-color var(--erp-transition-duration, 180ms) ease;
    }

    tbody tr:hover,
    .ui-data-table__row--selected {
      background: var(--erp-surface-hover, #eff6ff);
    }

    tbody tr:last-child td {
      border-block-end: 0;
    }

    .ui-data-table__selection-column,
    .ui-data-table__actions-column {
      width: 1%;
      text-align: center;
    }

    .ui-data-table__align-start {
      text-align: start;
    }

    .ui-data-table__align-center {
      text-align: center;
    }

    .ui-data-table__align-end {
      text-align: end;
    }

    .ui-data-table__sort-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      font: inherit;
    }

    .ui-data-table__state {
      height: 8rem;
      color: var(--erp-text-muted-color, #64748b);
      text-align: center;
    }

    .ui-data-table__state i {
      margin-inline-end: 0.5rem;
    }

    .ui-data-table__footer {
      display: flex;
      min-height: 3.25rem;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border-block-start: 1px solid var(--erp-border-color, #e2e8f0);
      color: var(--erp-text-muted-color, #64748b);
      padding: 0.5rem 1rem;
    }

    .ui-data-table__pager {
      display: flex;
      gap: 0.375rem;
    }

    .ui-data-table__pager button {
      display: inline-grid;
      width: 2.25rem;
      height: 2.25rem;
      place-items: center;
      border: 1px solid var(--erp-border-color, #e2e8f0);
      border-radius: 0.375rem;
      background: var(--erp-surface-ground, #fff);
      color: var(--erp-text-color, #172033);
      cursor: pointer;
    }

    .ui-data-table__pager button:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent<TData extends object> {
  readonly rows = input<readonly TData[]>([]);
  readonly columns = input.required<readonly DataTableColumn<TData>[]>();
  readonly loading = input(false);
  readonly totalRecords = input(0);
  readonly pageIndex = input(0);
  readonly pageSize = input(20);
  readonly sort = input<DataTableSort<TData> | null>(null);
  readonly selectionMode = input<DataTableSelectionMode>('none');
  readonly selectedRows = input<readonly TData[]>([]);
  readonly rowKey = input<DataTableRowKey<TData> | null>(null);
  readonly rowActionsTemplate = input<TemplateRef<DataTableRowContext<TData>> | null>(null);
  readonly labels = input<DataTableLabels>(DEFAULT_DATA_TABLE_LABELS);
  readonly selectionName = input('daqiq-data-table-selection');

  readonly pageChange = output<DataTablePageEvent>();
  readonly sortChange = output<DataTableSort<TData> | null>();
  readonly selectionChange = output<readonly TData[]>();
  readonly rowActivated = output<TData>();

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.totalRecords() / Math.max(1, this.pageSize())))
  );
  protected readonly canGoPrevious = computed(() => this.pageIndex() > 0);
  protected readonly canGoNext = computed(
    () => this.pageIndex() + 1 < this.pageCount() && this.totalRecords() > 0
  );
  protected readonly displayedColumnCount = computed(
    () =>
      this.columns().length +
      (this.selectionMode() === 'none' ? 0 : 1) +
      (this.rowActionsTemplate() ? 1 : 0)
  );

  protected renderCell(row: TData, column: DataTableColumn<TData>): string {
    const value =
      'valueAccessor' in column && column.valueAccessor
        ? column.valueAccessor(row)
        : row[column.field];

    if (column.formatter) {
      return column.formatter(value, row);
    }

    if (value instanceof Date) {
      return value.toLocaleDateString('fa-IR');
    }

    return value === null || value === undefined ? '' : String(value);
  }

  protected isSortable(column: DataTableColumn<TData>): boolean {
    return column.sortable === true && 'field' in column && column.field !== undefined;
  }

  protected toggleSort(column: DataTableColumn<TData>): void {
    if (!this.isSortable(column) || !('field' in column) || column.field === undefined) {
      return;
    }

    const currentSort = this.sort();

    if (!currentSort || currentSort.field !== column.field) {
      this.sortChange.emit({
        field: column.field,
        direction: 'asc'
      });
      return;
    }

    if (currentSort.direction === 'asc') {
      this.sortChange.emit({
        field: column.field,
        direction: 'desc'
      });
      return;
    }

    this.sortChange.emit(null);
  }

  protected sortIcon(column: DataTableColumn<TData>): string {
    if (!('field' in column) || column.field === undefined || this.sort()?.field !== column.field) {
      return 'pi pi-sort-alt';
    }

    return this.sort()?.direction === 'asc' ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down';
  }

  protected activateRow(row: TData, rowIndex: number): void {
    this.rowActivated.emit(row);

    if (this.selectionMode() !== 'none') {
      this.toggleSelection(row, rowIndex);
    }
  }

  protected toggleSelection(row: TData, rowIndex: number): void {
    const mode = this.selectionMode();

    if (mode === 'none') {
      return;
    }

    if (mode === 'single') {
      this.selectionChange.emit(this.isSelected(row, rowIndex) ? [] : [row]);
      return;
    }

    const selectedRows = this.selectedRows();
    const nextSelection = this.isSelected(row, rowIndex)
      ? selectedRows.filter(
          (selectedRow, selectedIndex) =>
            !this.rowsMatch(row, rowIndex, selectedRow, selectedIndex)
        )
      : [...selectedRows, row];

    this.selectionChange.emit(nextSelection);
  }

  protected isSelected(row: TData, rowIndex: number): boolean {
    return this.selectedRows().some((selectedRow, selectedIndex) =>
      this.rowsMatch(row, rowIndex, selectedRow, selectedIndex)
    );
  }

  protected trackRow(row: TData, rowIndex: number): string | number | TData {
    return this.resolveRowIdentity(row, rowIndex);
  }

  protected rowContext(row: TData, rowIndex: number): DataTableRowContext<TData> {
    return {
      $implicit: row,
      row,
      rowIndex
    };
  }

  protected goToPreviousPage(): void {
    if (!this.canGoPrevious()) {
      return;
    }

    this.emitPage(this.pageIndex() - 1);
  }

  protected goToNextPage(): void {
    if (!this.canGoNext()) {
      return;
    }

    this.emitPage(this.pageIndex() + 1);
  }

  private emitPage(pageIndex: number): void {
    this.pageChange.emit({
      pageIndex,
      pageSize: this.pageSize()
    });
  }

  private rowsMatch(
    first: TData,
    firstIndex: number,
    second: TData,
    secondIndex: number
  ): boolean {
    if (!this.rowKey()) {
      return first === second;
    }

    return (
      this.resolveRowIdentity(first, firstIndex) ===
      this.resolveRowIdentity(second, secondIndex)
    );
  }

  private resolveRowIdentity(row: TData, rowIndex: number): string | number | TData {
    const rowKey = this.rowKey();

    if (typeof rowKey === 'function') {
      return rowKey(row, rowIndex);
    }

    if (rowKey !== null) {
      const value = row[rowKey];

      if (typeof value === 'string' || typeof value === 'number') {
        return value;
      }
    }

    return row;
  }
}
