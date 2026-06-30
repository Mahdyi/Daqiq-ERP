export interface ApiPageRequest {
  readonly page: number;
  readonly pageSize: number;
  readonly sort?: readonly string[];
}

export interface ApiPage<TItem> {
  readonly items: readonly TItem[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}
