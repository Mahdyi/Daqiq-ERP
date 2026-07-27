import { AuditLogResponseDto } from '../dto/audit-log-response.dto';
import { formatAuditLogOutcome } from '../models/audit-log-outcome.model';
import { mapAuditLogResponseDto, stringifySafeMetadata } from './audit-log.mapper';

const RESPONSE: AuditLogResponseDto = {
  id: '00000000-0000-4000-8000-000000000030',
  occurredAt: '2026-07-27T10:00:00.000Z',
  actorUserId: null,
  actorEmail: 'admin@erp.com',
  actorRoles: ['admin'],
  dbRole: 'erp_admin',
  action: 'user.created',
  entityType: 'user',
  entityId: '00000000-0000-4000-8000-000000000031',
  outcome: 'success',
  summary: 'User created',
  metadata: {
    email: 'test@example.com',
    password: 'must-not-render',
    refreshToken: 'must-not-render'
  },
  ipAddress: null,
  userAgent: null,
  requestId: null
};

describe('audit-log mapper', () => {
  it('maps dates and sanitizes sensitive metadata', () => {
    const log = mapAuditLogResponseDto(RESPONSE);

    expect(log.occurredAt instanceof Date).toBeTrue();
    expect(log.metadata['email']).toBe('test@example.com');
    expect(log.metadata['password']).toBeUndefined();
    expect(log.metadata['refreshToken']).toBeUndefined();
  });

  it('formats outcome labels in Persian', () => {
    expect(formatAuditLogOutcome('success')).toBe('موفق');
    expect(formatAuditLogOutcome('failure')).toBe('ناموفق');
    expect(formatAuditLogOutcome('blocked')).toBe('مسدود');
  });

  it('pretty prints sanitized metadata', () => {
    const text = stringifySafeMetadata(RESPONSE.metadata);

    expect(text).toContain('test@example.com');
    expect(text).not.toContain('must-not-render');
  });
});
