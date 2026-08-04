import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type {
  CancelSalesDeliveryRequestDto,
  PostSalesDeliveryRequestDto
} from '../dto/sales-delivery-command-request.dto';
import type { SalesDeliveryResponseDto } from '../dto/sales-delivery-response.dto';
import { mapSalesDeliveryResponse } from '../mappers/sales-delivery.mapper';
import type { SalesDeliveryLine } from '../models/sales-delivery-line.model';
import type { SalesDeliveryPostingRequest } from '../models/sales-delivery-posting.model';
import type { SalesDelivery } from '../models/sales-delivery.model';

export interface SalesDeliveryDetailResult {
  readonly delivery: SalesDelivery;
  readonly lines: readonly SalesDeliveryLine[];
}

@Injectable()
export class SalesDeliveryCommandService {
  private readonly api = inject(ApiClient);

  post(request: SalesDeliveryPostingRequest): Observable<SalesDeliveryDetailResult> {
    const body: PostSalesDeliveryRequestDto = {
      sales_order_id: request.salesOrderId,
      delivery_date: request.deliveryDate,
      warehouse_id: request.warehouseId,
      notes: request.notes,
      lines: request.lines.map((line) => ({
        salesOrderLineId: line.salesOrderLineId,
        shippedQuantity: line.shippedQuantity,
        storageLocationId: line.storageLocationId,
        notes: line.notes
      }))
    };

    return this.api
      .post<PostSalesDeliveryRequestDto, SalesDeliveryResponseDto>('rpc/post_sales_delivery', body, {
        responseShape: 'raw'
      })
      .pipe(map(mapSalesDeliveryResponse));
  }

  cancel(salesDeliveryId: string): Observable<SalesDeliveryDetailResult> {
    const body: CancelSalesDeliveryRequestDto = {
      sales_delivery_id: salesDeliveryId
    };

    return this.api
      .post<CancelSalesDeliveryRequestDto, SalesDeliveryResponseDto>(
        'rpc/cancel_sales_delivery',
        body,
        { responseShape: 'raw' }
      )
      .pipe(map(mapSalesDeliveryResponse));
  }
}
