import { parsePostgrestContentRange } from './postgrest-content-range.util';

describe('parsePostgrestContentRange', () => {
  it('parses normal PostgREST content range values', () => {
    expect(parsePostgrestContentRange('0-19/42')).toEqual({
      from: 0,
      to: 19,
      total: 42
    });
  });

  it('rejects invalid values', () => {
    expect(() => parsePostgrestContentRange('invalid')).toThrow();
  });
});
