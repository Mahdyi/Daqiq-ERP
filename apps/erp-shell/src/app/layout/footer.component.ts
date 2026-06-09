import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { SHELL_LABELS } from './shell.labels';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="erp-footer">
      <span>{{ productName() }}</span>
      <span>{{ copyrightLabel() }}</span>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {
  readonly productName = input(SHELL_LABELS.productName);
  readonly year = input(new Date().getFullYear());

  protected readonly copyrightLabel = computed(() => `${SHELL_LABELS.footerVersion} - ${this.year()}`);
}
