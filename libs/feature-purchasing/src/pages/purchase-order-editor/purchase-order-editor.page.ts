import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonComponent,
  CardComponent,
  DynamicFormComponent,
  FormSubmitEvent,
  PageContainerComponent
} from '@daqiq/ui';

import { formatNumber } from '../../config/purchase-order-table.config';
import {
  DEFAULT_PURCHASE_ORDER_FORM_VALUE
} from '../../mappers/purchase-order-form.mapper';
import { PurchaseOrderEditorFacade } from '../../facades/purchase-order-editor.facade';
import type {
  PurchaseOrderFormValue,
  PurchaseOrderLineFormValue
} from '../../models/purchase-order-form-value.model';

const DEFAULT_LINE_DRAFT: PurchaseOrderLineFormValue = {
  clientId: '',
  productId: null,
  description: null,
  quantity: 1,
  unitLookupValueId: null,
  unitPrice: 0,
  taxRateLookupValueId: null
};

@Component({
  selector: 'daqiq-purchase-order-editor-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DynamicFormComponent,
    ButtonComponent
  ],
  templateUrl: './purchase-order-editor.page.html',
  styleUrl: './purchase-order-editor.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchaseOrderEditorPage implements OnInit {
  protected readonly facade = inject(PurchaseOrderEditorFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly orderId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = this.orderId !== null;
  protected readonly title = this.isEditMode ? 'ویرایش سفارش خرید' : 'ایجاد سفارش خرید';
  protected readonly lineDraft = signal<PurchaseOrderLineFormValue>(DEFAULT_LINE_DRAFT);
  protected readonly lineError = signal<string | null>(null);
  protected readonly headerInitialValue = computed(() =>
    this.isEditMode ? this.facade.initialValue() : DEFAULT_PURCHASE_ORDER_FORM_VALUE
  );

  ngOnInit(): void {
    void this.facade.initialize(this.orderId);
  }

  protected handleCancel(): void {
    void this.router.navigate(['/purchasing/purchase-orders']);
  }

  protected async handleSubmit(event: FormSubmitEvent<PurchaseOrderFormValue>): Promise<void> {
    const order = this.isEditMode && this.orderId
      ? await this.facade.update(this.orderId, event.value)
      : await this.facade.create(event.value);

    if (order) {
      await this.router.navigate(['/purchasing/purchase-orders', order.id]);
    }
  }

  protected handleProductChange(event: Event): void {
    const value = this.readSelectValue(event);
    const product = this.facade.productById(value);

    this.lineDraft.update((line) => ({
      ...line,
      productId: value,
      unitLookupValueId: product?.baseUnitLookupValueId ?? null
    }));
  }

  protected handleDescriptionInput(event: Event): void {
    const value = this.readInputValue(event);
    this.lineDraft.update((line) => ({ ...line, description: value }));
  }

  protected handleQuantityInput(event: Event): void {
    const value = this.readNumericInputValue(event);
    this.lineDraft.update((line) => ({ ...line, quantity: value }));
  }

  protected handleUnitPriceInput(event: Event): void {
    const value = this.readNumericInputValue(event);
    this.lineDraft.update((line) => ({ ...line, unitPrice: value }));
  }

  protected handleTaxRateChange(event: Event): void {
    const value = this.readSelectValue(event);
    this.lineDraft.update((line) => ({ ...line, taxRateLookupValueId: value }));
  }

  protected handleAddLine(): void {
    const line = this.lineDraft();

    if (!line.productId || !line.unitLookupValueId || !line.quantity || line.quantity <= 0) {
      this.lineError.set('کالا، واحد و مقدار معتبر برای خط سفارش الزامی است.');
      return;
    }

    if (line.unitPrice === null || line.unitPrice < 0) {
      this.lineError.set('قیمت واحد نمی‌تواند منفی باشد.');
      return;
    }

    this.facade.addLine(line);
    this.lineDraft.set(DEFAULT_LINE_DRAFT);
    this.lineError.set(null);
  }

  protected handleRemoveLine(clientId: string): void {
    this.facade.removeLine(clientId);
  }

  protected productUnitLabel(productId: string | null): string {
    return this.facade.productById(productId)?.baseUnitLabel ?? '—';
  }

  protected formatNumber(value: number): string {
    return formatNumber(value);
  }

  private readSelectValue(event: Event): string | null {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      return target.value.trim() || null;
    }

    return null;
  }

  private readInputValue(event: Event): string | null {
    const target = event.target;

    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value.trim() || null;
    }

    return null;
  }

  private readNumericInputValue(event: Event): number | null {
    const value = this.readInputValue(event);

    if (value === null) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
