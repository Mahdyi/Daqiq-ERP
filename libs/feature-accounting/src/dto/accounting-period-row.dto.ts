export interface AccountingPeriodRowDto {
  readonly id: string;
  readonly period_code: string;
  readonly period_name: string;
  readonly start_date: string;
  readonly end_date: string;
  readonly is_closed: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}
