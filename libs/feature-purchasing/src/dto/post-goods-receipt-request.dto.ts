export interface PostGoodsReceiptLineRequestDto {
  readonly purchase_order_line_id: string;
  readonly received_quantity: number;
  readonly storage_location_id?: string | null;
  readonly notes?: string | null;
}

export interface PostGoodsReceiptRequestDto {
  readonly purchase_order_id: string;
  readonly receipt_date: string;
  readonly warehouse_id: string;
  readonly notes?: string | null;
  readonly lines: readonly PostGoodsReceiptLineRequestDto[];
}
