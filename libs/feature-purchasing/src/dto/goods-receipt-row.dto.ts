import type { GoodsReceiptStatus } from '../models/goods-receipt-status.model';

export interface GoodsReceiptRowDto {
  readonly id: string;
  readonly receipt_number: string;
  readonly purchase_order_id: string;
  readonly purchase_order_number: string;
  readonly supplier_id: string;
  readonly supplier_code: string;
  readonly supplier_name: string;
  readonly status_code: GoodsReceiptStatus;
  readonly status_label: string;
  readonly receipt_date: string;
  readonly warehouse_id: string;
  readonly warehouse_code: string;
  readonly warehouse_name: string;
  readonly notes: string | null;
  readonly posted_by_email: string | null;
  readonly posted_at: string | null;
  readonly cancelled_by_email: string | null;
  readonly cancelled_at: string | null;
  readonly created_by_email: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}
