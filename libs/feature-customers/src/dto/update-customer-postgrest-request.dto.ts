import { CustomerType } from '../models/customer-type.model';

export interface UpdateCustomerPostgrestRequest {
  readonly code: string;
  readonly name: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly customer_type: CustomerType;
  readonly credit_limit: number | null;
  readonly active: boolean;
}
