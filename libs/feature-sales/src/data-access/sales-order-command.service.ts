import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@daqiq/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { CreateSalesOrderRequestDto } from '../dto/create-sales-order-request.dto';
import type { SalesOrderTransitionRequestDto } from '../dto/sales-order-transition-request.dto';
import type { SalesOrderResponseDto } from '../dto/sales-order-response.dto';
import type { UpdateSalesOrderRequestDto } from '../dto/update-sales-order-request.dto';
import { mapSalesOrderResponse } from '../mappers/sales-order.mapper';
import type { SalesOrder } from '../models/sales-order.model';

@Injectable()
export class SalesOrderCommandService {
  private readonly api = inject(ApiClient);

  create(request: CreateSalesOrderRequestDto): Observable<SalesOrder> {
    return this.api.post<CreateSalesOrderRequestDto, SalesOrderResponseDto>(
      'rpc/create_sales_order',
      request,
      { responseShape: 'raw' }
    ).pipe(map(mapSalesOrderResponse));
  }

  update(request: UpdateSalesOrderRequestDto): Observable<SalesOrder> {
    return this.api.post<UpdateSalesOrderRequestDto, SalesOrderResponseDto>(
      'rpc/update_sales_order',
      request,
      { responseShape: 'raw' }
    ).pipe(map(mapSalesOrderResponse));
  }

  submit(id: string): Observable<SalesOrder> {
    return this.transition('rpc/submit_sales_order', id);
  }

  confirm(id: string): Observable<SalesOrder> {
    return this.transition('rpc/confirm_sales_order', id);
  }

  cancel(id: string): Observable<SalesOrder> {
    return this.transition('rpc/cancel_sales_order', id);
  }

  close(id: string): Observable<SalesOrder> {
    return this.transition('rpc/close_sales_order', id);
  }

  private transition(endpoint: string, id: string): Observable<SalesOrder> {
    const request: SalesOrderTransitionRequestDto = {
      sales_order_id: id
    };

    return this.api.post<SalesOrderTransitionRequestDto, SalesOrderResponseDto>(
      endpoint,
      request,
      { responseShape: 'raw' }
    ).pipe(map(mapSalesOrderResponse));
  }
}

