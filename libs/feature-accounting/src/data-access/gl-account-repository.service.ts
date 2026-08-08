import { HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiError, ApiPage } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type { GlAccountRowDto } from '../dto/gl-account-row.dto';
import { mapGlAccountRow } from '../mappers/accounting.mapper';
import type { GlAccountQuery } from '../models/accounting-query.model';
import type { GlAccount } from '../models/gl-account.model';
import { buildGlAccountListRequest, buildJournalEntryIdParams, GL_ACCOUNT_SELECT } from './postgrest-accounting-query.util';
import { parsePostgrestContentRange } from './postgrest-content-range.util';

@Injectable()
export class GlAccountRepository {
  private readonly api = inject(ApiClient);

  list(query?: GlAccountQuery): Observable<ApiPage<GlAccount>> {
    const request = buildGlAccountListRequest(query);

    return this.api
      .getResponse<readonly GlAccountRowDto[]>('gl_account_view', {
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
            items: (response.body ?? []).map(mapGlAccountRow),
            page: request.page,
            pageSize: request.pageSize,
            totalItems: contentRange.total,
            totalPages: Math.ceil(contentRange.total / request.pageSize)
          };
        })
      );
  }

  getById(id: string): Observable<GlAccount> {
    return this.api
      .getResponse<readonly GlAccountRowDto[]>('gl_account_view', {
        params: {
          ...buildJournalEntryIdParams(id),
          select: GL_ACCOUNT_SELECT
        },
        headers: {
          Range: '0-0',
          'Range-Unit': 'items'
        },
        responseShape: 'raw'
      })
      .pipe(map((response) => this.readSingle(response, id)));
  }

  private readSingle(response: HttpResponse<readonly GlAccountRowDto[]>, id: string): GlAccount {
    const rows = response.body ?? [];

    if (rows.length === 0) {
      throw new ApiError({
        status: 404,
        code: 'NOT_FOUND',
        message: 'حساب کل موردنظر یافت نشد.',
        details: id,
        fieldErrors: []
      });
    }

    return mapGlAccountRow(rows[0]);
  }
}
