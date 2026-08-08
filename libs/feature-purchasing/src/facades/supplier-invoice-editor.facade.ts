import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiError } from '@daqiq/core';
import { NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { GoodsReceiptRepository } from '../data-access/goods-receipt-repository.service';
import { PurchaseOrderReferenceDataService } from '../data-access/purchase-order-reference-data.service';
import { PurchaseOrderRepository } from '../data-access/purchase-order-repository.service';
import { SupplierInvoiceCommandService } from '../data-access/supplier-invoice-command.service';
import { SupplierInvoiceRepository } from '../data-access/supplier-invoice-repository.service';
import type { GoodsReceiptLineSupplierInvoicingProgress } from '../models/goods-receipt-line-supplier-invoicing-progress.model';
import type { GoodsReceipt } from '../models/goods-receipt.model';
import type { PurchaseOrderLine } from '../models/purchase-order-line.model';
import type { PurchaseOrderOption } from '../models/purchase-order-option.model';
import type {
  SupplierInvoiceEditorLine,
  SupplierInvoiceEditorLineDraft
} from '../models/supplier-invoice-editor.model';
import { toApiError } from './purchase-order.facade';

@Injectable()
export class SupplierInvoiceEditorFacade {
  private readonly receipts = inject(GoodsReceiptRepository);
  private readonly invoices = inject(SupplierInvoiceRepository);
  private readonly purchaseOrders = inject(PurchaseOrderRepository);
  private readonly commands = inject(SupplierInvoiceCommandService);
  private readonly references = inject(PurchaseOrderReferenceDataService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  private readonly receiptSignal = signal<GoodsReceipt | null>(null);
  private readonly progressSignal = signal<readonly GoodsReceiptLineSupplierInvoicingProgress[]>([]);
  private readonly orderLinesSignal = signal<readonly PurchaseOrderLine[]>([]);
  private readonly taxRatesSignal = signal<readonly PurchaseOrderOption[]>([]);
  private readonly draftLinesSignal = signal<readonly SupplierInvoiceEditorLineDraft[]>([]);
  private readonly supplierInvoiceNumberSignal = signal<string | null>(null);
  private readonly invoiceDateSignal = signal(toDateInputValue(new Date()));
  private readonly dueDateSignal = signal<string | null>(null);
  private readonly notesSignal = signal<string | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly submittingSignal = signal(false);
  private readonly errorSignal = signal<ApiError | null>(null);

  readonly receipt = this.receiptSignal.asReadonly();
  readonly progress = this.progressSignal.asReadonly();
  readonly taxRates = this.taxRatesSignal.asReadonly();
  readonly draftLines = this.draftLinesSignal.asReadonly();
  readonly supplierInvoiceNumber = this.supplierInvoiceNumberSignal.asReadonly();
  readonly invoiceDate = this.invoiceDateSignal.asReadonly();
  readonly dueDate = this.dueDateSignal.asReadonly();
  readonly notes = this.notesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly submitting = this.submittingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly canSubmit = computed(() =>
    Boolean(this.receipt()) &&
    this.draftLines().some((line) => line.quantity > 0) &&
    this.draftLines().every((line) => this.quantityIsValid(line) && line.unitPrice >= 0)
  );

  async load(goodsReceiptId: string): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const [receipt, progress, taxRates] = await Promise.all([
        firstValueFrom(this.receipts.getById(goodsReceiptId)),
        firstValueFrom(this.invoices.listGoodsReceiptProgress(goodsReceiptId)),
        firstValueFrom(this.references.listTaxRates())
      ]);
      const orderLines = receipt.purchaseOrderId
        ? await firstValueFrom(this.purchaseOrders.listLines(receipt.purchaseOrderId))
        : [];

      this.receiptSignal.set(receipt);
      this.progressSignal.set(progress);
      this.orderLinesSignal.set(orderLines);
      this.taxRatesSignal.set(taxRates);
      this.draftLinesSignal.set(this.createDraftLines(progress, orderLines));
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
      this.receiptSignal.set(null);
      this.progressSignal.set([]);
      this.orderLinesSignal.set([]);
      this.draftLinesSignal.set([]);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  setSupplierInvoiceNumber(value: string): void {
    this.supplierInvoiceNumberSignal.set(value.trim() || null);
  }

  setInvoiceDate(value: string): void {
    this.invoiceDateSignal.set(value);
  }

  setDueDate(value: string): void {
    this.dueDateSignal.set(value || null);
  }

  setNotes(value: string): void {
    this.notesSignal.set(value.trim() || null);
  }

  updateLineQuantity(goodsReceiptLineId: string, value: number): void {
    this.updateLine(goodsReceiptLineId, (line) => ({
      ...line,
      quantity: Math.max(0, value)
    }));
  }

  updateLineUnitPrice(goodsReceiptLineId: string, value: number): void {
    this.updateLine(goodsReceiptLineId, (line) => ({
      ...line,
      unitPrice: Math.max(0, value)
    }));
  }

  updateLineTaxRate(goodsReceiptLineId: string, value: string): void {
    this.updateLine(goodsReceiptLineId, (line) => ({
      ...line,
      taxRateLookupValueId: value || null
    }));
  }

  updateLineDescription(goodsReceiptLineId: string, value: string): void {
    this.updateLine(goodsReceiptLineId, (line) => ({
      ...line,
      description: value.trim() || null
    }));
  }

  async submit(): Promise<void> {
    const receipt = this.receipt();

    if (!receipt || !this.canSubmit()) {
      return;
    }

    this.submittingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const result = await firstValueFrom(
        this.commands.createFromReceipt({
          goodsReceiptId: receipt.id,
          supplierInvoiceNumber: this.supplierInvoiceNumber(),
          invoiceDate: this.invoiceDate(),
          dueDate: this.dueDate(),
          notes: this.notes(),
          lines: this.draftLines()
            .filter((line) => line.quantity > 0)
            .map((line): SupplierInvoiceEditorLine => ({
              goodsReceiptLineId: line.goodsReceiptLineId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxRateLookupValueId: line.taxRateLookupValueId,
              description: line.description
            }))
        })
      );

      this.notifications.success('فاکتور تأمین‌کننده با موفقیت ایجاد شد.');
      void this.router.navigate(['/purchasing/supplier-invoices', result.invoice.id]);
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
    } finally {
      this.submittingSignal.set(false);
    }
  }

  lineDraft(goodsReceiptLineId: string): SupplierInvoiceEditorLineDraft | null {
    return this.draftLines().find((line) => line.goodsReceiptLineId === goodsReceiptLineId) ?? null;
  }

  quantityIsValid(line: SupplierInvoiceEditorLineDraft): boolean {
    return line.quantity >= 0 && line.quantity <= line.remainingQuantity;
  }

  lineAmount(line: SupplierInvoiceEditorLineDraft): number {
    return line.quantity * line.unitPrice;
  }

  private createDraftLines(
    progress: readonly GoodsReceiptLineSupplierInvoicingProgress[],
    orderLines: readonly PurchaseOrderLine[]
  ): readonly SupplierInvoiceEditorLineDraft[] {
    return progress
      .filter((line) => line.remainingQuantity > 0)
      .map((line) => {
        const orderLine = orderLines.find((item) => item.id === line.purchaseOrderLineId);

        return {
          goodsReceiptLineId: line.goodsReceiptLineId,
          quantity: line.remainingQuantity,
          remainingQuantity: line.remainingQuantity,
          unitPrice: orderLine?.unitPrice ?? 0,
          taxRateLookupValueId: orderLine?.taxRateLookupValueId ?? null,
          description: null
        };
      });
  }

  private updateLine(
    goodsReceiptLineId: string,
    updater: (line: SupplierInvoiceEditorLineDraft) => SupplierInvoiceEditorLineDraft
  ): void {
    this.draftLinesSignal.update((lines) =>
      lines.map((line) =>
        line.goodsReceiptLineId === goodsReceiptLineId ? updater(line) : line
      )
    );
  }
}

function toDateInputValue(value: Date): string {
  return value.toISOString().slice(0, 10);
}
