import type { DataTableColumn } from '@daqiq/ui';
import type { Warehouse } from '../models/warehouse.model';

export function createWarehouseTableColumns(
  lookupLabel: (id: string | null) => string
): readonly DataTableColumn<Warehouse>[] {
  return [
    { id: 'code', field: 'code', header: 'کد انبار', sortable: true },
    { id: 'name', field: 'name', header: 'نام انبار', sortable: true },
    { id: 'warehouseTypeLookupValueId', field: 'warehouseTypeLookupValueId', header: 'نوع انبار', formatter: (_value, row) => lookupLabel(row.warehouseTypeLookupValueId) },
    { id: 'responsiblePerson', field: 'responsiblePerson', header: 'مسئول', formatter: (_value, row) => row.responsiblePerson ?? '—' },
    { id: 'phone', field: 'phone', header: 'شماره تماس', formatter: (_value, row) => row.phone ?? '—' },
    { id: 'active', field: 'active', header: 'وضعیت', formatter: (_value, row) => row.active ? 'فعال' : 'غیرفعال' }
  ];
}
