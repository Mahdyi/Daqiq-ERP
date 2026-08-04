import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  ButtonComponent,
  CardComponent,
  DynamicFormComponent,
  FormSubmitEvent,
  PageContainerComponent
} from '@daqiq/ui';

import { InventoryTransactionFacade } from '../../facades/inventory-transaction.facade';
import { DEFAULT_TRANSFER_FORM_VALUE } from '../../mappers/inventory-transaction.mapper';
import type { InventoryTransferFormValue } from '../../models/inventory-transaction-form-value.model';

@Component({
  selector: 'daqiq-inventory-transfer-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DynamicFormComponent,
    ButtonComponent
  ],
  templateUrl: './inventory-transfer.page.html',
  styleUrl: './inventory-transfer.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryTransferPage implements OnInit {
  protected readonly facade = inject(InventoryTransactionFacade);
  private readonly router = inject(Router);
  protected readonly initialValue = DEFAULT_TRANSFER_FORM_VALUE;

  ngOnInit(): void {
    void this.facade.loadReferenceData();
  }

  protected handleRetry(): void {
    void this.facade.loadReferenceData();
  }

  protected async handleSubmit(event: FormSubmitEvent<InventoryTransferFormValue>): Promise<void> {
    const success = await this.facade.submitTransfer(event.value);

    if (success) {
      await this.router.navigate(['/inventory/balances']);
    }
  }

  protected handleCancel(): void {
    void this.router.navigate(['/inventory/balances']);
  }
}
