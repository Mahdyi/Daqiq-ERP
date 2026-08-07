import type { SalesInvoiceStatus } from '../models/sales-invoice-status.model';

export interface SalesInvoiceResponseLineDto {
  readonly id: string;
  readonly salesInvoiceId: string;
  readonly lineNumber: number;
  readonly salesDeliveryLineId: string | null;
  readonly salesOrderLineId: string | null;
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

export interface SalesInvoiceResponseDto {
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
  readonly issuedByEmail: string | null;
  readonly issuedAt: string | null;
  readonly cancelledByEmail: string | null;
  readonly cancelledAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lines: readonly SalesInvoiceResponseLineDto[];
}
