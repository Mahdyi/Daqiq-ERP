export interface ApiEnvelope<TData> {
  readonly data: TData;
  readonly traceId?: string;
  readonly message?: string;
}
