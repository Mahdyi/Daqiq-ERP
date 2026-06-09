import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-topbar',
  template: `
    <header class="erp-topbar">
      <div class="erp-topbar__brand">
        <button
          class="erp-icon-button"
          type="button"
          [attr.aria-label]="sidebarCollapsed() ? 'نمایش منو' : 'جمع کردن منو'"
          (click)="sidebarToggled.emit()"
        >
          <i class="pi pi-bars" aria-hidden="true"></i>
        </button>

        <div>
          <p class="erp-topbar__title">{{ title() }}</p>
          <p class="erp-topbar__subtitle">{{ subtitle() }}</p>
        </div>
      </div>

      <button class="erp-icon-button" type="button" aria-label="اعلان‌ها">
        <i class="pi pi-bell" aria-hidden="true"></i>
      </button>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopbarComponent {
  readonly title = input('Daqiq ERP');
  readonly subtitle = input('زیرساخت اولیه ERP');
  readonly sidebarCollapsed = input(false);
  readonly sidebarToggled = output<void>();
}
