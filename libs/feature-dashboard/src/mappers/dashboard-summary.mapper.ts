import { DashboardSummaryResponse } from '../dto/dashboard-summary-response.dto';
import { DashboardSummary } from '../models/dashboard-summary.model';

export function mapDashboardSummaryResponse(
  response: DashboardSummaryResponse
): DashboardSummary {
  return {
    kpis: response.kpis.map((kpi) => ({
      key: kpi.key,
      title: kpi.title,
      value: kpi.value,
      icon: kpi.icon,
      trendDirection: kpi.trend.direction,
      trendPercentage: kpi.trend.percentage,
      trendLabel: kpi.trend.label
    })),
    lastUpdatedAt: new Date(response.lastUpdatedAt)
  };
}
