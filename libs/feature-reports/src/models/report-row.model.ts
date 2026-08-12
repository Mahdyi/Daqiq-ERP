export interface InventoryOnHandReport {
  readonly productId: string;
  readonly productSku: string;
  readonly productName: string;
  readonly productType: string;
  readonly warehouseId: string;
  readonly warehouseCode: string;
  readonly warehouseName: string;
  readonly storageLocationId: string | null;
  readonly storageLocationCode: string | null;
  readonly storageLocationName: string | null;
  readonly unitCode: string | null;
  readonly unitLabel: string | null;
  readonly quantityOnHand: number;
  readonly lastMovementAt: Date | null;
}

export interface InventoryMovementSummaryReport {
  readonly productId: string;
  readonly productSku: string;
  readonly productName: string;
  readonly warehouseId: string | null;
  readonly warehouseCode: string | null;
  readonly warehouseName: string | null;
  readonly movementTypeCode: string;
  readonly movementTypeLabel: string;
  readonly movementCount: number;
  readonly totalQuantityIn: number;
  readonly totalQuantityOut: number;
  readonly firstMovementAt: Date | null;
  readonly lastMovementAt: Date | null;
}

export interface AmountStatusReport {
  readonly statusCode: string;
  readonly statusLabel: string;
  readonly itemCount: number;
  readonly subtotalAmount: number;
  readonly taxAmount: number;
  readonly totalAmount: number;
}

export interface QuantityStatusReport {
  readonly statusCode: string;
  readonly statusLabel: string;
  readonly documentCount: number;
  readonly lineCount: number;
  readonly totalQuantity: number;
}

export interface SalesInvoiceSettlementReport {
  readonly customerId: string;
  readonly customerCode: string;
  readonly customerName: string;
  readonly invoiceCount: number;
  readonly totalInvoicedAmount: number;
  readonly totalPaidAmount: number;
  readonly totalRemainingAmount: number;
  readonly overdueAmount: number;
}

export interface SupplierInvoiceSettlementReport {
  readonly supplierId: string;
  readonly supplierCode: string;
  readonly supplierName: string;
  readonly invoiceCount: number;
  readonly totalInvoicedAmount: number;
  readonly totalPaidAmount: number;
  readonly totalRemainingAmount: number;
  readonly overdueAmount: number;
}

export interface GeneralLedgerSummaryReport {
  readonly accountId: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountTypeCode: string;
  readonly debitAmount: number;
  readonly creditAmount: number;
  readonly netAmount: number;
  readonly journalLineCount: number;
}

export interface JournalActivityReport {
  readonly sourceTypeCode: string;
  readonly sourceTypeLabel: string;
  readonly journalCount: number;
  readonly totalDebit: number;
  readonly totalCredit: number;
  readonly firstJournalDate: Date | null;
  readonly lastJournalDate: Date | null;
}

export interface PaymentSummaryReport {
  readonly paymentDirection: 'customer_receipt' | 'supplier_payment';
  readonly paymentCount: number;
  readonly totalAmount: number;
  readonly firstPaymentDate: Date | null;
  readonly lastPaymentDate: Date | null;
}

export interface AuditActivitySummaryReport {
  readonly action: string;
  readonly entityType: string;
  readonly actorEmail: string | null;
  readonly eventCount: number;
  readonly firstEventAt: Date | null;
  readonly lastEventAt: Date | null;
}
