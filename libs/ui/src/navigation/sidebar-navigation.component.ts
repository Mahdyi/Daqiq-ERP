import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavigationItem } from '@daqiq/core';

@Component({
  selector: 'daqiq-sidebar-navigation',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar-navigation.component.html',
  styleUrl: './sidebar-navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarNavigationComponent {
  readonly items = input.required<readonly NavigationItem[]>();
  readonly collapsed = input(false);
  readonly ariaLabel = input('منوی اصلی');
  readonly itemSelected = output<NavigationItem>();

  protected selectItem(item: NavigationItem): void {
    this.itemSelected.emit(item);
  }
}
