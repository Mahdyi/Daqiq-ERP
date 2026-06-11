import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

import { NotificationOptions, NotificationSeverity } from './notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private readonly messageService: MessageService) {}

  success(options: NotificationOptions): void {
    this.notify('success', options);
  }

  info(options: NotificationOptions): void {
    this.notify('info', options);
  }

  warn(options: NotificationOptions): void {
    this.notify('warn', options);
  }

  error(options: NotificationOptions): void {
    this.notify('error', options);
  }

  clear(key?: string): void {
    this.messageService.clear(key);
  }

  private notify(severity: NotificationSeverity, options: NotificationOptions): void {
    this.messageService.add({
      severity,
      summary: options.summary,
      detail: options.detail,
      key: options.key,
      life: options.life,
      sticky: options.sticky,
      closable: options.closable
    });
  }
}
