import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

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
  readonly productName = input('Daqiq ERP');
  readonly year = input(new Date().getFullYear());

  protected readonly copyrightLabel = computed(() => `نسخه پایه - ${this.year()}`);
}
