import { Injectable, computed, inject } from '@angular/core';

import { AuthorizationService } from '../auth/authorization/authorization.service';
import { NavigationItem } from './models/navigation-item.model';
import { APP_NAVIGATION } from './navigation.config';

@Injectable({
  providedIn: 'root'
})
export class NavigationFacade {
  private readonly authorization = inject(AuthorizationService);

  readonly items = computed<readonly NavigationItem[]>(() =>
    this.filterItems(APP_NAVIGATION)
  );

  private filterItems(items: readonly NavigationItem[]): readonly NavigationItem[] {
    const visibleItems: NavigationItem[] = [];
    let changed = false;

    for (const item of items) {
      if (
        item.authorization &&
        !this.authorization.canAccess(item.authorization)
      ) {
        changed = true;
        continue;
      }

      const visibleChildren = item.children
        ? this.filterItems(item.children)
        : undefined;
      const hasDirectDestination =
        (item.route?.length ?? 0) > 0 || Boolean(item.externalUrl);

      if (item.children && visibleChildren?.length === 0 && !hasDirectDestination) {
        changed = true;
        continue;
      }

      if (item.children && visibleChildren !== item.children) {
        changed = true;
        visibleItems.push({
          ...item,
          children: visibleChildren
        });
        continue;
      }

      visibleItems.push(item);
    }

    return changed ? visibleItems : items;
  }
}
