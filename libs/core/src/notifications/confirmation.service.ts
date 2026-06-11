import { Injectable } from '@angular/core';
import { ConfirmationService as PrimeConfirmationService } from 'primeng/api';

import { ConfirmationOptions } from './notification.model';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  constructor(private readonly confirmationService: PrimeConfirmationService) {}

  confirm(options: ConfirmationOptions): void {
    this.confirmationService.confirm({
      message: options.message,
      header: options.header,
      icon: options.icon,
      key: options.key,
      acceptLabel: options.acceptLabel,
      rejectLabel: options.rejectLabel,
      acceptButtonStyleClass: options.acceptButtonStyleClass,
      rejectButtonStyleClass: options.rejectButtonStyleClass,
      accept: options.accept,
      reject: options.reject
    });
  }

  close(): void {
    this.confirmationService.close();
  }
}
