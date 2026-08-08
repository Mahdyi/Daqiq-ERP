export interface SupplierInvoiceLineRowDto {
  readonly id: string;
  readonly supplier_invoice_id: string;
  readonly line_number: number;
  readonly goods_receipt_line_id: string | null;
  readonly purchase_order_line_id: string | null;
  readonly product_id: string;
  readonly product_sku: string;
  readonly product_name: string;
  readonly description: string | null;
  readonly quantity: number;
  readonly unit_code: string;
  readonly unit_label: string | null;
  readonly unit_price: number;
  readonly tax_rate_code: string | null;
  readonly tax_rate_label: string | null;
  readonly tax_amount: number;
  readonly line_total: number;
}
