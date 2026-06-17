import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { BreadcrumbComponent, ShellBreadcrumbItem } from './breadcrumb.component';
import { FooterComponent } from './footer.component';
import { ShellMenuItem, SidebarComponent } from './sidebar.component';
import { SHELL_LABELS } from './shell.labels';
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
          [title]="labels.productName"
          [subtitle]="labels.topbarSubtitle"
          [sidebarCollapsed]="sidebarCollapsed()"
          (sidebarToggled)="toggleSidebar()"
        />

        <main class="erp-shell__body">
          <app-breadcrumb [items]="breadcrumbItems()" />

          <section class="erp-shell__content" [attr.aria-label]="labels.pageContent">
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

  protected readonly labels = SHELL_LABELS;
  protected readonly sidebarCollapsed = signal(false);

  protected readonly breadcrumbItems = signal<readonly ShellBreadcrumbItem[]>([
    {
      label: SHELL_LABELS.dashboard
    }
  ]);

  protected readonly menuItems = signal<readonly ShellMenuItem[]>([
    {
      label: SHELL_LABELS.dashboard,
      icon: 'pi pi-home',
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
