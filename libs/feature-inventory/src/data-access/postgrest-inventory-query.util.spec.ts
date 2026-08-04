import {
  buildInventoryBalanceListRequest,
  buildInventoryMovementListRequest
} from './postgrest-inventory-query.util';

describe('inventory PostgREST query utilities', () => {
  it('builds balance pagination, filters, search, and strict sort params', () => {
    const request = buildInventoryBalanceListRequest({
      page: 1,
      pageSize: 25,
      search: 'pump',
      productId: 'product-id',
      warehouseId: 'warehouse-id',
      nonZeroOnly: true,
      sortField: 'productSku',
      sortDirection: 'asc'
    });

    expect(request.range).toBe('25-49');
    expect(request.params['product_id']).toBe('eq.product-id');
    expect(request.params['warehouse_id']).toBe('eq.warehouse-id');
    expect(request.params['quantity_on_hand']).toBe('neq.0');
    expect(request.params['order']).toBe('product_sku.asc,id.asc');
    expect(request.params['or']?.toString()).toContain('product_sku.ilike.*pump*');
  });

  it('builds movement filters and whitelisted order params', () => {
    const request = buildInventoryMovementListRequest({
      page: 0,
      pageSize: 10,
      movementType: 'transfer_out',
      warehouseId: 'warehouse-id',
      sortField: 'movementNumber',
      sortDirection: 'desc'
    });

    expect(request.range).toBe('0-9');
    expect(request.params['movement_type']).toBe('eq.transfer_out');
    expect(request.params['or']?.toString()).toContain('from_warehouse_id.eq.warehouse-id');
    expect(request.params['or']?.toString()).toContain('to_warehouse_id.eq.warehouse-id');
    expect(request.params['order']).toBe('movement_number.desc,id.desc');
  });
});
