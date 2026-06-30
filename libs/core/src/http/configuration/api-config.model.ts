export interface ApiConfig {
  readonly baseUrl: string;
  readonly timeoutMs?: number;
  readonly defaultHeaders?: Readonly<Record<string, string>>;
}
