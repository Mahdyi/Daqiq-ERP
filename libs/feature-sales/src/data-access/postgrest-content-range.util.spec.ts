import { parsePostgrestContentRange } from './postgrest-content-range.util';

describe('parsePostgrestContentRange', () => {
  it('parses PostgREST content range totals', () => {
    expect(parsePostgrestContentRange('0-19/42')).toEqual({
      start: 0,
      end: 19,
      total: 42
    });
  });

  it('returns a zero range for malformed values', () => {
    expect(parsePostgrestContentRange(null).total).toBe(0);
    expect(parsePostgrestContentRange('invalid').total).toBe(0);
  });
});

