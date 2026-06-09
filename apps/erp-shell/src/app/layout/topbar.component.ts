import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ThemePreference, ThemeService } from '@daqiq/core';

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
          [attr.aria-label]="sidebarCollapsed() ? 'Show menu' : 'Collapse menu'"
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
        <div class="erp-theme-switcher" role="group" aria-label="Theme preference">
          @for (option of themeOptions; track option.value) {
            <button
              class="erp-theme-switcher__button"
              type="button"
              [class.erp-theme-switcher__button--active]="selectedTheme() === option.value"
              [attr.aria-pressed]="selectedTheme() === option.value"
              [attr.aria-label]="option.label"
              (click)="setTheme(option.value)"
            >
              <i [class]="option.icon" aria-hidden="true"></i>
            </button>
          }
        </div>

        <button class="erp-icon-button" type="button" aria-label="Notifications">
          <i class="pi pi-bell" aria-hidden="true"></i>
        </button>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopbarComponent {
  private readonly themeService = inject(ThemeService);

  readonly title = input('Daqiq ERP');
  readonly subtitle = input('ERP foundation');
  readonly sidebarCollapsed = input(false);
  readonly sidebarToggled = output<void>();

  protected readonly selectedTheme = this.themeService.preference;
  protected readonly themeOptions: readonly ThemePreferenceOption[] = [
    {
      label: 'Light',
      icon: 'pi pi-sun',
      value: 'light'
    },
    {
      label: 'Dark',
      icon: 'pi pi-moon',
      value: 'dark'
    },
    {
      label: 'System',
      icon: 'pi pi-desktop',
      value: 'system'
    }
  ];

  protected setTheme(preference: ThemePreference): void {
    this.themeService.setPreference(preference);
  }
}
