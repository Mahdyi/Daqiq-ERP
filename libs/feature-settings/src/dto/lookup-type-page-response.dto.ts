import type { LookupTypeResponseDto } from './lookup-type-response.dto';

export interface LookupTypePageResponseDto {
  readonly items: readonly LookupTypeResponseDto[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}
