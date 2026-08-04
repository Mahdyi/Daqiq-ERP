import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type {
  InventoryProductOptionRowDto,
  InventoryStorageLocationOptionRowDto,
  InventoryWarehouseOptionRowDto
} from '../dto/inventory-option-row.dto';
import type { InventoryOption } from '../models/inventory-transaction-form-value.model';

@Injectable()
export class InventoryReferenceDataService {
  private readonly api = inject(ApiClient);

  products(): Observable<readonly InventoryOption[]> {
    return this.api
      .get<readonly InventoryProductOptionRowDto[]>('products', {
        params: {
          select: 'id,sku,name,active,track_inventory',
          active: 'eq.true',
          track_inventory: 'eq.true',
          order: 'sku.asc'
        },
        responseShape: 'raw'
      })
      .pipe(
        map((rows) =>
          rows.map((row) => ({
            id: row.id,
            label: `${row.sku} - ${row.name}`
          }))
        )
      );
  }

  warehouses(): Observable<readonly InventoryOption[]> {
    return this.api
      .get<readonly InventoryWarehouseOptionRowDto[]>('warehouses', {
        params: {
          select: 'id,code,name,active',
          active: 'eq.true',
          order: 'code.asc'
        },
        responseShape: 'raw'
      })
      .pipe(
        map((rows) =>
          rows.map((row) => ({
            id: row.id,
            label: `${row.code} - ${row.name}`
          }))
        )
      );
  }

  storageLocations(): Observable<readonly (InventoryOption & { readonly warehouseId: string })[]> {
    return this.api
      .get<readonly InventoryStorageLocationOptionRowDto[]>('storage_locations', {
        params: {
          select: 'id,warehouse_id,code,name,active',
          active: 'eq.true',
          order: 'code.asc'
        },
        responseShape: 'raw'
      })
      .pipe(
        map((rows) =>
          rows.map((row) => ({
            id: row.id,
            warehouseId: row.warehouse_id,
            label: `${row.code} - ${row.name}`
          }))
        )
      );
  }
}
