import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { BreadcrumbComponent, ShellBreadcrumbItem } from './breadcrumb.component';
import { FooterComponent } from './footer.component';
import { ShellMenuItem, SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';

@Component({
  selector: 'app-shell-layout',
  imports: [BreadcrumbComponent, FooterComponent, RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="erp-shell" [class.erp-shell--sidebar-collapsed]="sidebarCollapsed()">
      <div class="erp-shell__sidebar">
        <app-sidebar
          [collapsed]="sidebarCollapsed()"
          [menuItems]="menuItems()"
          (itemSelected)="closeSidebarOnSmallScreens()"
        />
      </div>

      <div class="erp-shell__main">
        <app-topbar
          title="Daqiq ERP"
          subtitle="ERP shell foundation"
          [sidebarCollapsed]="sidebarCollapsed()"
          (sidebarToggled)="toggleSidebar()"
        />

        <main class="erp-shell__body">
          <app-breadcrumb [items]="breadcrumbItems()" />

          <section class="erp-shell__content" aria-label="Page content">
            <router-outlet />
          </section>

          <app-footer />
        </main>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellLayoutComponent {
  private readonly document = inject(DOCUMENT);

  protected readonly sidebarCollapsed = signal(false);

  protected readonly breadcrumbItems = signal<readonly ShellBreadcrumbItem[]>([
    {
      label: 'Dashboard'
    }
  ]);

  protected readonly menuItems = signal<readonly ShellMenuItem[]>([
    {
      label: 'Dashboard',
      icon: 'pi pi-chart-line',
      route: '/dashboard'
    }
  ]);

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  protected closeSidebarOnSmallScreens(): void {
    if (this.document.defaultView?.matchMedia('(max-width: 900px)').matches === true) {
      this.sidebarCollapsed.set(true);
    }
  }
}
