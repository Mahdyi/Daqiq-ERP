import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NavigationItem } from '@daqiq/core';
import { SidebarNavigationComponent } from '@daqiq/ui';

import { SHELL_LABELS } from './shell.labels';

@Component({
  selector: 'app-sidebar',
  imports: [SidebarNavigationComponent],
  template: `
    <aside class="erp-sidebar" [attr.aria-label]="labels.menu">
      <div class="erp-sidebar__header">
        <div class="erp-sidebar__brand">
          <span class="erp-sidebar__logo" aria-hidden="true">D</span>
          <div class="erp-sidebar__copy">
            <p class="erp-sidebar__title">{{ labels.productName }}</p>
            <p class="erp-sidebar__subtitle">{{ labels.productSubtitle }}</p>
          </div>
        </div>
      </div>

      <daqiq-sidebar-navigation
        [ariaLabel]="labels.menu"
        [collapsed]="collapsed()"
        [items]="items()"
        (itemSelected)="itemSelected.emit()"
      />
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  readonly collapsed = input(false);
  readonly items = input.required<readonly NavigationItem[]>();
  readonly itemSelected = output<void>();

  protected readonly labels = SHELL_LABELS;
}
