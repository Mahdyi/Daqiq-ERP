import { Injectable, Signal, computed, signal } from '@angular/core';

import { LoadingHandle } from '../models/loading.model';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly activeCountState = signal(0);

  readonly activeCount: Signal<number> = this.activeCountState.asReadonly();
  readonly isLoading: Signal<boolean> = computed(() => this.activeCount() > 0);

  begin(): LoadingHandle {
    let closed = false;
    this.activeCountState.update((count) => count + 1);

    return {
      close: () => {
        if (closed) {
          return;
        }

        closed = true;
        this.activeCountState.update((count) => Math.max(0, count - 1));
      }
    };
  }
}
