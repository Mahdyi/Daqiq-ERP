import type { CreateProductPostgrestRequest } from '../dto/create-product-postgrest-request.dto';
import type { UpdateProductPostgrestRequest } from '../dto/update-product-postgrest-request.dto';
import type { Product } from '../models/product.model';
import type { ProductFormValue } from '../models/product-form-value.model';
import type { ProductType } from '../models/product-type.model';

export const DEFAULT_PRODUCT_FORM_VALUE: ProductFormValue = {
  sku: null,
  name: null,
  description: null,
  barcode: null,
  productType: 'finished_good',
  categoryLookupValueId: null,
  baseUnitLookupValueId: null,
  taxRateLookupValueId: null,
  trackInventory: true,
  purchasable: true,
  sellable: true,
  standardCost: null,
  salesPrice: null,
  active: true
};

export function mapProductToFormValue(product: Product): ProductFormValue {
  return {
    sku: product.sku,
    name: product.name,
    description: product.description,
    barcode: product.barcode,
    productType: product.productType,
    categoryLookupValueId: product.categoryLookupValueId,
    baseUnitLookupValueId: product.baseUnitLookupValueId,
    taxRateLookupValueId: product.taxRateLookupValueId,
    trackInventory: product.trackInventory,
    purchasable: product.purchasable,
    sellable: product.sellable,
    standardCost: product.standardCost,
    salesPrice: product.salesPrice,
    active: product.active
  };
}

export function mapFormValueToCreateProductRequest(
  value: Readonly<ProductFormValue>
): CreateProductPostgrestRequest {
  const productType = value.productType ?? 'finished_good';

  return {
    sku: requiredText(value.sku),
    name: requiredText(value.name),
    description: optionalText(value.description),
    barcode: optionalText(value.barcode),
    product_type: productType,
    category_lookup_value_id: value.categoryLookupValueId,
    base_unit_lookup_value_id: requiredText(value.baseUnitLookupValueId),
    tax_rate_lookup_value_id: value.taxRateLookupValueId,
    track_inventory: productType === 'service' ? false : value.trackInventory,
    purchasable: value.purchasable,
    sellable: value.sellable,
    standard_cost: value.standardCost,
    sales_price: value.salesPrice,
    active: value.active
  };
}

export function mapFormValueToUpdateProductRequest(
  value: Readonly<ProductFormValue>
): UpdateProductPostgrestRequest {
  return mapFormValueToCreateProductRequest(value);
}

export function isProductType(value: ProductType | null): value is ProductType {
  return value !== null;
}

function requiredText(value: string | null): string {
  return (value ?? '').trim();
}

function optionalText(value: string | null): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}
