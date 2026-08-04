import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiPage } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type { InventoryMovementRowDto } from '../dto/inventory-movement-row.dto';
import { mapInventoryMovementRow } from '../mappers/inventory-movement.mapper';
import type { InventoryMovement } from '../models/inventory-movement.model';
import type { InventoryMovementQuery } from '../models/inventory-query.model';
import { parsePostgrestContentRange } from './postgrest-content-range.util';
import { buildInventoryMovementListRequest } from './postgrest-inventory-query.util';

@Injectable()
export class InventoryMovementRepository {
  private readonly api = inject(ApiClient);

  list(query?: InventoryMovementQuery): Observable<ApiPage<InventoryMovement>> {
    const request = buildInventoryMovementListRequest(query);

    return this.api
      .getResponse<readonly InventoryMovementRowDto[]>('inventory_movement_view', {
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
            items: (response.body ?? []).map(mapInventoryMovementRow),
            page: request.page,
            pageSize: request.pageSize,
            totalItems: contentRange.total,
            totalPages: Math.ceil(contentRange.total / request.pageSize)
          };
        })
      );
  }
}
