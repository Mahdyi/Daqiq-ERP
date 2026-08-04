export type PurchaseOrderStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'cancelled'
  | 'closed';

export function purchaseOrderStatusLabel(status: PurchaseOrderStatus): string {
  switch (status) {
    case 'draft':
      return 'پیش‌نویس';
    case 'submitted':
      return 'ارسال‌شده';
    case 'approved':
      return 'تأییدشده';
    case 'cancelled':
      return 'لغوشده';
    case 'closed':
      return 'بسته‌شده';
  }
}
