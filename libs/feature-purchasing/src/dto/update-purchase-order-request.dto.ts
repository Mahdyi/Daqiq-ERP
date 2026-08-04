import type { PurchaseOrderLineRequestDto } from './create-purchase-order-request.dto';

export interface UpdatePurchaseOrderRequestDto {
  readonly purchase_order_id: string;
  readonly supplier_id: string;
  readonly order_date: string;
  readonly expected_date?: string | null;
  readonly currency_lookup_value_id?: string | null;
  readonly delivery_warehouse_id?: string | null;
  readonly notes?: string | null;
  readonly lines: readonly PurchaseOrderLineRequestDto[];
}
