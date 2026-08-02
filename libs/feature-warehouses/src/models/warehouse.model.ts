export interface Warehouse {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly warehouseTypeLookupValueId: string | null;
  readonly address: string | null;
  readonly responsiblePerson: string | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
