import type { SalesInvoiceStatus } from './sales-invoice-status.model';

export interface SalesInvoice {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly customerId: string;
  readonly customerCode: string;
  readonly customerName: string;
  readonly salesOrderId: string | null;
  readonly salesOrderNumber: string | null;
  readonly salesDeliveryId: string | null;
  readonly salesDeliveryNumber: string | null;
  readonly statusCode: SalesInvoiceStatus;
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
  readonly issuedByEmail: string | null;
  readonly issuedAt: Date | null;
  readonly cancelledByEmail: string | null;
  readonly cancelledAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
