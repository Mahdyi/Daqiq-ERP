import { Injectable, computed, signal } from '@angular/core';

import { LayoutState } from './layout-state.model';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private readonly sidebarCollapsedState = signal(false);
  private readonly mobileMenuOpenState = signal(false);

  readonly sidebarCollapsed = this.sidebarCollapsedState.asReadonly();
  readonly mobileMenuOpen = this.mobileMenuOpenState.asReadonly();
  readonly state = computed<LayoutState>(() => ({
    sidebarCollapsed: this.sidebarCollapsed(),
    mobileMenuOpen: this.mobileMenuOpen()
  }));

  toggleSidebar(): void {
    this.sidebarCollapsedState.update((collapsed) => !collapsed);
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsedState.set(collapsed);
  }

  openMobileMenu(): void {
    this.mobileMenuOpenState.set(true);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpenState.set(false);
  }
}
