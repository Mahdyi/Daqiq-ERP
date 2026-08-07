export interface CustomerReferenceRowDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
}

export interface ProductReferenceRowDto {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly base_unit_lookup_value_id: string;
}

export interface WarehouseReferenceRowDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
}

export interface StorageLocationReferenceRowDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly warehouse_id: string;
}

export interface LookupReferenceRowDto {
  readonly id: string;
  readonly code: string;
  readonly label: string;
}

export interface LookupReferencePageDto {
  readonly items: readonly LookupReferenceRowDto[];
}

