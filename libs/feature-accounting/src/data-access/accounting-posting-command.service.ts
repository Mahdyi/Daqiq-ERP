import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type {
  InvoiceAccountingPostingRequestDto
} from '../dto/manual-journal-request.dto';
import type { JournalEntryResponseDto } from '../dto/journal-entry-response.dto';
import { mapJournalEntryResponse } from '../mappers/accounting.mapper';
import type { JournalEntryDetailResult } from './journal-entry-command.service';

@Injectable()
export class AccountingPostingCommandService {
  private readonly api = inject(ApiClient);

  postSalesInvoice(salesInvoiceId: string): Observable<JournalEntryDetailResult> {
    const body: InvoiceAccountingPostingRequestDto = {
      sales_invoice_id: salesInvoiceId
    };

    return this.api
      .post<InvoiceAccountingPostingRequestDto, JournalEntryResponseDto>(
        'rpc/post_sales_invoice_accounting',
        body,
        { responseShape: 'raw' }
      )
      .pipe(map(mapJournalEntryResponse));
  }

  postSupplierInvoice(supplierInvoiceId: string): Observable<JournalEntryDetailResult> {
    const body: InvoiceAccountingPostingRequestDto = {
      supplier_invoice_id: supplierInvoiceId
    };

    return this.api
      .post<InvoiceAccountingPostingRequestDto, JournalEntryResponseDto>(
        'rpc/post_supplier_invoice_accounting',
        body,
        { responseShape: 'raw' }
      )
      .pipe(map(mapJournalEntryResponse));
  }
}
