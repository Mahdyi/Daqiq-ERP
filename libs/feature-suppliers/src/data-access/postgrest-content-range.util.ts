export interface PostgrestContentRange {
  readonly from: number | null;
  readonly to: number | null;
  readonly total: number;
}

export function parsePostgrestContentRange(value: string | null): PostgrestContentRange {
  if (value === null) {
    throw new Error('PostgREST Content-Range header is missing.');
  }

  const emptyMatch = value.trim().match(/^\*\/(\d+)$/);

  if (emptyMatch) {
    return {
      from: null,
      to: null,
      total: parsePositiveInteger(emptyMatch[1])
    };
  }

  const match = value.trim().match(/^(\d+)-(\d+)\/(\d+)$/);

  if (!match) {
    throw new Error(`Invalid PostgREST Content-Range header: ${value}`);
  }

  const from = parsePositiveInteger(match[1]);
  const to = parsePositiveInteger(match[2]);
  const total = parsePositiveInteger(match[3]);

  if (to < from) {
    throw new Error(`Invalid PostgREST Content-Range bounds: ${value}`);
  }

  return { from, to, total };
}

function parsePositiveInteger(value: string): number {
  if (!/^\d+$/.test(value)) {
    throw new Error(`Invalid integer value: ${value}`);
  }

  return Number(value);
}
