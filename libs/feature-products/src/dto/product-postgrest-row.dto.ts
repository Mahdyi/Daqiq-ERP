import type { ProductType } from '../models/product-type.model';

export interface ProductPostgrestRow {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly description: string | null;
  readonly barcode: string | null;
  readonly product_type: ProductType;
  readonly category_lookup_value_id: string | null;
  readonly base_unit_lookup_value_id: string;
  readonly tax_rate_lookup_value_id: string | null;
  readonly track_inventory: boolean;
  readonly purchasable: boolean;
  readonly sellable: boolean;
  readonly standard_cost: number | string | null;
  readonly sales_price: number | string | null;
  readonly active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}
