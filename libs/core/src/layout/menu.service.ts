import { Injectable, computed, signal } from '@angular/core';

import { CoreMenuItem } from './menu.model';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly menuItemsState = signal<readonly CoreMenuItem[]>([]);

  readonly menuItems = this.menuItemsState.asReadonly();
  readonly visibleMenuItems = computed(() => this.filterVisibleItems(this.menuItems()));

  setMenuItems(items: readonly CoreMenuItem[]): void {
    this.menuItemsState.set(items);
  }

  clear(): void {
    this.menuItemsState.set([]);
  }

  private filterVisibleItems(items: readonly CoreMenuItem[]): readonly CoreMenuItem[] {
    return items
      .filter((item) => item.disabled !== true)
      .map((item) => ({
        ...item,
        children: item.children ? this.filterVisibleItems(item.children) : undefined
      }));
  }
}
