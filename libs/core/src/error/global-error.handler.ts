import { ErrorHandler, Injectable } from '@angular/core';

import { ErrorService } from './error.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private readonly errorService: ErrorService) {}

  handleError(error: unknown): void {
    this.errorService.capture(error, {
      source: 'global'
    });
  }
}
