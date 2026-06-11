export interface ApiResponse<TData> {
  readonly data: TData;
  readonly message?: string;
  readonly success: boolean;
}

export interface ApiPageInfo {
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface PagedApiResponse<TData> extends ApiResponse<readonly TData[]> {
  readonly page: ApiPageInfo;
}
