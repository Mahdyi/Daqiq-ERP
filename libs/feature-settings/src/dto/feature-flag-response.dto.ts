export interface FeatureFlagResponseDto {
  readonly id: string;
  readonly flagKey: string;
  readonly enabled: boolean;
  readonly label: string;
  readonly description: string | null;
  readonly category: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
