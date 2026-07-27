export interface LookupValue {
  readonly id: string;
  readonly lookupTypeId: string;
  readonly lookupTypeCode: string;
  readonly code: string;
  readonly label: string;
  readonly description: string | null;
  readonly sortOrder: number;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly system: boolean;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
