import { Injectable, computed, signal } from '@angular/core';
import { Observable, finalize } from 'rxjs';

import { LoadingState } from './loading.model';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly activeRequestsState = signal(0);

  readonly activeRequests = this.activeRequestsState.asReadonly();
  readonly isLoading = computed(() => this.activeRequests() > 0);
  readonly state = computed<LoadingState>(() => ({
    activeRequests: this.activeRequests(),
    isLoading: this.isLoading()
  }));

  start(): void {
    this.activeRequestsState.update((count) => count + 1);
  }

  stop(): void {
    this.activeRequestsState.update((count) => Math.max(0, count - 1));
  }

  track<TValue>(source$: Observable<TValue>): Observable<TValue> {
    this.start();

    return source$.pipe(finalize(() => this.stop()));
  }

  reset(): void {
    this.activeRequestsState.set(0);
  }
}
