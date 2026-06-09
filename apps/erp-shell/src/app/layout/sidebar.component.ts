import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { SHELL_LABELS } from './shell.labels';

export interface ShellMenuItem {
  readonly label: string;
  readonly icon: string;
  readonly route: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
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

      <nav class="erp-sidebar__nav">
        @for (item of visibleMenuItems(); track item.route) {
          <a
            class="erp-sidebar__link"
            routerLinkActive="erp-sidebar__link--active"
            [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
            [routerLink]="item.route"
            (click)="itemSelected.emit(item)"
          >
            <i [class]="item.icon" aria-hidden="true"></i>
            <span class="erp-sidebar__label">{{ item.label }}</span>
          </a>
        }
      </nav>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  readonly collapsed = input(false);
  readonly menuItems = input<readonly ShellMenuItem[]>([]);
  readonly itemSelected = output<ShellMenuItem>();

  protected readonly labels = SHELL_LABELS;
  protected readonly visibleMenuItems = computed(() =>
    this.menuItems().filter((item) => item.disabled !== true)
  );
}
