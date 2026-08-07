export interface SalesInvoiceLine {
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
