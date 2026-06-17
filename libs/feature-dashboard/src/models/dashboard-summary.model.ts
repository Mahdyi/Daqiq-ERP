import { DashboardKpi } from './dashboard-kpi.model';

export interface DashboardSummary {
  readonly kpis: readonly DashboardKpi[];
  readonly lastUpdatedAt: Date;
}
