import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import {
  ConfirmationService as PrimeConfirmationService,
  MessageService
} from 'primeng/api';
import { DialogService as PrimeDialogService } from 'primeng/dynamicdialog';

export function provideUiFeedback(): EnvironmentProviders {
  return makeEnvironmentProviders([
    MessageService,
    PrimeConfirmationService,
    PrimeDialogService
  ]);
}
