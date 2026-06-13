export type FilterType = 'string' | 'number' | 'select';

export type FilterValue = string | number | null;

export interface FilterOption {
  readonly label: string;
  readonly value: FilterValue;
  readonly disabled?: boolean;
}

export interface FilterDefinition<TKey extends string = string> {
  readonly key: TKey;
  readonly label: string;
  readonly type: FilterType;
  readonly placeholder?: string;
  readonly options?: readonly FilterOption[];
  readonly disabled?: boolean;
}

export interface FilterChange<TKey extends string = string> {
  readonly key: TKey;
  readonly value: FilterValue;
}
