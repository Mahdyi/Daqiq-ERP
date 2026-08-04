import { parsePostgrestContentRange } from './postgrest-content-range.util';

describe('parsePostgrestContentRange', () => {
  it('parses PostgREST content range totals', () => {
    expect(parsePostgrestContentRange('0-19/42')).toEqual({
      from: 0,
      to: 19,
      total: 42
    });
  });

  it('fails clearly for missing headers', () => {
    expect(() => parsePostgrestContentRange(null)).toThrowError(
      'PostgREST Content-Range header is missing.'
    );
  });
});
