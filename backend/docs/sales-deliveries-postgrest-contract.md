# Sales Deliveries / Shipments PostgREST Contract

Sales deliveries record the physical shipment of confirmed sales orders and are the only sales document in this foundation that decreases inventory.

## Endpoints

Read endpoints:

```text
GET /sales_delivery_view
GET /sales_delivery_view?id=eq.<uuid>
GET /sales_delivery_line_view?sales_delivery_id=eq.<uuid>
GET /sales_order_line_delivery_view?sales_order_id=eq.<uuid>
GET /sales_order_delivery_view?sales_order_id=eq.<uuid>
```

Command RPCs:

```text
POST /rpc/post_sales_delivery
POST /rpc/cancel_sales_delivery
```

`api.sales_deliveries` and `api.sales_delivery_lines` are readable through approved views. Writes go through RPCs because shipment posting must validate the sales order and inventory in one PostgreSQL transaction.

## Post Delivery

Request:

```json
{
  "sales_order_id": "uuid",
  "delivery_date": "2026-08-04",
  "warehouse_id": "uuid",
  "notes": "optional",
  "lines": [
    {
      "salesOrderLineId": "uuid",
      "shippedQuantity": 400,
      "storageLocationId": "uuid-or-null",
      "notes": "optional"
    }
  ]
}
```

The backend generates `delivery_number`, validates the confirmed sales order, blocks over-delivery, blocks negative stock when `inventory.allowNegativeStock = false`, creates `sales_shipment` inventory movements, decreases inventory balances, stores movement references on delivery lines, and audits the event.

Sales order creation and confirmation do not change inventory.

## Cancel Delivery

Request:

```json
{
  "sales_delivery_id": "uuid"
}
```

Only posted deliveries can be cancelled. Cancellation creates `sales_shipment_reversal` inventory movements and restores inventory balances.

## Permissions

| Role | View | Create | Post | Cancel |
| --- | ---: | ---: | ---: | ---: |
| `erp_admin` | yes | yes | yes | yes |
| `erp_manager` | yes | yes | yes | yes |
| `erp_warehouse` | yes | yes | yes | no |
| `erp_sales` | yes | yes | no | no |
| `erp_accountant` | yes | no | no | no |
| `erp_viewer` | no | no | no | no |
| `erp_anon` | no | no | no | no |

Frontend permissions mirror this through:

```text
salesDeliveries.view
salesDeliveries.create
salesDeliveries.post
salesDeliveries.cancel
```

## Business Validation

- Sales order must be `confirmed`.
- Draft, submitted, cancelled, and closed orders cannot be shipped.
- Product and unit must match the sales order line.
- Products must be active and inventory-tracked.
- Shipped quantity must be positive.
- Shipped quantity cannot exceed remaining ordered quantity.
- Warehouse must be active.
- Storage location must belong to the selected warehouse.
- Non-inventory/service lines are rejected in this first shipment foundation.

## Progress Views

`sales_order_line_delivery_view` returns ordered, shipped, and remaining quantity per sales order line. Only posted deliveries count. Cancelled deliveries do not count.

## Audit

The migration audits:

```text
salesDelivery.posted
salesDelivery.cancelled
salesDelivery.inventoryPosted
salesDelivery.overDeliveryBlocked
salesDelivery.negativeStockBlocked
```

Metadata is intentionally small and excludes secrets.
