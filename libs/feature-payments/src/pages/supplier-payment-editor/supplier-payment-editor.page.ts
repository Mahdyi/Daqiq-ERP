import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ButtonComponent,
  CardComponent,
  DynamicFormComponent,
  FormSubmitEvent,
  PageContainerComponent
} from '@daqiq/ui';

import { SupplierPaymentEditorFacade } from '../../facades/supplier-payment-editor.facade';
import type { SupplierPaymentFormValue } from '../../models/payment-form-value.model';

const INITIAL_VALUE: Partial<SupplierPaymentFormValue> = {
  paymentDate: new Date(),
  amount: null,
  allocatedAmount: null
};

@Component({
  selector: 'daqiq-supplier-payment-editor-page',
  imports: [PageContainerComponent, CardComponent, DynamicFormComponent, ButtonComponent, RouterLink],
  templateUrl: './supplier-payment-editor.page.html',
  styleUrl: './supplier-payment-editor.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupplierPaymentEditorPage implements OnInit {
  protected readonly facade = inject(SupplierPaymentEditorFacade);
  private readonly router = inject(Router);
  protected readonly initialValue = INITIAL_VALUE;

  ngOnInit(): void {
    void this.facade.loadReferenceData();
  }

  protected async handleSubmit(event: FormSubmitEvent<SupplierPaymentFormValue>): Promise<void> {
    const payment = await this.facade.submit(event.value);

    if (payment) {
      void this.router.navigate(['/payments/supplier-payments', payment.id]);
    }
  }

  protected handleCancel(): void {
    void this.router.navigate(['/payments/supplier-payments']);
  }
}
