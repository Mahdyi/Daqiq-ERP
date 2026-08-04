import {
  mapAdjustmentToInRequest,
  mapTransferToRequest,
  transferSourceMatchesDestination
} from './inventory-transaction.mapper';

describe('inventory transaction mapper', () => {
  it('trims required strings and normalizes blank optional storage location to null', () => {
    const request = mapAdjustmentToInRequest({
      movementDirection: 'in',
      productId: ' product-id ',
      warehouseId: ' warehouse-id ',
      storageLocationId: '   ',
      quantity: 2,
      reason: ' Initial balance '
    });

    expect(request.product_id).toBe('product-id');
    expect(request.warehouse_id).toBe('warehouse-id');
    expect(request.storage_location_id).toBeNull();
    expect(request.reason).toBe('Initial balance');
  });

  it('maps transfer values to PostgREST RPC request shape', () => {
    const request = mapTransferToRequest({
      productId: 'product-id',
      fromWarehouseId: 'from-warehouse-id',
      fromStorageLocationId: null,
      toWarehouseId: 'to-warehouse-id',
      toStorageLocationId: 'to-location-id',
      quantity: 5,
      reason: null
    });

    expect(request.product_id).toBe('product-id');
    expect(request.from_warehouse_id).toBe('from-warehouse-id');
    expect(request.to_storage_location_id).toBe('to-location-id');
    expect(request.reason).toBeNull();
  });

  it('detects identical transfer source and destination', () => {
    expect(
      transferSourceMatchesDestination({
        productId: 'product-id',
        fromWarehouseId: 'warehouse-id',
        fromStorageLocationId: 'location-id',
        toWarehouseId: 'warehouse-id',
        toStorageLocationId: 'location-id',
        quantity: 1,
        reason: null
      })
    ).toBeTrue();
  });
});
