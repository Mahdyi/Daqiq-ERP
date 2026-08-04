import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type { InventoryAdjustInRequestDto } from '../dto/inventory-adjust-in-request.dto';
import type { InventoryAdjustOutRequestDto } from '../dto/inventory-adjust-out-request.dto';
import type {
  InventoryMovementRpcDto,
  InventoryTransferResponseDto
} from '../dto/inventory-movement-row.dto';
import type { InventoryTransferRequestDto } from '../dto/inventory-transfer-request.dto';
import { mapInventoryMovementRpc } from '../mappers/inventory-movement.mapper';
import type { InventoryMovement } from '../models/inventory-movement.model';

@Injectable()
export class InventoryTransactionService {
  private readonly api = inject(ApiClient);

  adjustIn(request: InventoryAdjustInRequestDto): Observable<InventoryMovement> {
    return this.api
      .post<InventoryAdjustInRequestDto, InventoryMovementRpcDto>(
        'rpc/inventory_adjust_in',
        request,
        { responseShape: 'raw' }
      )
      .pipe(map(mapInventoryMovementRpc));
  }

  adjustOut(request: InventoryAdjustOutRequestDto): Observable<InventoryMovement> {
    return this.api
      .post<InventoryAdjustOutRequestDto, InventoryMovementRpcDto>(
        'rpc/inventory_adjust_out',
        request,
        { responseShape: 'raw' }
      )
      .pipe(map(mapInventoryMovementRpc));
  }

  transfer(request: InventoryTransferRequestDto): Observable<readonly InventoryMovement[]> {
    return this.api
      .post<InventoryTransferRequestDto, InventoryTransferResponseDto>(
        'rpc/inventory_transfer',
        request,
        { responseShape: 'raw' }
      )
      .pipe(
        map((response) => [
          mapInventoryMovementRpc(response.outMovement),
          mapInventoryMovementRpc(response.inMovement)
        ])
      );
  }
}
