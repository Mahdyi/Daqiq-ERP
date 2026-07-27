import { ApiQuery } from '@daqiq/core';

import { AuditLogOutcome } from './audit-log-outcome.model';

export interface AuditLogQuery extends ApiQuery {
  readonly search?: string;
  readonly actorUserId?: string;
  readonly action?: string;
  readonly entityType?: string;
  readonly outcome?: AuditLogOutcome;
  readonly dateFrom?: string;
  readonly dateTo?: string;
}
