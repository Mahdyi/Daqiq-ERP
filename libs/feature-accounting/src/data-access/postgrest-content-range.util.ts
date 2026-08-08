export interface PostgrestContentRange {
  readonly start: number;
  readonly end: number;
  readonly total: number;
}

export function parsePostgrestContentRange(value: string | null): PostgrestContentRange {
  if (!value) {
    return { start: 0, end: 0, total: 0 };
  }

  const match = /^(?<start>\d+)-(?<end>\d+)\/(?<total>\d+|\*)$/.exec(value);

  if (!match?.groups) {
    return { start: 0, end: 0, total: 0 };
  }

  return {
    start: Number(match.groups['start']),
    end: Number(match.groups['end']),
    total: match.groups['total'] === '*' ? 0 : Number(match.groups['total'])
  };
}
