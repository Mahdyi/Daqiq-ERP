import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonComponent,
  CardComponent,
  DynamicFormComponent,
  FormSubmitEvent,
  PageContainerComponent
} from '@daqiq/ui';

import { CUSTOMER_FORM_FIELDS } from '../../config/customer-form.config';
import { CustomerFacade } from '../../facades/customer.facade';
import {
  DEFAULT_CUSTOMER_FORM_VALUE,
  mapCustomerToFormValue
} from '../../mappers/customer-form.mapper';
import { CustomerFormValue } from '../../models/customer-form-value.model';

@Component({
  selector: 'daqiq-customer-editor-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DynamicFormComponent,
    ButtonComponent
  ],
  templateUrl: './customer-editor.page.html',
  styleUrl: './customer-editor.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerEditorPage implements OnInit {
  protected readonly facade = inject(CustomerFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly fields = CUSTOMER_FORM_FIELDS;
  protected readonly customerId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = this.customerId !== null;
  protected readonly title = this.isEditMode ? 'ویرایش مشتری' : 'ایجاد مشتری';
  protected readonly initialValue = computed(() => {
    const customer = this.facade.editingCustomer();
    return customer ? mapCustomerToFormValue(customer) : DEFAULT_CUSTOMER_FORM_VALUE;
  });

  ngOnInit(): void {
    if (this.customerId) {
      void this.facade.loadForEdit(this.customerId);
    }
  }

  protected handleRetry(): void {
    if (this.customerId) {
      void this.facade.loadForEdit(this.customerId);
    }
  }

  protected async handleSubmit(event: FormSubmitEvent<CustomerFormValue>): Promise<void> {
    const success = this.isEditMode && this.customerId
      ? await this.facade.updateCustomer(this.customerId, event.value)
      : await this.facade.createCustomer(event.value);

    if (success) {
      await this.router.navigate(['/master-data/customers']);
    }
  }

  protected handleCancel(): void {
    void this.router.navigate(['/master-data/customers']);
  }
}
