import { ApiPage } from '@daqiq/core';

import { AuditLogPageResponseDto } from '../dto/audit-log-page-response.dto';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';
import { AuditLog } from '../models/audit-log.model';
import { AuditLogOutcome } from '../models/audit-log-outcome.model';

const SENSITIVE_METADATA_KEYS = new Set([
  'password',
  'new_password',
  'old_password',
  'accesstoken',
  'refreshtoken',
  'token',
  'authorization',
  'password_hash',
  'refresh_token_hash',
  'jwt',
  'secret'
]);

export function mapAuditLogResponseDto(dto: AuditLogResponseDto): AuditLog {
  return {
    id: dto.id,
    occurredAt: new Date(dto.occurredAt),
    actorUserId: dto.actorUserId,
    actorEmail: dto.actorEmail,
    actorRoles: dto.actorRoles,
    dbRole: dto.dbRole,
    action: dto.action,
    entityType: dto.entityType,
    entityId: dto.entityId,
    outcome: toAuditLogOutcome(dto.outcome),
    summary: dto.summary,
    metadata: sanitizeMetadata(dto.metadata),
    ipAddress: dto.ipAddress,
    userAgent: dto.userAgent,
    requestId: dto.requestId
  };
}

export function mapAuditLogPageResponseDto(
  dto: AuditLogPageResponseDto
): ApiPage<AuditLog> {
  return {
    items: dto.items.map(mapAuditLogResponseDto),
    page: Math.max(0, dto.page - 1),
    pageSize: dto.pageSize,
    totalItems: dto.totalItems,
    totalPages: dto.totalPages
  };
}

export function stringifySafeMetadata(metadata: Readonly<Record<string, unknown>>): string {
  return JSON.stringify(sanitizeMetadata(metadata), null, 2);
}

export function sanitizeMetadata(
  metadata: Readonly<Record<string, unknown>>
): Readonly<Record<string, unknown>> {
  return Object.fromEntries(
    Object.entries(metadata).filter(([key]) => !SENSITIVE_METADATA_KEYS.has(key.toLowerCase()))
  );
}

function toAuditLogOutcome(outcome: string): AuditLogOutcome {
  if (outcome === 'success' || outcome === 'failure' || outcome === 'blocked') {
    return outcome;
  }

  return 'failure';
}
