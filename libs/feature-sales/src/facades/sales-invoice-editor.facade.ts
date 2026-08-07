import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiError } from '@daqiq/core';
import { NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { SalesDeliveryRepository } from '../data-access/sales-delivery-repository.service';
import { SalesInvoiceCommandService } from '../data-access/sales-invoice-command.service';
import { SalesInvoiceRepository } from '../data-access/sales-invoice-repository.service';
import { SalesOrderReferenceDataService } from '../data-access/sales-order-reference-data.service';
import { SalesOrderRepository } from '../data-access/sales-order-repository.service';
import type { SalesDeliveryLineInvoicingProgress } from '../models/sales-delivery-line-invoicing-progress.model';
import type {
  SalesInvoiceEditorLine,
  SalesInvoiceEditorLineDraft
} from '../models/sales-invoice-editor.model';
import type { SalesOrderLine } from '../models/sales-order-line.model';
import type { SalesOrderOption } from '../models/sales-order-option.model';
import type { SalesDelivery } from '../models/sales-delivery.model';
import { toApiError } from './sales-order.facade';

@Injectable()
export class SalesInvoiceEditorFacade {
  private readonly deliveries = inject(SalesDeliveryRepository);
  private readonly invoices = inject(SalesInvoiceRepository);
  private readonly salesOrders = inject(SalesOrderRepository);
  private readonly commands = inject(SalesInvoiceCommandService);
  private readonly references = inject(SalesOrderReferenceDataService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  private readonly deliverySignal = signal<SalesDelivery | null>(null);
  private readonly progressSignal = signal<readonly SalesDeliveryLineInvoicingProgress[]>([]);
  private readonly orderLinesSignal = signal<readonly SalesOrderLine[]>([]);
  private readonly taxRatesSignal = signal<readonly SalesOrderOption[]>([]);
  private readonly draftLinesSignal = signal<readonly SalesInvoiceEditorLineDraft[]>([]);
  private readonly invoiceDateSignal = signal(toDateInputValue(new Date()));
  private readonly dueDateSignal = signal<string | null>(null);
  private readonly notesSignal = signal<string | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly submittingSignal = signal(false);
  private readonly errorSignal = signal<ApiError | null>(null);

  readonly delivery = this.deliverySignal.asReadonly();
  readonly progress = this.progressSignal.asReadonly();
  readonly taxRates = this.taxRatesSignal.asReadonly();
  readonly draftLines = this.draftLinesSignal.asReadonly();
  readonly invoiceDate = this.invoiceDateSignal.asReadonly();
  readonly dueDate = this.dueDateSignal.asReadonly();
  readonly notes = this.notesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly submitting = this.submittingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly canSubmit = computed(() =>
    Boolean(this.delivery()) &&
    this.draftLines().some((line) => line.quantity > 0) &&
    this.draftLines().every((line) => this.quantityIsValid(line) && line.unitPrice >= 0)
  );

  async load(salesDeliveryId: string): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const [delivery, progress, taxRates] = await Promise.all([
        firstValueFrom(this.deliveries.getById(salesDeliveryId)),
        firstValueFrom(this.invoices.listSalesDeliveryProgress(salesDeliveryId)),
        firstValueFrom(this.references.listTaxRates())
      ]);
      const orderLines = delivery.salesOrderId
        ? await firstValueFrom(this.salesOrders.listLines(delivery.salesOrderId))
        : [];

      this.deliverySignal.set(delivery);
      this.progressSignal.set(progress);
      this.orderLinesSignal.set(orderLines);
      this.taxRatesSignal.set(taxRates);
      this.draftLinesSignal.set(this.createDraftLines(progress, orderLines));
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
      this.deliverySignal.set(null);
      this.progressSignal.set([]);
      this.orderLinesSignal.set([]);
      this.draftLinesSignal.set([]);
    } finally {
      this.loadingSignal.set(false);
    }
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

  updateLineQuantity(salesDeliveryLineId: string, value: number): void {
    this.updateLine(salesDeliveryLineId, (line) => ({
      ...line,
      quantity: Math.max(0, value)
    }));
  }

  updateLineUnitPrice(salesDeliveryLineId: string, value: number): void {
    this.updateLine(salesDeliveryLineId, (line) => ({
      ...line,
      unitPrice: Math.max(0, value)
    }));
  }

  updateLineTaxRate(salesDeliveryLineId: string, value: string): void {
    this.updateLine(salesDeliveryLineId, (line) => ({
      ...line,
      taxRateLookupValueId: value || null
    }));
  }

  updateLineDescription(salesDeliveryLineId: string, value: string): void {
    this.updateLine(salesDeliveryLineId, (line) => ({
      ...line,
      description: value.trim() || null
    }));
  }

  async submit(): Promise<void> {
    const delivery = this.delivery();

    if (!delivery || !this.canSubmit()) {
      return;
    }

    this.submittingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const result = await firstValueFrom(
        this.commands.createFromDelivery({
          salesDeliveryId: delivery.id,
          invoiceDate: this.invoiceDate(),
          dueDate: this.dueDate(),
          notes: this.notes(),
          lines: this.draftLines()
            .filter((line) => line.quantity > 0)
            .map((line): SalesInvoiceEditorLine => ({
              salesDeliveryLineId: line.salesDeliveryLineId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxRateLookupValueId: line.taxRateLookupValueId,
              description: line.description
            }))
        })
      );

      this.notifications.success('فاکتور فروش با موفقیت ایجاد شد.');
      void this.router.navigate(['/sales/sales-invoices', result.invoice.id]);
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
    } finally {
      this.submittingSignal.set(false);
    }
  }

  lineDraft(salesDeliveryLineId: string): SalesInvoiceEditorLineDraft | null {
    return this.draftLines().find((line) => line.salesDeliveryLineId === salesDeliveryLineId) ?? null;
  }

  quantityIsValid(line: SalesInvoiceEditorLineDraft): boolean {
    return line.quantity >= 0 && line.quantity <= line.remainingQuantity;
  }

  lineAmount(line: SalesInvoiceEditorLineDraft): number {
    return line.quantity * line.unitPrice;
  }

  private createDraftLines(
    progress: readonly SalesDeliveryLineInvoicingProgress[],
    orderLines: readonly SalesOrderLine[]
  ): readonly SalesInvoiceEditorLineDraft[] {
    return progress
      .filter((line) => line.remainingQuantity > 0)
      .map((line) => {
        const orderLine = orderLines.find((item) => item.id === line.salesOrderLineId);

        return {
          salesDeliveryLineId: line.salesDeliveryLineId,
          quantity: line.remainingQuantity,
          remainingQuantity: line.remainingQuantity,
          unitPrice: orderLine?.unitPrice ?? 0,
          taxRateLookupValueId: orderLine?.taxRateLookupValueId ?? null,
          description: null
        };
      });
  }

  private updateLine(
    salesDeliveryLineId: string,
    updater: (line: SalesInvoiceEditorLineDraft) => SalesInvoiceEditorLineDraft
  ): void {
    this.draftLinesSignal.update((lines) =>
      lines.map((line) =>
        line.salesDeliveryLineId === salesDeliveryLineId ? updater(line) : line
      )
    );
  }
}

function toDateInputValue(value: Date): string {
  return value.toISOString().slice(0, 10);
}
