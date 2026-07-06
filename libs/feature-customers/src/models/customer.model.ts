import { CustomerType } from './customer-type.model';

export interface Customer {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly customerType: CustomerType;
  readonly creditLimit: number | null;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
