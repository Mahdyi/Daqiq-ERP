import type { ProductType } from './product-type.model';

export interface ProductFormValue {
  readonly sku: string | null;
  readonly name: string | null;
  readonly description: string | null;
  readonly barcode: string | null;
  readonly productType: ProductType | null;
  readonly categoryLookupValueId: string | null;
  readonly baseUnitLookupValueId: string | null;
  readonly taxRateLookupValueId: string | null;
  readonly trackInventory: boolean;
  readonly purchasable: boolean;
  readonly sellable: boolean;
  readonly standardCost: number | null;
  readonly salesPrice: number | null;
  readonly active: boolean;
}
