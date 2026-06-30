import { Injectable, Type, inject } from '@angular/core';
import {
  DialogService as PrimeDialogService,
  DynamicDialogRef
} from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';

import {
  AppDialogOptions,
  AppDialogRef
} from '../models/dialog.model';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private readonly primeDialogService = inject(PrimeDialogService);

  open<TComponent, TData, TResult>(
    component: Type<TComponent>,
    options: AppDialogOptions<TData>
  ): AppDialogRef<TResult> {
    const primeRef = this.primeDialogService.open(component, {
      header: options.header,
      data: options.data,
      width: options.width ?? '32rem',
      modal: options.modal ?? true,
      closable: options.closable ?? true,
      dismissableMask: options.dismissableMask ?? false,
      styleClass: options.styleClass,
      rtl: true,
      closeOnEscape: true,
      focusTrap: true
    });

    if (!primeRef) {
      throw new Error('Dynamic dialog could not be opened.');
    }

    return this.createDialogRef<TComponent, TResult>(primeRef);
  }

  private createDialogRef<TComponent, TResult>(
    primeRef: DynamicDialogRef<TComponent>
  ): AppDialogRef<TResult> {
    const closed = primeRef.onClose as unknown as Observable<TResult | undefined>;

    return {
      closed,
      close: (result?: TResult) => primeRef.close(result)
    };
  }
}
