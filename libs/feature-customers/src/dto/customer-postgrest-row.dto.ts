import { CustomerType } from '../models/customer-type.model';

export interface CustomerPostgrestRow {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly customer_type: CustomerType;
  readonly credit_limit: number | string | null;
  readonly active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}
