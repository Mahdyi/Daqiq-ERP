import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationFacade } from '@daqiq/core';
import { BreadcrumbComponent } from '@daqiq/ui';

import { FooterComponent } from './footer.component';
import { SidebarComponent } from './sidebar.component';
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
          [items]="navigation.items()"
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
          <daqiq-breadcrumb />

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
  protected readonly navigation = inject(NavigationFacade);

  protected readonly labels = SHELL_LABELS;
  protected readonly sidebarCollapsed = signal(false);

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  protected closeSidebarOnSmallScreens(): void {
    if (this.document.defaultView?.matchMedia('(max-width: 900px)').matches === true) {
      this.sidebarCollapsed.set(true);
    }
  }
}
