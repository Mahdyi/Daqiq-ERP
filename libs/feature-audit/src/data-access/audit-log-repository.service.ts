import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiPage } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import { AuditLogPageResponseDto } from '../dto/audit-log-page-response.dto';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';
import { mapAuditLogPageResponseDto, mapAuditLogResponseDto } from '../mappers/audit-log.mapper';
import { AuditLog } from '../models/audit-log.model';
import { AuditLogQuery } from '../models/audit-log-query.model';

interface ListAuditLogsRpcRequestDto {
  readonly search?: string;
  readonly actor_user_id?: string;
  readonly action?: string;
  readonly entity_type?: string;
  readonly outcome?: string;
  readonly date_from?: string;
  readonly date_to?: string;
  readonly page_number: number;
  readonly page_size: number;
}

interface AuditLogIdRpcRequestDto {
  readonly log_id: string;
}

@Injectable()
export class AuditLogRepository {
  private readonly api = inject(ApiClient);

  list(query?: AuditLogQuery): Observable<ApiPage<AuditLog>> {
    const request: ListAuditLogsRpcRequestDto = {
      search: query?.search,
      actor_user_id: query?.actorUserId,
      action: query?.action,
      entity_type: query?.entityType,
      outcome: query?.outcome,
      date_from: query?.dateFrom,
      date_to: query?.dateTo,
      page_number: (query?.page ?? 0) + 1,
      page_size: query?.pageSize ?? 20
    };

    return this.api
      .post<ListAuditLogsRpcRequestDto, AuditLogPageResponseDto>(
        'rpc/admin_list_audit_logs',
        request,
        { responseShape: 'raw' }
      )
      .pipe(map(mapAuditLogPageResponseDto));
  }

  getById(id: string): Observable<AuditLog> {
    return this.api
      .post<AuditLogIdRpcRequestDto, AuditLogResponseDto>(
        'rpc/admin_get_audit_log',
        { log_id: id },
        { responseShape: 'raw' }
      )
      .pipe(map(mapAuditLogResponseDto));
  }
}
