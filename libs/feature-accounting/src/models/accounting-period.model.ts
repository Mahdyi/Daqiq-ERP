export interface AccountingPeriod {
  readonly id: string;
  readonly periodCode: string;
  readonly periodName: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly isClosed: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
