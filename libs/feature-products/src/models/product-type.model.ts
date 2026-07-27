export type ProductType =
  | 'raw_material'
  | 'finished_good'
  | 'packaging'
  | 'service'
  | 'spare_part';

export const PRODUCT_TYPE_OPTIONS: readonly {
  readonly label: string;
  readonly value: ProductType;
}[] = [
  { label: 'ماده اولیه', value: 'raw_material' },
  { label: 'محصول نهایی', value: 'finished_good' },
  { label: 'بسته‌بندی', value: 'packaging' },
  { label: 'خدمت', value: 'service' },
  { label: 'قطعه یدکی', value: 'spare_part' }
];

export function formatProductType(value: ProductType): string {
  return PRODUCT_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
