export type SettlementStatus = 'unpaid' | 'partially_paid' | 'paid';

export interface SalesInvoiceSettlement {
  readonly salesInvoiceId: string;
  readonly invoiceNumber: string;
  readonly customerId: string;
  readonly customerCode: string;
  readonly customerName: string;
  readonly invoiceDate: Date;
  readonly dueDate: Date | null;
  readonly totalAmount: number;
  readonly paidAmount: number;
  readonly remainingAmount: number;
  readonly settlementStatus: SettlementStatus;
}

export interface SupplierInvoiceSettlement {
  readonly supplierInvoiceId: string;
  readonly invoiceNumber: string;
  readonly supplierInvoiceNumber: string | null;
  readonly supplierId: string;
  readonly supplierCode: string;
  readonly supplierName: string;
  readonly invoiceDate: Date;
  readonly dueDate: Date | null;
  readonly totalAmount: number;
  readonly paidAmount: number;
  readonly remainingAmount: number;
  readonly settlementStatus: SettlementStatus;
}
