export interface DashboardSummaryResponse {
  readonly kpis: readonly {
    readonly key: string;
    readonly title: string;
    readonly value: number;
    readonly icon: string;
    readonly trend: {
      readonly direction: 'up' | 'down' | 'neutral';
      readonly percentage: number;
      readonly label: string;
    };
  }[];
  readonly lastUpdatedAt: string;
}
