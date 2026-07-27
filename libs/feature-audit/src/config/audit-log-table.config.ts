import { DataTableColumn } from '@daqiq/ui';

import { AuditLog } from '../models/audit-log.model';
import { formatAuditLogOutcome } from '../models/audit-log-outcome.model';

const DATE_FORMATTER = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'short',
  timeStyle: 'short'
});

export const AUDIT_LOG_TABLE_COLUMNS: readonly DataTableColumn<AuditLog>[] = [
  {
    id: 'occurredAt',
    field: 'occurredAt',
    header: 'زمان',
    formatter: (_value, row) => DATE_FORMATTER.format(row.occurredAt)
  },
  {
    id: 'actorEmail',
    field: 'actorEmail',
    header: 'کاربر',
    formatter: (value) => value?.toString() ?? 'سامانه'
  },
  {
    id: 'action',
    field: 'action',
    header: 'عملیات'
  },
  {
    id: 'entityType',
    field: 'entityType',
    header: 'موجودیت'
  },
  {
    id: 'outcome',
    field: 'outcome',
    header: 'نتیجه',
    formatter: (_value, row) => formatAuditLogOutcome(row.outcome)
  },
  {
    id: 'summary',
    field: 'summary',
    header: 'توضیح'
  }
];
