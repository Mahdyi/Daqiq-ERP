export interface LookupType {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly system: boolean;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
