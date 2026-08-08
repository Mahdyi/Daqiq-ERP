import type { SupplierInvoiceStatus } from '../models/supplier-invoice-status.model';

export interface SupplierInvoiceResponseLineDto {
  readonly id: string;
  readonly supplierInvoiceId: string;
  readonly lineNumber: number;
  readonly goodsReceiptLineId: string | null;
  readonly purchaseOrderLineId: string | null;
  readonly productId: string;
  readonly productSku: string;
  readonly productName: string;
  readonly description: string | null;
  readonly quantity: number;
  readonly unitCode: string;
  readonly unitLabel: string | null;
  readonly unitPrice: number;
  readonly taxRateCode: string | null;
  readonly taxRateLabel: string | null;
  readonly taxAmount: number;
  readonly lineTotal: number;
}

export interface SupplierInvoiceResponseDto {
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
  readonly invoiceDate: string;
  readonly dueDate: string | null;
  readonly currencyLookupValueId: string | null;
  readonly currencyCode: string | null;
  readonly currencyLabel: string | null;
  readonly subtotalAmount: number;
  readonly taxAmount: number;
  readonly totalAmount: number;
  readonly notes: string | null;
  readonly createdByEmail: string | null;
  readonly postedByEmail: string | null;
  readonly postedAt: string | null;
  readonly cancelledByEmail: string | null;
  readonly cancelledAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lines: readonly SupplierInvoiceResponseLineDto[];
}
