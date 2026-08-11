export function formatDate(value: Date | null): string {
  return value ? new Intl.DateTimeFormat('fa-IR').format(value) : '-';
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(value);
}

export function formatNullable(value: string | null): string {
  return value ?? '-';
}

export function formatBoolean(value: boolean): string {
  return value ? 'فعال' : 'غیرفعال';
}

export function formatSettlementStatus(value: string): string {
  const labels: Readonly<Record<string, string>> = {
    unpaid: 'پرداخت‌نشده',
    partially_paid: 'نیمه‌تسویه',
    paid: 'تسویه‌شده'
  };

  return labels[value] ?? value;
}
