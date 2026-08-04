import type { DataTableColumn } from '@daqiq/ui';

import type { InventoryBalance } from '../models/inventory-balance.model';

export function createInventoryBalanceTableColumns(): readonly DataTableColumn<InventoryBalance>[] {
  return [
    {
      id: 'productSku',
      field: 'productSku',
      header: 'کد کالا',
      sortable: true
    },
    {
      id: 'productName',
      field: 'productName',
      header: 'کالا',
      sortable: true
    },
    {
      id: 'warehouseName',
      field: 'warehouseName',
      header: 'انبار',
      sortable: true
    },
    {
      id: 'storageLocationName',
      field: 'storageLocationName',
      header: 'موقعیت',
      formatter: (_value, row) => formatNullable(row.storageLocationName)
    },
    {
      id: 'quantityOnHand',
      field: 'quantityOnHand',
      header: 'موجودی',
      align: 'end',
      sortable: true,
      formatter: (_value, row) => formatQuantity(row.quantityOnHand)
    },
    {
      id: 'unitLabel',
      field: 'unitLabel',
      header: 'واحد'
    },
    {
      id: 'updatedAt',
      field: 'updatedAt',
      header: 'آخرین به‌روزرسانی',
      sortable: true,
      formatter: (_value, row) => row.updatedAt.toLocaleString('fa-IR')
    }
  ];
}

function formatNullable(value: string | null): string {
  return value ?? '—';
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits: 4
  }).format(value);
}
