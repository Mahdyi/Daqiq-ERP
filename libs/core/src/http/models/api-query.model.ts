export type ApiQueryValue =
  | string
  | number
  | boolean
  | readonly string[]
  | readonly number[];

export interface ApiQuery {
  readonly page?: number;
  readonly pageSize?: number;
  readonly sort?: readonly string[];
  readonly filters?: Readonly<Record<string, ApiQueryValue | undefined>>;
}
