import { Injectable, inject } from '@angular/core';
import { ConfirmationService as PrimeConfirmationService } from 'primeng/api';

import { ConfirmationOptions } from '../models/confirmation.model';

const DEFAULT_ACCEPT_LABEL = 'تأیید';
const DEFAULT_REJECT_LABEL = 'انصراف';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private readonly primeConfirmationService = inject(PrimeConfirmationService);

  confirm(options: ConfirmationOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.primeConfirmationService.confirm({
        header: options.header,
        message: options.message,
        icon: options.icon ?? 'pi pi-question-circle',
        acceptLabel: options.acceptLabel ?? DEFAULT_ACCEPT_LABEL,
        rejectLabel: options.rejectLabel ?? DEFAULT_REJECT_LABEL,
        acceptButtonStyleClass: options.acceptButtonStyleClass,
        rejectButtonStyleClass: options.rejectButtonStyleClass,
        accept: () => resolve(true),
        reject: () => resolve(false),
        closable: false,
        closeOnEscape: false,
        dismissableMask: false,
        blockScroll: true
      });
    });
  }
}
