import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface ShellBreadcrumbItem {
  readonly label: string;
}

@Component({
  selector: 'app-breadcrumb',
  template: `
    <nav class="erp-breadcrumb" aria-label="مسیر صفحه">
      <i class="pi pi-home" aria-hidden="true"></i>
      <span>{{ breadcrumbLabel() }}</span>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbComponent {
  readonly items = input<readonly ShellBreadcrumbItem[]>([{ label: 'داشبورد' }]);

  protected readonly breadcrumbLabel = computed(() =>
    this.items()
      .map((item) => item.label)
      .join(' / ')
  );
}
