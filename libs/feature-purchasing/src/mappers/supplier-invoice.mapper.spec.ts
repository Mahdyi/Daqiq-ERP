import {
  mapGoodsReceiptLineSupplierInvoicingProgressRow,
  mapSupplierInvoiceResponse
} from './supplier-invoice.mapper';

describe('supplier invoice mapper', () => {
  it('maps RPC response into invoice detail models', () => {
    const result = mapSupplierInvoiceResponse({
      id: '11111111-1111-4111-8111-111111111111',
      invoiceNumber: 'PI-2026-000001',
      supplierInvoiceNumber: 'SUP-INV-1',
      supplierId: '22222222-2222-4222-8222-222222222222',
      supplierCode: 'SUP-001',
      supplierName: 'Supplier',
      purchaseOrderId: '33333333-3333-4333-8333-333333333333',
      purchaseOrderNumber: 'PO-2026-000001',
      goodsReceiptId: '44444444-4444-4444-8444-444444444444',
      goodsReceiptNumber: 'GR-2026-000001',
      statusCode: 'draft',
      statusLabel: 'پیش‌نویس',
      invoiceDate: '2026-08-07',
      dueDate: null,
      currencyLookupValueId: null,
      currencyCode: null,
      currencyLabel: null,
      subtotalAmount: 100,
      taxAmount: 10,
      totalAmount: 110,
      notes: null,
      createdByEmail: 'admin@erp.com',
      postedByEmail: null,
      postedAt: null,
      cancelledByEmail: null,
      cancelledAt: null,
      createdAt: '2026-08-07T10:00:00.000Z',
      updatedAt: '2026-08-07T10:00:00.000Z',
      lines: [
        {
          id: '55555555-5555-4555-8555-555555555555',
          supplierInvoiceId: '11111111-1111-4111-8111-111111111111',
          lineNumber: 1,
          goodsReceiptLineId: '66666666-6666-4666-8666-666666666666',
          purchaseOrderLineId: '77777777-7777-4777-8777-777777777777',
          productId: '88888888-8888-4888-8888-888888888888',
          productSku: 'SKU-1',
          productName: 'Product',
          description: null,
          quantity: 1,
          unitCode: 'piece',
          unitLabel: 'عدد',
          unitPrice: 100,
          taxRateCode: 'standard',
          taxRateLabel: 'استاندارد',
          taxAmount: 10,
          lineTotal: 110
        }
      ]
    });

    expect(result.invoice.invoiceNumber).toBe('PI-2026-000001');
    expect(result.invoice.invoiceDate).toEqual(new Date('2026-08-07'));
    expect(result.invoice.dueDate).toBeNull();
    expect(result.lines[0]?.lineTotal).toBe(110);
  });

  it('maps goods receipt invoicing progress quantities as numbers', () => {
    const progress = mapGoodsReceiptLineSupplierInvoicingProgressRow({
      goods_receipt_line_id: '11111111-1111-4111-8111-111111111111',
      goods_receipt_id: '22222222-2222-4222-8222-222222222222',
      purchase_order_line_id: '33333333-3333-4333-8333-333333333333',
      product_id: '44444444-4444-4444-8444-444444444444',
      product_sku: 'SKU-1',
      product_name: 'Product',
      received_quantity: 5,
      invoiced_quantity: 2,
      remaining_quantity: 3,
      unit_lookup_value_id: '55555555-5555-4555-8555-555555555555',
      unit_code: 'piece',
      unit_label: 'عدد'
    });

    expect(progress.receivedQuantity).toBe(5);
    expect(progress.invoicedQuantity).toBe(2);
    expect(progress.remainingQuantity).toBe(3);
  });
});
