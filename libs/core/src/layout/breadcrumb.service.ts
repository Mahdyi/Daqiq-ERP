import { Injectable, signal } from '@angular/core';

import { BreadcrumbItem } from './breadcrumb.model';

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private readonly itemsState = signal<readonly BreadcrumbItem[]>([]);

  readonly items = this.itemsState.asReadonly();

  set(items: readonly BreadcrumbItem[]): void {
    this.itemsState.set(items);
  }

  clear(): void {
    this.itemsState.set([]);
  }
}
