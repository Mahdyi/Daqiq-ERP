import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import {
  ConfirmationService as PrimeConfirmationService,
  MessageService as PrimeMessageService
} from 'primeng/api';

export function provideCoreNotifications(): EnvironmentProviders {
  return makeEnvironmentProviders([PrimeMessageService, PrimeConfirmationService]);
}
