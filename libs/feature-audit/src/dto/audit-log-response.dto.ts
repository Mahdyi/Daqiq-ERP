export interface AuditLogResponseDto {
  readonly id: string;
  readonly occurredAt: string;
  readonly actorUserId: string | null;
  readonly actorEmail: string | null;
  readonly actorRoles: readonly string[];
  readonly dbRole: string | null;
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string | null;
  readonly outcome: string;
  readonly summary: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly requestId: string | null;
}
