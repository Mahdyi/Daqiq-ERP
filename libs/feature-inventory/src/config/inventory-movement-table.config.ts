import type { DataTableColumn } from '@daqiq/ui';

import { inventoryMovementTypeLabel } from '../mappers/inventory-movement.mapper';
import type { InventoryMovement } from '../models/inventory-movement.model';

export function createInventoryMovementTableColumns(): readonly DataTableColumn<InventoryMovement>[] {
  return [
    {
      id: 'movementNumber',
      field: 'movementNumber',
      header: 'شماره سند',
      sortable: true
    },
    {
      id: 'movementType',
      field: 'movementType',
      header: 'نوع حرکت',
      formatter: (_value, row) => inventoryMovementTypeLabel(row.movementType)
    },
    {
      id: 'productName',
      field: 'productName',
      header: 'کالا',
      sortable: true
    },
    {
      id: 'from',
      header: 'از',
      valueAccessor: (row) => formatLocation(row.fromWarehouseName, row.fromStorageLocationName)
    },
    {
      id: 'to',
      header: 'به',
      valueAccessor: (row) => formatLocation(row.toWarehouseName, row.toStorageLocationName)
    },
    {
      id: 'quantity',
      field: 'quantity',
      header: 'مقدار',
      align: 'end',
      sortable: true,
      formatter: (_value, row) => formatQuantity(row.quantity)
    },
    {
      id: 'unitLabel',
      field: 'unitLabel',
      header: 'واحد'
    },
    {
      id: 'createdByEmail',
      field: 'createdByEmail',
      header: 'کاربر',
      formatter: (_value, row) => row.createdByEmail ?? '—'
    },
    {
      id: 'occurredAt',
      field: 'occurredAt',
      header: 'زمان',
      sortable: true,
      formatter: (_value, row) => row.occurredAt.toLocaleString('fa-IR')
    }
  ];
}

function formatLocation(warehouseName: string | null, locationName: string | null): string {
  if (!warehouseName) {
    return '—';
  }

  return locationName ? `${warehouseName} / ${locationName}` : warehouseName;
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits: 4
  }).format(value);
}
