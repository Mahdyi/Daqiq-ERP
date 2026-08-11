import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ButtonComponent,
  CardComponent,
  DynamicFormComponent,
  FormSubmitEvent,
  PageContainerComponent
} from '@daqiq/ui';

import { CustomerReceiptEditorFacade } from '../../facades/customer-receipt-editor.facade';
import type { CustomerReceiptFormValue } from '../../models/payment-form-value.model';

const INITIAL_VALUE: Partial<CustomerReceiptFormValue> = {
  receiptDate: new Date(),
  amount: null,
  allocatedAmount: null
};

@Component({
  selector: 'daqiq-customer-receipt-editor-page',
  imports: [PageContainerComponent, CardComponent, DynamicFormComponent, ButtonComponent, RouterLink],
  templateUrl: './customer-receipt-editor.page.html',
  styleUrl: './customer-receipt-editor.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerReceiptEditorPage implements OnInit {
  protected readonly facade = inject(CustomerReceiptEditorFacade);
  private readonly router = inject(Router);
  protected readonly initialValue = INITIAL_VALUE;

  ngOnInit(): void {
    void this.facade.loadReferenceData();
  }

  protected async handleSubmit(event: FormSubmitEvent<CustomerReceiptFormValue>): Promise<void> {
    const receipt = await this.facade.submit(event.value);

    if (receipt) {
      void this.router.navigate(['/payments/customer-receipts', receipt.id]);
    }
  }

  protected handleCancel(): void {
    void this.router.navigate(['/payments/customer-receipts']);
  }
}
