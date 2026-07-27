export interface LookupTypeResponseDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly system: boolean;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
