export interface PostgrestContentRange {
  readonly start: number;
  readonly end: number;
  readonly total: number;
}

export function parsePostgrestContentRange(value: string | null): PostgrestContentRange {
  if (!value) {
    return { start: 0, end: 0, total: 0 };
  }

  const match = /^(\d+)-(\d+)\/(\d+|\*)$/.exec(value);

  if (!match) {
    return { start: 0, end: 0, total: 0 };
  }

  return {
    start: Number(match[1]),
    end: Number(match[2]),
    total: match[3] === '*' ? 0 : Number(match[3])
  };
}
