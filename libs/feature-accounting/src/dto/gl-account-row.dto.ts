import type { GlAccountType } from '../models/gl-account.model';

export interface GlAccountRowDto {
  readonly id: string;
  readonly account_code: string;
  readonly account_name: string;
  readonly account_type_lookup_value_id: string;
  readonly account_type_code: GlAccountType;
  readonly account_type_label: string;
  readonly parent_account_id: string | null;
  readonly parent_account_code: string | null;
  readonly parent_account_name: string | null;
  readonly description: string | null;
  readonly is_postable: boolean;
  readonly active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}
