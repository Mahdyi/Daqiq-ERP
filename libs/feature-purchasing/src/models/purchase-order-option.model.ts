export interface PurchaseOrderOption {
  readonly id: string;
  readonly label: string;
}

export interface PurchaseOrderProductOption extends PurchaseOrderOption {
  readonly sku: string;
  readonly baseUnitLookupValueId: string;
  readonly baseUnitLabel: string;
}
