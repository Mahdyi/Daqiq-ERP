export type AuditLogOutcome = 'success' | 'failure' | 'blocked';

export function formatAuditLogOutcome(outcome: AuditLogOutcome): string {
  switch (outcome) {
    case 'success':
      return 'موفق';
    case 'failure':
      return 'ناموفق';
    case 'blocked':
      return 'مسدود';
  }
}
