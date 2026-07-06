import { DataTableColumn } from '@daqiq/ui';

import { Customer } from '../models/customer.model';

const numberFormatter = new Intl.NumberFormat('fa-IR');

export const CUSTOMER_TABLE_COLUMNS = [
  {
    id: 'code',
    field: 'code',
    header: 'کد مشتری',
    sortable: true
  },
  {
    id: 'name',
    field: 'name',
    header: 'نام مشتری',
    sortable: true
  },
  {
    id: 'customerType',
    field: 'customerType',
    header: 'نوع مشتری',
    formatter: (value) => formatCustomerType(value)
  },
  {
    id: 'email',
    field: 'email',
    header: 'ایمیل',
    formatter: (value) => formatNullable(value)
  },
  {
    id: 'phone',
    field: 'phone',
    header: 'شماره تماس',
    formatter: (value) => formatNullable(value)
  },
  {
    id: 'creditLimit',
    field: 'creditLimit',
    header: 'سقف اعتبار',
    align: 'end',
    sortable: true,
    formatter: (value) => formatCreditLimit(value)
  },
  {
    id: 'active',
    field: 'active',
    header: 'وضعیت',
    sortable: true,
    formatter: (value) => (value === true ? 'فعال' : 'غیرفعال')
  }
] as const satisfies readonly DataTableColumn<Customer>[];

export function formatCustomerType(value: unknown): string {
  return value === 'individual' ? 'حقیقی' : value === 'corporate' ? 'حقوقی' : '-';
}

export function formatCreditLimit(value: unknown): string {
  return typeof value === 'number' ? numberFormatter.format(value) : '-';
}

export function formatNullable(value: unknown): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : '-';
}
