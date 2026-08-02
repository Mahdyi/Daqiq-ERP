import { parsePostgrestContentRange } from './postgrest-content-range.util';

describe('parsePostgrestContentRange', () => {
  it('parses normal PostgREST content ranges', () => {
    expect(parsePostgrestContentRange('0-19/42')).toEqual({
      from: 0,
      to: 19,
      total: 42
    });
  });

  it('parses empty PostgREST content ranges', () => {
    expect(parsePostgrestContentRange('*/0')).toEqual({
      from: null,
      to: null,
      total: 0
    });
  });

  it('rejects missing headers', () => {
    expect(() => parsePostgrestContentRange(null)).toThrow();
  });
});
