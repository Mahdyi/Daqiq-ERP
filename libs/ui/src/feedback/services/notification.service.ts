import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

import {
  NotificationOptions,
  NotificationSeverity
} from '../models/notification.model';

const DEFAULT_NOTIFICATION_LIFE_MS = 5000;

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly messageService = inject(MessageService);

  success(summary: string, detail?: string): void {
    this.showWithSeverity('success', summary, detail);
  }

  info(summary: string, detail?: string): void {
    this.showWithSeverity('info', summary, detail);
  }

  warn(summary: string, detail?: string): void {
    this.showWithSeverity('warn', summary, detail);
  }

  error(summary: string, detail?: string): void {
    this.showWithSeverity('error', summary, detail);
  }

  show(options: NotificationOptions): void {
    this.messageService.add({
      severity: options.severity,
      summary: options.summary,
      detail: options.detail,
      life: options.sticky
        ? undefined
        : (options.life ?? DEFAULT_NOTIFICATION_LIFE_MS),
      sticky: options.sticky ?? false,
      closable: true
    });
  }

  clear(): void {
    this.messageService.clear();
  }

  private showWithSeverity(
    severity: NotificationSeverity,
    summary: string,
    detail?: string
  ): void {
    this.show({
      severity,
      summary,
      detail
    });
  }
}
