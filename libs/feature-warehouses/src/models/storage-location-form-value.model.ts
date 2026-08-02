export interface StorageLocationFormValue {
  readonly warehouseId: string | null;
  readonly code: string | null;
  readonly name: string | null;
  readonly description: string | null;
  readonly locationTypeLookupValueId: string | null;
  readonly parentLocationId: string | null;
  readonly active: boolean;
}
