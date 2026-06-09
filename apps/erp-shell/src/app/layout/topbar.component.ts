import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ThemePreference, ThemeService } from '@daqiq/core';

import { SHELL_LABELS } from './shell.labels';

interface ThemePreferenceOption {
  readonly label: string;
  readonly icon: string;
  readonly value: ThemePreference;
}

@Component({
  selector: 'app-topbar',
  template: `
    <header class="erp-topbar">
      <div class="erp-topbar__brand">
        <button
          class="erp-icon-button"
          type="button"
          [attr.aria-label]="sidebarCollapsed() ? labels.showMenu : labels.collapseMenu"
          (click)="sidebarToggled.emit()"
        >
          <i class="pi pi-bars" aria-hidden="true"></i>
        </button>

        <div>
          <p class="erp-topbar__title">{{ title() }}</p>
          <p class="erp-topbar__subtitle">{{ subtitle() }}</p>
        </div>
      </div>

      <div class="erp-topbar__actions">
        <div class="erp-topbar__search" aria-label="Search placeholder">
          <i class="pi pi-search" aria-hidden="true"></i>
          <span>{{ labels.search }}</span>
        </div>

        <div class="erp-theme-switcher" role="group" [attr.aria-label]="labels.theme.group">
          @for (option of themeOptions; track option.value) {
            <button
              class="erp-theme-switcher__button"
              type="button"
              [class.erp-theme-switcher__button--active]="selectedTheme() === option.value"
              [attr.aria-pressed]="selectedTheme() === option.value"
              [attr.aria-label]="option.label"
              [title]="option.label"
              (click)="setTheme(option.value)"
            >
              <i [class]="option.icon" aria-hidden="true"></i>
            </button>
          }
        </div>

        <button class="erp-icon-button" type="button" [attr.aria-label]="labels.notifications">
          <i class="pi pi-bell" aria-hidden="true"></i>
        </button>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopbarComponent {
  private readonly themeService = inject(ThemeService);

  readonly title = input(SHELL_LABELS.productName);
  readonly subtitle = input(SHELL_LABELS.topbarSubtitle);
  readonly sidebarCollapsed = input(false);
  readonly sidebarToggled = output<void>();

  protected readonly labels = SHELL_LABELS;
  protected readonly selectedTheme = this.themeService.preference;
  protected readonly themeOptions: readonly ThemePreferenceOption[] = [
    {
      label: SHELL_LABELS.theme.light,
      icon: 'pi pi-sun',
      value: 'light'
    },
    {
      label: SHELL_LABELS.theme.dark,
      icon: 'pi pi-moon',
      value: 'dark'
    },
    {
      label: SHELL_LABELS.theme.system,
      icon: 'pi pi-desktop',
      value: 'system'
    }
  ];

  protected setTheme(preference: ThemePreference): void {
    this.themeService.setPreference(preference);
  }
}
