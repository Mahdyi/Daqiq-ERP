import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiPage } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type { AccountingPeriodRowDto } from '../dto/accounting-period-row.dto';
import { mapAccountingPeriodRow } from '../mappers/accounting.mapper';
import type { AccountingPeriod } from '../models/accounting-period.model';
import { buildAccountingPeriodListRequest } from './postgrest-accounting-query.util';
import { parsePostgrestContentRange } from './postgrest-content-range.util';

@Injectable()
export class AccountingPeriodRepository {
  private readonly api = inject(ApiClient);

  list(): Observable<ApiPage<AccountingPeriod>> {
    const request = buildAccountingPeriodListRequest();

    return this.api
      .getResponse<readonly AccountingPeriodRowDto[]>('accounting_period_view', {
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
            items: (response.body ?? []).map(mapAccountingPeriodRow),
            page: request.page,
            pageSize: request.pageSize,
            totalItems: contentRange.total,
            totalPages: Math.ceil(contentRange.total / request.pageSize)
          };
        })
      );
  }
}
