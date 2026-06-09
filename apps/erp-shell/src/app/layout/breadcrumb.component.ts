import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { SHELL_LABELS } from './shell.labels';

export interface ShellBreadcrumbItem {
  readonly label: string;
}

@Component({
  selector: 'app-breadcrumb',
  template: `
    <nav class="erp-breadcrumb" [attr.aria-label]="labels.breadcrumb">
      <i class="pi pi-home" aria-hidden="true"></i>
      <span>{{ breadcrumbLabel() }}</span>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbComponent {
  readonly items = input<readonly ShellBreadcrumbItem[]>([{ label: SHELL_LABELS.dashboard }]);

  protected readonly labels = SHELL_LABELS;
  protected readonly breadcrumbLabel = computed(() =>
    this.items()
      .map((item) => item.label)
      .join(' / ')
  );
}
