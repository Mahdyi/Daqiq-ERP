import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type {
  CreateSupplierInvoiceFromReceiptRequestDto,
  SupplierInvoiceTransitionRequestDto
} from '../dto/supplier-invoice-command-request.dto';
import type { SupplierInvoiceResponseDto } from '../dto/supplier-invoice-response.dto';
import { mapSupplierInvoiceResponse } from '../mappers/supplier-invoice.mapper';
import type { SupplierInvoiceEditorRequest } from '../models/supplier-invoice-editor.model';
import type { SupplierInvoiceLine } from '../models/supplier-invoice-line.model';
import type { SupplierInvoice } from '../models/supplier-invoice.model';

export interface SupplierInvoiceDetailResult {
  readonly invoice: SupplierInvoice;
  readonly lines: readonly SupplierInvoiceLine[];
}

@Injectable()
export class SupplierInvoiceCommandService {
  private readonly api = inject(ApiClient);

  createFromReceipt(request: SupplierInvoiceEditorRequest): Observable<SupplierInvoiceDetailResult> {
    const body: CreateSupplierInvoiceFromReceiptRequestDto = {
      goods_receipt_id: request.goodsReceiptId,
      supplier_invoice_number: request.supplierInvoiceNumber,
      invoice_date: request.invoiceDate,
      due_date: request.dueDate,
      notes: request.notes,
      lines: request.lines.map((line) => ({
        goodsReceiptLineId: line.goodsReceiptLineId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRateLookupValueId: line.taxRateLookupValueId,
        description: line.description
      }))
    };

    return this.api
      .post<CreateSupplierInvoiceFromReceiptRequestDto, SupplierInvoiceResponseDto>(
        'rpc/create_supplier_invoice_from_receipt',
        body,
        { responseShape: 'raw' }
      )
      .pipe(map(mapSupplierInvoiceResponse));
  }

  post(supplierInvoiceId: string): Observable<SupplierInvoiceDetailResult> {
    return this.transition('rpc/post_supplier_invoice', supplierInvoiceId);
  }

  cancel(supplierInvoiceId: string): Observable<SupplierInvoiceDetailResult> {
    return this.transition('rpc/cancel_supplier_invoice', supplierInvoiceId);
  }

  private transition(endpoint: string, supplierInvoiceId: string): Observable<SupplierInvoiceDetailResult> {
    const body: SupplierInvoiceTransitionRequestDto = {
      supplier_invoice_id: supplierInvoiceId
    };

    return this.api
      .post<SupplierInvoiceTransitionRequestDto, SupplierInvoiceResponseDto>(endpoint, body, {
        responseShape: 'raw'
      })
      .pipe(map(mapSupplierInvoiceResponse));
  }
}
