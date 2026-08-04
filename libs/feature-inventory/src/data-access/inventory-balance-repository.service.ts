import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiPage } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type { InventoryBalanceRowDto } from '../dto/inventory-balance-row.dto';
import { mapInventoryBalanceRow } from '../mappers/inventory-balance.mapper';
import type { InventoryBalance } from '../models/inventory-balance.model';
import type { InventoryBalanceQuery } from '../models/inventory-query.model';
import { parsePostgrestContentRange } from './postgrest-content-range.util';
import { buildInventoryBalanceListRequest } from './postgrest-inventory-query.util';

@Injectable()
export class InventoryBalanceRepository {
  private readonly api = inject(ApiClient);

  list(query?: InventoryBalanceQuery): Observable<ApiPage<InventoryBalance>> {
    const request = buildInventoryBalanceListRequest(query);

    return this.api
      .getResponse<readonly InventoryBalanceRowDto[]>('inventory_balance_view', {
        params: request.params,
        headers: {
          Prefer: 'count=exact',
          'Range-Unit': 'items',
          Range: request.range
        },
        responseShape: 'raw'
      })
      .pipe(
        map((response) => {
          const contentRange = parsePostgrestContentRange(response.headers.get('Content-Range'));

          return {
            items: (response.body ?? []).map(mapInventoryBalanceRow),
            page: request.page,
            pageSize: request.pageSize,
            totalItems: contentRange.total,
            totalPages: Math.ceil(contentRange.total / request.pageSize)
          };
        })
      );
  }
}
