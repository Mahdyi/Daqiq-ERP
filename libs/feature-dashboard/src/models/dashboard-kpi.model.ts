export type DashboardTrendDirection = 'up' | 'down' | 'neutral';

export interface DashboardKpi {
  readonly key: string;
  readonly title: string;
  readonly value: number;
  readonly icon: string;
  readonly trendDirection: DashboardTrendDirection;
  readonly trendPercentage: number;
  readonly trendLabel: string;
}
