import type { SupplierInvoiceStatus } from './supplier-invoice-status.model';

export interface SupplierInvoice {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly supplierInvoiceNumber: string | null;
  readonly supplierId: string;
  readonly supplierCode: string;
  readonly supplierName: string;
  readonly purchaseOrderId: string | null;
  readonly purchaseOrderNumber: string | null;
  readonly goodsReceiptId: string | null;
  readonly goodsReceiptNumber: string | null;
  readonly statusCode: SupplierInvoiceStatus;
  readonly statusLabel: string;
  readonly invoiceDate: Date;
  readonly dueDate: Date | null;
  readonly currencyLookupValueId: string | null;
  readonly currencyCode: string | null;
  readonly currencyLabel: string | null;
  readonly subtotalAmount: number;
  readonly taxAmount: number;
  readonly totalAmount: number;
  readonly notes: string | null;
  readonly createdByEmail: string | null;
  readonly postedByEmail: string | null;
  readonly postedAt: Date | null;
  readonly cancelledByEmail: string | null;
  readonly cancelledAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
