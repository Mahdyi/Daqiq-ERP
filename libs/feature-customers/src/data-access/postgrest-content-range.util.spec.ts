import { parsePostgrestContentRange } from './postgrest-content-range.util';

describe('parsePostgrestContentRange', () => {
  it('parses exact totals', () => {
    expect(parsePostgrestContentRange('0-19/134')).toEqual({
      from: 0,
      to: 19,
      total: 134
    });
  });

  it('parses empty results', () => {
    expect(parsePostgrestContentRange('*/0')).toEqual({
      from: null,
      to: null,
      total: 0
    });
  });

  it('rejects malformed values', () => {
    expect(() => parsePostgrestContentRange('bad')).toThrowError();
  });
});
