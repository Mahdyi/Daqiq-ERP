import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type {
  ProductReferenceRowDto,
  CustomerReferenceRowDto,
  WarehouseReferenceRowDto
} from '../dto/sales-order-reference-row.dto';
import type {
  SalesOrderOption,
  SalesOrderProductOption
} from '../models/sales-order-option.model';

@Injectable()
export class SalesOrderReferenceDataService {
  private readonly api = inject(ApiClient);

  listCustomers(): Observable<readonly SalesOrderOption[]> {
    return this.api
      .get<readonly CustomerReferenceRowDto[]>('customers', {
        params: {
          select: 'id,code,name',
          active: 'eq.true',
          order: 'name.asc'
        },
        responseShape: 'raw'
      })
      .pipe(map((rows) => rows.map((row) => ({ id: row.id, label: `${row.code} - ${row.name}` }))));
  }

  listProducts(): Observable<readonly SalesOrderProductOption[]> {
    return this.api
      .get<readonly ProductReferenceRowDto[]>('products', {
        params: {
          select: 'id,sku,name,base_unit_lookup_value_id',
          active: 'eq.true',
          sellable: 'eq.true',
          order: 'name.asc'
        },
        responseShape: 'raw'
      })
      .pipe(
        map((rows) =>
          rows.map((row) => ({
            id: row.id,
            sku: row.sku,
            label: `${row.sku} - ${row.name}`,
            baseUnitLookupValueId: row.base_unit_lookup_value_id,
            baseUnitLabel: ''
          }))
        )
      );
  }

  listWarehouses(): Observable<readonly SalesOrderOption[]> {
    return this.api
      .get<readonly WarehouseReferenceRowDto[]>('warehouses', {
        params: {
          select: 'id,code,name',
          active: 'eq.true',
          order: 'name.asc'
        },
        responseShape: 'raw'
      })
      .pipe(map((rows) => rows.map((row) => ({ id: row.id, label: `${row.code} - ${row.name}` }))));
  }
}

