import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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
          subtitle="زیرساخت اولیه سامانه"
          [sidebarCollapsed]="sidebarCollapsed()"
          (sidebarToggled)="toggleSidebar()"
        />

        <main class="erp-shell__body">
          <app-breadcrumb [items]="breadcrumbItems()" />

          <section class="erp-shell__content" aria-label="محتوای صفحه">
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
  protected readonly sidebarCollapsed = signal(false);

  protected readonly breadcrumbItems = signal<readonly ShellBreadcrumbItem[]>([
    {
      label: 'داشبورد'
    }
  ]);

  protected readonly menuItems = signal<readonly ShellMenuItem[]>([
    {
      label: 'داشبورد',
      icon: 'pi pi-chart-line',
      route: '/dashboard'
    }
  ]);

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  protected closeSidebarOnSmallScreens(): void {
    if (window.matchMedia('(max-width: 900px)').matches) {
      this.sidebarCollapsed.set(true);
    }
  }
}
