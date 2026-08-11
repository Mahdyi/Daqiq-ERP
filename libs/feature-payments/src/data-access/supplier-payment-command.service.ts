import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type {
  PostSupplierPaymentRequestDto,
  SupplierPaymentResponseDto
} from '../dto/payment-command.dto';
import { mapSupplierPaymentResponse } from '../mappers/payment.mapper';
import type { SupplierPayment } from '../models/supplier-payment.model';

@Injectable()
export class SupplierPaymentCommandService {
  private readonly api = inject(ApiClient);

  post(request: PostSupplierPaymentRequestDto): Observable<SupplierPayment> {
    return this.api
      .post<PostSupplierPaymentRequestDto, SupplierPaymentResponseDto>('rpc/post_supplier_payment', request, {
        responseShape: 'raw'
      })
      .pipe(map(mapSupplierPaymentResponse));
  }

  cancel(id: string): Observable<SupplierPayment> {
    return this.api
      .post<{ readonly supplier_payment_id: string }, SupplierPaymentResponseDto>(
        'rpc/cancel_supplier_payment',
        { supplier_payment_id: id },
        { responseShape: 'raw' }
      )
      .pipe(map(mapSupplierPaymentResponse));
  }
}
