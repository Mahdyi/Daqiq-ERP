import type { SystemSettingResponseDto } from './system-setting-response.dto';

export interface SystemSettingPageResponseDto {
  readonly items: readonly SystemSettingResponseDto[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}
