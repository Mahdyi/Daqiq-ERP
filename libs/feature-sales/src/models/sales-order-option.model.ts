export interface SalesOrderOption {
  readonly id: string;
  readonly label: string;
}

export interface SalesOrderProductOption extends SalesOrderOption {
  readonly sku: string;
  readonly baseUnitLookupValueId: string;
  readonly baseUnitLabel: string;
}

