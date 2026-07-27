export interface UpdateFeatureFlagRequest {
  readonly flagKey: string;
  readonly enabled: boolean;
}

export interface UpdateFeatureFlagRpcRequestDto {
  readonly flag_key: string;
  readonly enabled: boolean;
}
