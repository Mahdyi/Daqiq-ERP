import type { ApiQuery } from '@daqiq/core';
import type { Product } from './product.model';
import type { ProductType } from './product-type.model';

export interface ProductQuery extends ApiQuery {
  readonly search?: string;
  readonly active?: boolean;
  readonly productType?: ProductType;
  readonly categoryLookupValueId?: string;
  readonly sortField?: keyof Product;
  readonly sortDirection?: 'asc' | 'desc';
}
