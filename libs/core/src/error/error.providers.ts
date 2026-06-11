import { ErrorHandler, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { GlobalErrorHandler } from './global-error.handler';

export function provideCoreErrorHandling(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    }
  ]);
}
