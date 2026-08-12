import type {
  AmountStatusReportRowDto,
  AuditActivitySummaryReportRowDto,
  GeneralLedgerSummaryReportRowDto,
  GoodsReceiptStatusReportRowDto,
  InventoryMovementSummaryReportRowDto,
  InventoryOnHandReportRowDto,
  JournalActivityReportRowDto,
  NumericDtoValue,
  PaymentSummaryReportRowDto,
  SalesDeliveryStatusReportRowDto,
  SalesInvoiceSettlementReportRowDto,
  SupplierInvoiceSettlementReportRowDto
} from '../dto/report-row.dto';
import type {
  AmountStatusReport,
  AuditActivitySummaryReport,
  GeneralLedgerSummaryReport,
  InventoryMovementSummaryReport,
  InventoryOnHandReport,
  JournalActivityReport,
  PaymentSummaryReport,
  QuantityStatusReport,
  SalesInvoiceSettlementReport,
  SupplierInvoiceSettlementReport
} from '../models/report-row.model';

export function mapInventoryOnHandReportRow(
  dto: InventoryOnHandReportRowDto
): InventoryOnHandReport {
  return {
    productId: dto.product_id,
    productSku: dto.product_sku,
    productName: dto.product_name,
    productType: dto.product_type,
    warehouseId: dto.warehouse_id,
    warehouseCode: dto.warehouse_code,
    warehouseName: dto.warehouse_name,
    storageLocationId: dto.storage_location_id,
    storageLocationCode: dto.storage_location_code,
    storageLocationName: dto.storage_location_name,
    unitCode: dto.unit_code,
    unitLabel: dto.unit_label,
    quantityOnHand: toNumber(dto.quantity_on_hand, 'quantity_on_hand'),
    lastMovementAt: toNullableDate(dto.last_movement_at, 'last_movement_at')
  };
}

export function mapInventoryMovementSummaryReportRow(
  dto: InventoryMovementSummaryReportRowDto
): InventoryMovementSummaryReport {
  return {
    productId: dto.product_id,
    productSku: dto.product_sku,
    productName: dto.product_name,
    warehouseId: dto.warehouse_id,
    warehouseCode: dto.warehouse_code,
    warehouseName: dto.warehouse_name,
    movementTypeCode: dto.movement_type_code,
    movementTypeLabel: dto.movement_type_label,
    movementCount: toNumber(dto.movement_count, 'movement_count'),
    totalQuantityIn: toNumber(dto.total_quantity_in, 'total_quantity_in'),
    totalQuantityOut: toNumber(dto.total_quantity_out, 'total_quantity_out'),
    firstMovementAt: toNullableDate(dto.first_movement_at, 'first_movement_at'),
    lastMovementAt: toNullableDate(dto.last_movement_at, 'last_movement_at')
  };
}

export function mapPurchaseOrderStatusReportRow(
  dto: AmountStatusReportRowDto
): AmountStatusReport {
  return mapAmountStatus(dto, dto.order_count);
}

export function mapSalesOrderStatusReportRow(
  dto: AmountStatusReportRowDto
): AmountStatusReport {
  return mapAmountStatus(dto, dto.order_count);
}

export function mapGoodsReceiptStatusReportRow(
  dto: GoodsReceiptStatusReportRowDto
): QuantityStatusReport {
  return {
    statusCode: dto.status_code,
    statusLabel: dto.status_label,
    documentCount: toNumber(dto.receipt_count, 'receipt_count'),
    lineCount: toNumber(dto.line_count, 'line_count'),
    totalQuantity: toNumber(dto.total_received_quantity, 'total_received_quantity')
  };
}

export function mapSalesDeliveryStatusReportRow(
  dto: SalesDeliveryStatusReportRowDto
): QuantityStatusReport {
  return {
    statusCode: dto.status_code,
    statusLabel: dto.status_label,
    documentCount: toNumber(dto.delivery_count, 'delivery_count'),
    lineCount: toNumber(dto.line_count, 'line_count'),
    totalQuantity: toNumber(dto.total_shipped_quantity, 'total_shipped_quantity')
  };
}

export function mapSalesInvoiceSettlementReportRow(
  dto: SalesInvoiceSettlementReportRowDto
): SalesInvoiceSettlementReport {
  return {
    customerId: dto.customer_id,
    customerCode: dto.customer_code,
    customerName: dto.customer_name,
    invoiceCount: toNumber(dto.invoice_count, 'invoice_count'),
    totalInvoicedAmount: toNumber(dto.total_invoiced_amount, 'total_invoiced_amount'),
    totalPaidAmount: toNumber(dto.total_paid_amount, 'total_paid_amount'),
    totalRemainingAmount: toNumber(dto.total_remaining_amount, 'total_remaining_amount'),
    overdueAmount: toNumber(dto.overdue_amount, 'overdue_amount')
  };
}

export function mapSupplierInvoiceSettlementReportRow(
  dto: SupplierInvoiceSettlementReportRowDto
): SupplierInvoiceSettlementReport {
  return {
    supplierId: dto.supplier_id,
    supplierCode: dto.supplier_code,
    supplierName: dto.supplier_name,
    invoiceCount: toNumber(dto.invoice_count, 'invoice_count'),
    totalInvoicedAmount: toNumber(dto.total_invoiced_amount, 'total_invoiced_amount'),
    totalPaidAmount: toNumber(dto.total_paid_amount, 'total_paid_amount'),
    totalRemainingAmount: toNumber(dto.total_remaining_amount, 'total_remaining_amount'),
    overdueAmount: toNumber(dto.overdue_amount, 'overdue_amount')
  };
}

export function mapGeneralLedgerSummaryReportRow(
  dto: GeneralLedgerSummaryReportRowDto
): GeneralLedgerSummaryReport {
  return {
    accountId: dto.account_id,
    accountCode: dto.account_code,
    accountName: dto.account_name,
    accountTypeCode: dto.account_type_code,
    debitAmount: toNumber(dto.debit_amount, 'debit_amount'),
    creditAmount: toNumber(dto.credit_amount, 'credit_amount'),
    netAmount: toNumber(dto.net_amount, 'net_amount'),
    journalLineCount: toNumber(dto.journal_line_count, 'journal_line_count')
  };
}

export function mapJournalActivityReportRow(
  dto: JournalActivityReportRowDto
): JournalActivityReport {
  return {
    sourceTypeCode: dto.source_type_code,
    sourceTypeLabel: dto.source_type_label,
    journalCount: toNumber(dto.journal_count, 'journal_count'),
    totalDebit: toNumber(dto.total_debit, 'total_debit'),
    totalCredit: toNumber(dto.total_credit, 'total_credit'),
    firstJournalDate: toNullableDate(dto.first_journal_date, 'first_journal_date'),
    lastJournalDate: toNullableDate(dto.last_journal_date, 'last_journal_date')
  };
}

export function mapPaymentSummaryReportRow(
  dto: PaymentSummaryReportRowDto
): PaymentSummaryReport {
  return {
    paymentDirection: dto.payment_direction,
    paymentCount: toNumber(dto.payment_count, 'payment_count'),
    totalAmount: toNumber(dto.total_amount, 'total_amount'),
    firstPaymentDate: toNullableDate(dto.first_payment_date, 'first_payment_date'),
    lastPaymentDate: toNullableDate(dto.last_payment_date, 'last_payment_date')
  };
}

export function mapAuditActivitySummaryReportRow(
  dto: AuditActivitySummaryReportRowDto
): AuditActivitySummaryReport {
  return {
    action: dto.action,
    entityType: dto.entity_type,
    actorEmail: dto.actor_email,
    eventCount: toNumber(dto.event_count, 'event_count'),
    firstEventAt: toNullableDate(dto.first_event_at, 'first_event_at'),
    lastEventAt: toNullableDate(dto.last_event_at, 'last_event_at')
  };
}

function mapAmountStatus(dto: AmountStatusReportRowDto, count: NumericDtoValue): AmountStatusReport {
  return {
    statusCode: dto.status_code,
    statusLabel: dto.status_label,
    itemCount: toNumber(count, 'order_count'),
    subtotalAmount: toNumber(dto.subtotal_amount, 'subtotal_amount'),
    taxAmount: toNumber(dto.tax_amount, 'tax_amount'),
    totalAmount: toNumber(dto.total_amount, 'total_amount')
  };
}

function toNumber(value: NumericDtoValue, fieldName: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Report field ${fieldName} is not numeric.`);
  }

  return parsed;
}

function toNullableDate(value: string | null, fieldName: string): Date | null {
  if (value === null) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Report field ${fieldName} is not a valid date.`);
  }

  return parsed;
}
