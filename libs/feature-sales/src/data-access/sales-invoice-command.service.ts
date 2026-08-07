import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type {
  CreateSalesInvoiceFromDeliveryRequestDto,
  SalesInvoiceTransitionRequestDto
} from '../dto/sales-invoice-command-request.dto';
import type { SalesInvoiceResponseDto } from '../dto/sales-invoice-response.dto';
import { mapSalesInvoiceResponse } from '../mappers/sales-invoice.mapper';
import type { SalesInvoiceEditorRequest } from '../models/sales-invoice-editor.model';
import type { SalesInvoiceLine } from '../models/sales-invoice-line.model';
import type { SalesInvoice } from '../models/sales-invoice.model';

export interface SalesInvoiceDetailResult {
  readonly invoice: SalesInvoice;
  readonly lines: readonly SalesInvoiceLine[];
}

@Injectable()
export class SalesInvoiceCommandService {
  private readonly api = inject(ApiClient);

  createFromDelivery(request: SalesInvoiceEditorRequest): Observable<SalesInvoiceDetailResult> {
    const body: CreateSalesInvoiceFromDeliveryRequestDto = {
      sales_delivery_id: request.salesDeliveryId,
      invoice_date: request.invoiceDate,
      due_date: request.dueDate,
      notes: request.notes,
      lines: request.lines.map((line) => ({
        salesDeliveryLineId: line.salesDeliveryLineId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRateLookupValueId: line.taxRateLookupValueId,
        description: line.description
      }))
    };

    return this.api
      .post<CreateSalesInvoiceFromDeliveryRequestDto, SalesInvoiceResponseDto>(
        'rpc/create_sales_invoice_from_delivery',
        body,
        { responseShape: 'raw' }
      )
      .pipe(map(mapSalesInvoiceResponse));
  }

  issue(salesInvoiceId: string): Observable<SalesInvoiceDetailResult> {
    return this.transition('rpc/issue_sales_invoice', salesInvoiceId);
  }

  cancel(salesInvoiceId: string): Observable<SalesInvoiceDetailResult> {
    return this.transition('rpc/cancel_sales_invoice', salesInvoiceId);
  }

  private transition(endpoint: string, salesInvoiceId: string): Observable<SalesInvoiceDetailResult> {
    const body: SalesInvoiceTransitionRequestDto = {
      sales_invoice_id: salesInvoiceId
    };

    return this.api
      .post<SalesInvoiceTransitionRequestDto, SalesInvoiceResponseDto>(endpoint, body, {
        responseShape: 'raw'
      })
      .pipe(map(mapSalesInvoiceResponse));
  }
}
