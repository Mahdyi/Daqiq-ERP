import type { DataTableColumn } from '@daqiq/ui';
import type { StorageLocation } from '../models/storage-location.model';

export function createStorageLocationTableColumns(
  warehouseLabel: (id: string) => string,
  lookupLabel: (id: string | null) => string,
  locationLabel: (id: string | null) => string
): readonly DataTableColumn<StorageLocation>[] {
  return [
    { id: 'code', field: 'code', header: 'کد موقعیت', sortable: true },
    { id: 'name', field: 'name', header: 'نام موقعیت', sortable: true },
    { id: 'warehouseId', field: 'warehouseId', header: 'انبار', formatter: (_value, row) => warehouseLabel(row.warehouseId) },
    { id: 'locationTypeLookupValueId', field: 'locationTypeLookupValueId', header: 'نوع موقعیت', formatter: (_value, row) => lookupLabel(row.locationTypeLookupValueId) },
    { id: 'parentLocationId', field: 'parentLocationId', header: 'موقعیت والد', formatter: (_value, row) => locationLabel(row.parentLocationId) },
    { id: 'active', field: 'active', header: 'وضعیت', formatter: (_value, row) => row.active ? 'فعال' : 'غیرفعال' }
  ];
}
