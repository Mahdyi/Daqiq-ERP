import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type {
  ProductReferenceRowDto,
  CustomerReferenceRowDto,
  LookupReferencePageDto,
  StorageLocationReferenceRowDto,
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

  listStorageLocations(warehouseId: string): Observable<readonly SalesOrderOption[]> {
    return this.api
      .get<readonly StorageLocationReferenceRowDto[]>('storage_locations', {
        params: {
          select: 'id,code,name,warehouse_id',
          warehouse_id: `eq.${warehouseId}`,
          active: 'eq.true',
          order: 'name.asc'
        },
        responseShape: 'raw'
      })
      .pipe(map((rows) => rows.map((row) => ({ id: row.id, label: `${row.code} - ${row.name}` }))));
  }

  listTaxRates(): Observable<readonly SalesOrderOption[]> {
    return this.api
      .post<
        {
          readonly lookup_type_code: 'tax_rate';
          readonly active: true;
          readonly page_number: number;
          readonly page_size: number;
        },
        LookupReferencePageDto
      >('rpc/admin_list_lookup_values', {
        lookup_type_code: 'tax_rate',
        active: true,
        page_number: 1,
        page_size: 50
      }, {
        responseShape: 'raw'
      })
      .pipe(
        map((page) =>
          page.items.map((row) => ({ id: row.id, label: `${row.code} - ${row.label}` }))
        )
      );
  }
}

