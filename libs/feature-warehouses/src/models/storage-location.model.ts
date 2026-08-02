export interface StorageLocation {
  readonly id: string;
  readonly warehouseId: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly locationTypeLookupValueId: string | null;
  readonly parentLocationId: string | null;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
