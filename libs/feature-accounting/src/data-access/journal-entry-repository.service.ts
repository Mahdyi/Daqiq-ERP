import { HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiError, ApiPage } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type { GeneralLedgerLineRowDto } from '../dto/general-ledger-line-row.dto';
import type { JournalEntryLineRowDto } from '../dto/journal-entry-line-row.dto';
import type { JournalEntryRowDto } from '../dto/journal-entry-row.dto';
import {
  mapGeneralLedgerLineRow,
  mapJournalEntryLineRow,
  mapJournalEntryRow
} from '../mappers/accounting.mapper';
import type { GeneralLedgerQuery, JournalEntryQuery } from '../models/accounting-query.model';
import type { GeneralLedgerLine } from '../models/general-ledger-line.model';
import type { JournalEntryLine } from '../models/journal-entry-line.model';
import type { JournalEntry } from '../models/journal-entry.model';
import {
  buildGeneralLedgerListRequest,
  buildJournalEntryIdParams,
  buildJournalEntryListRequest,
  buildJournalLineParams
} from './postgrest-accounting-query.util';
import { parsePostgrestContentRange } from './postgrest-content-range.util';

@Injectable()
export class JournalEntryRepository {
  private readonly api = inject(ApiClient);

  list(query?: JournalEntryQuery): Observable<ApiPage<JournalEntry>> {
    const request = buildJournalEntryListRequest(query);

    return this.api
      .getResponse<readonly JournalEntryRowDto[]>('journal_entry_view', {
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
            items: (response.body ?? []).map(mapJournalEntryRow),
            page: request.page,
            pageSize: request.pageSize,
            totalItems: contentRange.total,
            totalPages: Math.ceil(contentRange.total / request.pageSize)
          };
        })
      );
  }

  getById(id: string): Observable<JournalEntry> {
    return this.api
      .getResponse<readonly JournalEntryRowDto[]>('journal_entry_view', {
        params: buildJournalEntryIdParams(id),
        headers: {
          Range: '0-0',
          'Range-Unit': 'items'
        },
        responseShape: 'raw'
      })
      .pipe(map((response) => this.readSingle(response, id)));
  }

  listLines(journalEntryId: string): Observable<readonly JournalEntryLine[]> {
    return this.api
      .get<readonly JournalEntryLineRowDto[]>('journal_entry_line_view', {
        params: buildJournalLineParams(journalEntryId),
        responseShape: 'raw'
      })
      .pipe(map((rows) => rows.map(mapJournalEntryLineRow)));
  }

  listGeneralLedger(query?: GeneralLedgerQuery): Observable<ApiPage<GeneralLedgerLine>> {
    const request = buildGeneralLedgerListRequest(query);

    return this.api
      .getResponse<readonly GeneralLedgerLineRowDto[]>('general_ledger_view', {
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
            items: (response.body ?? []).map(mapGeneralLedgerLineRow),
            page: request.page,
            pageSize: request.pageSize,
            totalItems: contentRange.total,
            totalPages: Math.ceil(contentRange.total / request.pageSize)
          };
        })
      );
  }

  private readSingle(response: HttpResponse<readonly JournalEntryRowDto[]>, id: string): JournalEntry {
    const rows = response.body ?? [];

    if (rows.length === 0) {
      throw new ApiError({
        status: 404,
        code: 'NOT_FOUND',
        message: 'سند حسابداری موردنظر یافت نشد.',
        details: id,
        fieldErrors: []
      });
    }

    return mapJournalEntryRow(rows[0]);
  }
}
