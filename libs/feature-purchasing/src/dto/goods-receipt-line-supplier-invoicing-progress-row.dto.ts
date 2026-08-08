export interface GoodsReceiptLineSupplierInvoicingProgressRowDto {
  readonly goods_receipt_line_id: string;
  readonly goods_receipt_id: string;
  readonly purchase_order_line_id: string;
  readonly product_id: string;
  readonly product_sku: string;
  readonly product_name: string;
  readonly received_quantity: number;
  readonly invoiced_quantity: number;
  readonly remaining_quantity: number;
  readonly unit_lookup_value_id: string;
  readonly unit_code: string;
  readonly unit_label: string | null;
}
