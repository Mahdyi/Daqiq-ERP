import { CustomerType } from './customer-type.model';

export interface CustomerFormValue {
  readonly code: string | null;
  readonly name: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly customerType: CustomerType | null;
  readonly creditLimit: number | null;
  readonly active: boolean;
}
