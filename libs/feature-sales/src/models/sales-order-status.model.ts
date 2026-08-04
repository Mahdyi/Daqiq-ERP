export type SalesOrderStatus =
  | 'draft'
  | 'submitted'
  | 'confirmed'
  | 'cancelled'
  | 'closed';

export function salesOrderStatusLabel(status: SalesOrderStatus): string {
  switch (status) {
    case 'draft':
      return 'پیش‌نویس';
    case 'submitted':
      return 'ارسال‌شده';
    case 'confirmed':
      return 'تأییدشده';
    case 'cancelled':
      return 'لغوشده';
    case 'closed':
      return 'بسته‌شده';
  }
}
