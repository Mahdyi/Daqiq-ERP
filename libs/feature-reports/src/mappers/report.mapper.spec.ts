import {
  mapInventoryOnHandReportRow,
  mapPaymentSummaryReportRow
} from './report.mapper';

describe('report mappers', () => {
  it('maps numeric and date fields safely', () => {
    const row = mapInventoryOnHandReportRow({
      product_id: 'product-1',
      product_sku: 'SKU-1',
      product_name: 'Test product',
      product_type: 'finished_good',
      warehouse_id: 'warehouse-1',
      warehouse_code: 'WH-1',
      warehouse_name: 'Main warehouse',
      storage_location_id: null,
      storage_location_code: null,
      storage_location_name: null,
      unit_code: 'piece',
      unit_label: 'عدد',
      quantity_on_hand: '12.5',
      last_movement_at: '2026-08-12T10:00:00Z'
    });

    expect(row.quantityOnHand).toBe(12.5);
    expect(row.lastMovementAt instanceof Date).toBeTrue();
  });

  it('rejects malformed numeric fields instead of returning NaN', () => {
    expect(() =>
      mapPaymentSummaryReportRow({
        payment_direction: 'customer_receipt',
        payment_count: 'not-a-number',
        total_amount: 10,
        first_payment_date: null,
        last_payment_date: null
      })
    ).toThrowError(/payment_count/);
  });
});
