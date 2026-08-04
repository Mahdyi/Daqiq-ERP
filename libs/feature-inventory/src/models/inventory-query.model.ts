import type { ApiQuery } from '@daqiq/core';
import type { InventoryBalance } from './inventory-balance.model';
import type { InventoryMovement } from './inventory-movement.model';
import type { InventoryMovementType } from './inventory-movement-type.model';

export interface InventoryBalanceQuery extends ApiQuery {
  readonly search?: string;
  readonly productId?: string;
  readonly warehouseId?: string;
  readonly storageLocationId?: string;
  readonly nonZeroOnly?: boolean;
  readonly sortField?: keyof InventoryBalance;
  readonly sortDirection?: 'asc' | 'desc';
}

export interface InventoryMovementQuery extends ApiQuery {
  readonly search?: string;
  readonly productId?: string;
  readonly warehouseId?: string;
  readonly movementType?: InventoryMovementType;
  readonly sortField?: keyof InventoryMovement;
  readonly sortDirection?: 'asc' | 'desc';
}
