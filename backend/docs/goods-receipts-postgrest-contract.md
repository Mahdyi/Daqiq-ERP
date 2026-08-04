# Goods Receipts PostgREST Contract

This contract describes the purchasing receiving API exposed by PostgREST. Angular never connects directly to PostgreSQL; all access goes through PostgREST and PostgreSQL roles/RLS.

## Resources

Read endpoints:

```text
GET /purchase_order_receiving_view
GET /purchase_order_line_receiving_view?purchase_order_id=eq.<uuid>
GET /goods_receipt_view
GET /goods_receipt_view?id=eq.<uuid>
GET /goods_receipt_line_view?goods_receipt_id=eq.<uuid>
```

Command RPCs:

```text
POST /rpc/post_goods_receipt
POST /rpc/cancel_goods_receipt
```

`post_goods_receipt` receives an approved purchase order and writes the goods receipt lines, inventory movements, inventory balance updates, and audit events in one PostgreSQL transaction.

## Post Goods Receipt

Request:

```json
{
  "purchase_order_id": "<purchase-order-uuid>",
  "receipt_date": "2026-08-04",
  "warehouse_id": "<warehouse-uuid>",
  "notes": "optional note",
  "lines": [
    {
      "purchase_order_line_id": "<purchase-order-line-uuid>",
      "received_quantity": 5,
      "storage_location_id": "<storage-location-uuid-or-null>",
      "notes": "optional line note"
    }
  ]
}
```

Response is a raw JSON object:

```json
{
  "id": "...",
  "receiptNumber": "GR-2026-000001",
  "purchaseOrderId": "...",
  "purchaseOrderNumber": "...",
  "supplierId": "...",
  "supplierCode": "...",
  "supplierName": "...",
  "statusCode": "posted",
  "statusLabel": "ثبت‌شده",
  "receiptDate": "2026-08-04",
  "warehouseId": "...",
  "warehouseCode": "...",
  "warehouseName": "...",
  "notes": null,
  "postedByEmail": "admin@erp.com",
  "postedAt": "2026-08-04T00:00:00Z",
  "cancelledByEmail": null,
  "cancelledAt": null,
  "createdByEmail": "admin@erp.com",
  "createdAt": "2026-08-04T00:00:00Z",
  "updatedAt": "2026-08-04T00:00:00Z"
}
```

Rules:

- The purchase order must be `approved`.
- Partial receiving is allowed.
- Receiving more than the remaining ordered quantity is blocked by PostgreSQL.
- The product and unit must match the purchase order line.
- The warehouse and storage location must be valid and active.
- No inventory movement is created by purchase order creation, submission, or approval. Inventory changes only when a goods receipt is posted.
- If all purchase order lines are fully received, the purchase order is automatically moved to `closed`.

## Cancel Goods Receipt

Request:

```json
{
  "goods_receipt_id": "<goods-receipt-uuid>"
}
```

Cancellation is allowed only for posted receipts. PostgreSQL creates reversing inventory movements and updates balances in the same transaction. The original receipt is marked `cancelled`; lines and movement references remain for traceability.

## Pagination

List pages use normal PostgREST pagination:

```text
Range-Unit: items
Range: start-end
Prefer: count=exact
```

Angular reads the total from `Content-Range`.

## Authorization Matrix

| Role | View | Create/Post | Cancel |
| --- | ---: | ---: | ---: |
| `erp_admin` | yes | yes | yes |
| `erp_manager` | yes | yes | yes |
| `erp_warehouse` | yes | yes | no |
| `erp_accountant` | yes | no | no |
| `erp_sales` | no | no | no |
| `erp_viewer` | no | no | no |
| `erp_anon` | no | no | no |

PostgreSQL grants and RLS are the final enforcement boundary. Angular route guards and hidden buttons are convenience controls only.

## Audit Events

The backend writes audit events for:

```text
goodsReceipt.posted
goodsReceipt.inventoryPosted
goodsReceipt.cancelled
goodsReceipt.overReceiptBlocked
```

Audit metadata is intentionally small and contains receipt/order/supplier/warehouse identifiers and line counts. Passwords, tokens, JWT secrets, and credential hashes must never be logged.

## Error Behavior

Important cases:

- `401/403`: missing or unauthorized role.
- `400`: database validation failure, invalid transition, invalid quantity, invalid location, or over-receipt.
- `409`: unique receipt number conflict, if it occurs.

Frontend code should present safe Persian messages and should not depend on PostgreSQL internals for business copy.
