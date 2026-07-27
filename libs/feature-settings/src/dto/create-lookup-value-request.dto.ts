export interface CreateLookupValueRequest {
  readonly lookupTypeCode: string;
  readonly code: string;
  readonly label: string;
  readonly description: string | null;
  readonly sortOrder: number;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly active: boolean;
}

export interface CreateLookupValueRpcRequestDto {
  readonly lookup_type_code: string;
  readonly lookup_code: string;
  readonly lookup_label: string;
  readonly lookup_description: string | null;
  readonly lookup_sort_order: number;
  readonly lookup_metadata: Readonly<Record<string, unknown>>;
  readonly lookup_active: boolean;
}
