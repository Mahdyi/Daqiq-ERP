import { Injectable } from '@angular/core';
import {
  ConfirmationService,
  NotificationService,
  NotificationSeverity
} from '@daqiq/core';

import { UiConfirmationRequest, UiNotificationRequest } from './dialog.model';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  constructor(
    private readonly confirmationService: ConfirmationService,
    private readonly notificationService: NotificationService
  ) {}

  confirm(request: UiConfirmationRequest): void {
    this.confirmationService.confirm({
      message: request.message,
      header: request.title,
      icon: request.icon,
      acceptLabel: request.acceptLabel,
      rejectLabel: request.rejectLabel,
      accept: request.accept,
      reject: request.reject
    });
  }

  success(request: UiNotificationRequest): void {
    this.notify('success', request);
  }

  info(request: UiNotificationRequest): void {
    this.notify('info', request);
  }

  warn(request: UiNotificationRequest): void {
    this.notify('warn', request);
  }

  error(request: UiNotificationRequest): void {
    this.notify('error', request);
  }

  private notify(severity: NotificationSeverity, request: UiNotificationRequest): void {
    this.notificationService[severity]({
      summary: request.title,
      detail: request.message,
      life: request.life,
      sticky: request.sticky
    });
  }
}
