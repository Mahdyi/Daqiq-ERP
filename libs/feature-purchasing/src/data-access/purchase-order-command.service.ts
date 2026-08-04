import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@daqiq/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { CreatePurchaseOrderRequestDto } from '../dto/create-purchase-order-request.dto';
import type { PurchaseOrderTransitionRequestDto } from '../dto/purchase-order-transition-request.dto';
import type { PurchaseOrderResponseDto } from '../dto/purchase-order-response.dto';
import type { UpdatePurchaseOrderRequestDto } from '../dto/update-purchase-order-request.dto';
import { mapPurchaseOrderResponse } from '../mappers/purchase-order.mapper';
import type { PurchaseOrder } from '../models/purchase-order.model';

@Injectable()
export class PurchaseOrderCommandService {
  private readonly api = inject(ApiClient);

  create(request: CreatePurchaseOrderRequestDto): Observable<PurchaseOrder> {
    return this.api.post<CreatePurchaseOrderRequestDto, PurchaseOrderResponseDto>(
      'rpc/create_purchase_order',
      request,
      { responseShape: 'raw' }
    ).pipe(map(mapPurchaseOrderResponse));
  }

  update(request: UpdatePurchaseOrderRequestDto): Observable<PurchaseOrder> {
    return this.api.post<UpdatePurchaseOrderRequestDto, PurchaseOrderResponseDto>(
      'rpc/update_purchase_order',
      request,
      { responseShape: 'raw' }
    ).pipe(map(mapPurchaseOrderResponse));
  }

  submit(id: string): Observable<PurchaseOrder> {
    return this.transition('rpc/submit_purchase_order', id);
  }

  approve(id: string): Observable<PurchaseOrder> {
    return this.transition('rpc/approve_purchase_order', id);
  }

  cancel(id: string): Observable<PurchaseOrder> {
    return this.transition('rpc/cancel_purchase_order', id);
  }

  close(id: string): Observable<PurchaseOrder> {
    return this.transition('rpc/close_purchase_order', id);
  }

  private transition(endpoint: string, id: string): Observable<PurchaseOrder> {
    const request: PurchaseOrderTransitionRequestDto = {
      purchase_order_id: id
    };

    return this.api.post<PurchaseOrderTransitionRequestDto, PurchaseOrderResponseDto>(
      endpoint,
      request,
      { responseShape: 'raw' }
    ).pipe(map(mapPurchaseOrderResponse));
  }
}
