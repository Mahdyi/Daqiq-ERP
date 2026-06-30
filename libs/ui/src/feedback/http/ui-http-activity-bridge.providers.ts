import { Provider, inject } from '@angular/core';
import { HTTP_ACTIVITY_PORT, HttpActivityPort } from '@daqiq/core';

import { LoadingService } from '../services/loading.service';

export function provideUiHttpActivityBridge(): Provider[] {
  return [
    {
      provide: HTTP_ACTIVITY_PORT,
      useFactory: (): HttpActivityPort => {
        const loadingService = inject(LoadingService);

        return {
          begin: () => loadingService.begin()
        };
      }
    }
  ];
}
