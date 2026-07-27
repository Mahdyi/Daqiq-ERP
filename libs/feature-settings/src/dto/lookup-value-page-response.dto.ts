import type { LookupValueResponseDto } from './lookup-value-response.dto';

export interface LookupValuePageResponseDto {
  readonly items: readonly LookupValueResponseDto[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}
