import {
  buildGoodsReceiptSupplierInvoicingProgressParams,
  buildSupplierInvoiceIdParams,
  buildSupplierInvoiceListRequest
} from './postgrest-supplier-invoice-query.util';

describe('supplier invoice PostgREST query utilities', () => {
  it('builds search, filters, paging, and sorting params safely', () => {
    const request = buildSupplierInvoiceListRequest({
      page: 1,
      pageSize: 15,
      search: 'SUP,100',
      supplierId: '11111111-1111-4111-8111-111111111111',
      statusCode: 'draft',
      invoiceDateFrom: '2026-08-01',
      invoiceDateTo: '2026-08-31',
      sortField: 'supplierName',
      sortDirection: 'asc'
    });

    expect(request.range).toBe('15-29');
    expect(request.params['supplier_id']).toBe('eq.11111111-1111-4111-8111-111111111111');
    expect(request.params['status_code']).toBe('eq.draft');
    expect(request.params['invoice_date']).toEqual(['gte.2026-08-01', 'lte.2026-08-31']);
    expect(request.params['order']).toBe('supplier_name.asc,id.desc');
    expect(String(request.params['or'])).toContain('SUP\\,100');
  });

  it('rejects invalid supplier invoice ids', () => {
    expect(() => buildSupplierInvoiceIdParams('bad-id')).toThrow();
  });

  it('rejects invalid goods receipt ids for progress reads', () => {
    expect(() => buildGoodsReceiptSupplierInvoicingProgressParams('bad-id')).toThrow();
  });
});
