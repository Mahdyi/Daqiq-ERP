export type GoodsReceiptStatus = 'draft' | 'posted' | 'cancelled';

export function goodsReceiptStatusLabel(status: GoodsReceiptStatus): string {
  switch (status) {
    case 'draft':
      return 'پیش‌نویس';
    case 'posted':
      return 'ثبت‌شده';
    case 'cancelled':
      return 'لغوشده';
  }
}
