import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type {
  CustomerReceiptResponseDto,
  PostCustomerReceiptRequestDto
} from '../dto/payment-command.dto';
import { mapCustomerReceiptResponse } from '../mappers/payment.mapper';
import type { CustomerReceipt } from '../models/customer-receipt.model';

@Injectable()
export class CustomerReceiptCommandService {
  private readonly api = inject(ApiClient);

  post(request: PostCustomerReceiptRequestDto): Observable<CustomerReceipt> {
    return this.api
      .post<PostCustomerReceiptRequestDto, CustomerReceiptResponseDto>('rpc/post_customer_receipt', request, {
        responseShape: 'raw'
      })
      .pipe(map(mapCustomerReceiptResponse));
  }

  cancel(id: string): Observable<CustomerReceipt> {
    return this.api
      .post<{ readonly customer_receipt_id: string }, CustomerReceiptResponseDto>(
        'rpc/cancel_customer_receipt',
        { customer_receipt_id: id },
        { responseShape: 'raw' }
      )
      .pipe(map(mapCustomerReceiptResponse));
  }
}
