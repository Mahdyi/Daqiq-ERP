import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  PRIMARY_OUTLET,
  Router,
  RouterLink
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';

export interface UiBreadcrumbItem {
  readonly label: string;
  readonly route: readonly string[];
}

@Component({
  selector: 'daqiq-breadcrumb',
  imports: [RouterLink],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbComponent {
  private readonly router = inject(Router);
  private readonly navigationUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    {
      initialValue: this.router.url
    }
  );

  readonly ariaLabel = 'مسیر صفحه';
  readonly items = computed<readonly UiBreadcrumbItem[]>(() => {
    this.navigationUrl();
    return this.buildItems(this.router.routerState.snapshot.root);
  });

  private buildItems(root: ActivatedRouteSnapshot): readonly UiBreadcrumbItem[] {
    const items: UiBreadcrumbItem[] = [];
    const segments: string[] = [];
    let current: ActivatedRouteSnapshot | undefined = root;

    while (current) {
      const nextRoute: ActivatedRouteSnapshot | undefined = current.children.find(
        (child) => child.outlet === PRIMARY_OUTLET
      );

      if (!nextRoute) {
        break;
      }

      segments.push(...nextRoute.url.map((segment) => segment.path));

      const label = nextRoute.data['breadcrumb'];

      if (typeof label === 'string' && label.trim().length > 0) {
        items.push({
          label,
          route: ['/', ...segments]
        });
      }

      current = nextRoute;
    }

    return items;
  }
}
