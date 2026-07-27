export interface FeatureFlag {
  readonly id: string;
  readonly flagKey: string;
  readonly enabled: boolean;
  readonly label: string;
  readonly description: string | null;
  readonly category: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
