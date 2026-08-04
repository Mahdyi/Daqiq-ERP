import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type { CancelGoodsReceiptRequestDto } from '../dto/cancel-goods-receipt-request.dto';
import type { GoodsReceiptResponseDto } from '../dto/goods-receipt-response.dto';
import type { PostGoodsReceiptRequestDto } from '../dto/post-goods-receipt-request.dto';
import { mapGoodsReceiptResponse } from '../mappers/goods-receipt.mapper';
import type { GoodsReceipt } from '../models/goods-receipt.model';

@Injectable()
export class GoodsReceiptCommandService {
  private readonly api = inject(ApiClient);

  postReceipt(request: PostGoodsReceiptRequestDto): Observable<GoodsReceipt> {
    return this.api
      .post<PostGoodsReceiptRequestDto, GoodsReceiptResponseDto>('rpc/post_goods_receipt', request, {
        responseShape: 'raw'
      })
      .pipe(map(mapGoodsReceiptResponse));
  }

  cancelReceipt(goodsReceiptId: string): Observable<GoodsReceipt> {
    const request: CancelGoodsReceiptRequestDto = {
      goods_receipt_id: goodsReceiptId
    };

    return this.api
      .post<CancelGoodsReceiptRequestDto, GoodsReceiptResponseDto>(
        'rpc/cancel_goods_receipt',
        request,
        { responseShape: 'raw' }
      )
      .pipe(map(mapGoodsReceiptResponse));
  }
}
