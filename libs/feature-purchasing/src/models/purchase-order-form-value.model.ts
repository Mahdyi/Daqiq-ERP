export interface PurchaseOrderFormValue {
  readonly supplierId: string | null;
  readonly orderDate: Date | null;
  readonly expectedDate: Date | null;
  readonly currencyLookupValueId: string | null;
  readonly deliveryWarehouseId: string | null;
  readonly notes: string | null;
}

export interface PurchaseOrderLineFormValue {
  readonly clientId: string;
  readonly productId: string | null;
  readonly description: string | null;
  readonly quantity: number | null;
  readonly unitLookupValueId: string | null;
  readonly unitPrice: number | null;
  readonly taxRateLookupValueId: string | null;
}
