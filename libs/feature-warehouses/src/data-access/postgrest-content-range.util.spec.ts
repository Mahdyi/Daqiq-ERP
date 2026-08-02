import { parsePostgrestContentRange } from './postgrest-content-range.util';

describe('parsePostgrestContentRange', () => {
  it('parses normal content ranges', () => {
    expect(parsePostgrestContentRange('0-19/42')).toEqual({
      from: 0,
      to: 19,
      total: 42
    });
  });

  it('parses empty content ranges', () => {
    expect(parsePostgrestContentRange('*/0')).toEqual({
      from: null,
      to: null,
      total: 0
    });
  });

  it('rejects malformed content ranges', () => {
    expect(() => parsePostgrestContentRange('bad')).toThrow();
  });
});
