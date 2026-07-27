import { AuditLogResponseDto } from './audit-log-response.dto';

export interface AuditLogPageResponseDto {
  readonly items: readonly AuditLogResponseDto[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}
