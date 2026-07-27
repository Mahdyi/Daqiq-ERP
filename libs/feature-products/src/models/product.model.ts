import type { ProductType } from './product-type.model';

export interface Product {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly description: string | null;
  readonly barcode: string | null;
  readonly productType: ProductType;
  readonly categoryLookupValueId: string | null;
  readonly baseUnitLookupValueId: string;
  readonly taxRateLookupValueId: string | null;
  readonly trackInventory: boolean;
  readonly purchasable: boolean;
  readonly sellable: boolean;
  readonly standardCost: number | null;
  readonly salesPrice: number | null;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
