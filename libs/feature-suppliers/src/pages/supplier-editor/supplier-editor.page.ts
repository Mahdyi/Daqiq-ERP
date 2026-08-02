import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonComponent,
  CardComponent,
  DynamicFormComponent,
  FormSubmitEvent,
  PageContainerComponent
} from '@daqiq/ui';

import { SupplierFacade } from '../../facades/supplier.facade';
import {
  DEFAULT_SUPPLIER_FORM_VALUE,
  mapSupplierToFormValue
} from '../../mappers/supplier-form.mapper';
import type { SupplierFormValue } from '../../models/supplier-form-value.model';

@Component({
  selector: 'daqiq-supplier-editor-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DynamicFormComponent,
    ButtonComponent
  ],
  templateUrl: './supplier-editor.page.html',
  styleUrl: './supplier-editor.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupplierEditorPage implements OnInit {
  protected readonly facade = inject(SupplierFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly supplierId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = this.supplierId !== null;
  protected readonly title = this.isEditMode
    ? 'ویرایش تأمین‌کننده'
    : 'ایجاد تأمین‌کننده';
  protected readonly initialValue = computed(() => {
    const supplier = this.facade.editingSupplier();
    return supplier ? mapSupplierToFormValue(supplier) : DEFAULT_SUPPLIER_FORM_VALUE;
  });

  ngOnInit(): void {
    if (this.supplierId) {
      void this.facade.loadForEdit(this.supplierId);
      return;
    }

    void this.facade.loadLookups();
  }

  protected handleRetry(): void {
    if (this.supplierId) {
      void this.facade.loadForEdit(this.supplierId);
      return;
    }

    void this.facade.loadLookups();
  }

  protected async handleSubmit(event: FormSubmitEvent<SupplierFormValue>): Promise<void> {
    const success = this.isEditMode && this.supplierId
      ? await this.facade.updateSupplier(this.supplierId, event.value)
      : await this.facade.createSupplier(event.value);

    if (success) {
      await this.router.navigate(['/master-data/suppliers']);
    }
  }

  protected handleCancel(): void {
    void this.router.navigate(['/master-data/suppliers']);
  }
}
