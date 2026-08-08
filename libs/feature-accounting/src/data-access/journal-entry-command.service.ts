import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type {
  CreateManualJournalRequestDto,
  JournalEntryTransitionRequestDto
} from '../dto/manual-journal-request.dto';
import type { JournalEntryResponseDto } from '../dto/journal-entry-response.dto';
import { mapJournalEntryResponse } from '../mappers/accounting.mapper';
import type { ManualJournalFormValue } from '../models/manual-journal.model';
import type { JournalEntryLine } from '../models/journal-entry-line.model';
import type { JournalEntry } from '../models/journal-entry.model';

export interface JournalEntryDetailResult {
  readonly entry: JournalEntry;
  readonly lines: readonly JournalEntryLine[];
}

@Injectable()
export class JournalEntryCommandService {
  private readonly api = inject(ApiClient);

  createManual(request: ManualJournalFormValue): Observable<JournalEntryDetailResult> {
    const body: CreateManualJournalRequestDto = {
      journal_date: request.journalDate,
      description: request.description,
      currency_lookup_value_id: request.currencyLookupValueId,
      lines: request.lines
    };

    return this.api
      .post<CreateManualJournalRequestDto, JournalEntryResponseDto>(
        'rpc/create_manual_journal_entry',
        body,
        { responseShape: 'raw' }
      )
      .pipe(map(mapJournalEntryResponse));
  }

  post(journalEntryId: string): Observable<JournalEntryDetailResult> {
    return this.transition('rpc/post_journal_entry', journalEntryId);
  }

  cancel(journalEntryId: string): Observable<JournalEntryDetailResult> {
    return this.transition('rpc/cancel_journal_entry', journalEntryId);
  }

  private transition(endpoint: string, journalEntryId: string): Observable<JournalEntryDetailResult> {
    const body: JournalEntryTransitionRequestDto = {
      journal_entry_id: journalEntryId
    };

    return this.api
      .post<JournalEntryTransitionRequestDto, JournalEntryResponseDto>(endpoint, body, {
        responseShape: 'raw'
      })
      .pipe(map(mapJournalEntryResponse));
  }
}
