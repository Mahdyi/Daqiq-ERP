# Products PostgREST Contract

Products are the ERP item catalog used by later inventory, purchasing, sales, invoicing, and reporting modules.

## Endpoints

Products are exposed through the approved `api.products` table:

```http
GET    /products
GET    /products?id=eq.<uuid>
POST   /products
PATCH  /products?id=eq.<uuid>
DELETE /products?id=eq.<uuid>
```

Angular must call these endpoints through `ApiClient`; it must not connect directly to PostgreSQL.

## Product Shape

The API uses database column names:

```json
{
  "id": "uuid",
  "sku": "FG-PUMP-100",
  "name": "پمپ آب خانگی",
  "description": null,
  "barcode": "6260000001001",
  "product_type": "finished_good",
  "category_lookup_value_id": "uuid-or-null",
  "base_unit_lookup_value_id": "uuid",
  "tax_rate_lookup_value_id": "uuid-or-null",
  "track_inventory": true,
  "purchasable": true,
  "sellable": true,
  "standard_cost": 3200.00,
  "sales_price": 4800.00,
  "active": true,
  "created_at": "2026-...",
  "updated_at": "2026-..."
}
```

## Lookup References

Database triggers enforce lookup type correctness:

- `category_lookup_value_id` must belong to `product_category`.
- `base_unit_lookup_value_id` must belong to `unit`.
- `tax_rate_lookup_value_id` must belong to `tax_rate`.

New and updated products must reference active lookup values. Existing products may keep historical inactive lookup values until a stricter lifecycle policy is introduced.

## Validation

- `sku` is required and unique case-insensitively.
- `name` is required.
- `product_type` must be one of `raw_material`, `finished_good`, `packaging`, `service`, `spare_part`.
- `standard_cost` and `sales_price` must be null or non-negative.
- Service products must have `track_inventory = false`.
- Sellable products may have null `sales_price` for now; price-list rules will be introduced later.

## Pagination and Search

List requests should use:

```http
Range-Unit: items
Range: 0-19
Prefer: count=exact
```

The frontend reads total count from `Content-Range`.

Supported search convention:

```http
/products?or=(sku.ilike.*term*,name.ilike.*term*,barcode.ilike.*term*,description.ilike.*term*)
```

Supported filters:

- `active=eq.true|false`
- `product_type=eq.<type>`
- `category_lookup_value_id=eq.<uuid>`

Sorting must use a frontend whitelist mapped to database columns.

## Role Access

| Database role | SELECT | INSERT | UPDATE | DELETE |
| --- | ---: | ---: | ---: | ---: |
| `erp_admin` | yes | yes | yes | yes |
| `erp_manager` | yes | yes | yes | no |
| `erp_warehouse` | yes | no | yes | no |
| `erp_sales` | yes | no | no | no |
| `erp_accountant` | yes | no | no | no |
| `erp_viewer` | no | no | no | no |
| `erp_anon` | no | no | no | no |

PostgreSQL grants and RLS policies both enforce this matrix.

## Audit

Product mutations create audit events:

- `product.created`
- `product.updated`
- `product.activated`
- `product.deactivated`
- `product.deleted`

Audit metadata is intentionally small and safe: SKU, name, product type, and active state.

## Non-Goals

This step does not implement stock quantities, warehouses, suppliers, purchase orders, sales orders, invoices, price lists, product images, BOMs, barcode scanning, or variants.
