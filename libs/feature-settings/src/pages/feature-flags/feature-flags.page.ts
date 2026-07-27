import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  ButtonComponent,
  CardComponent,
  DataTableComponent,
  DataTablePageEvent,
  EmptyStateComponent,
  PageContainerComponent
} from '@daqiq/ui';

import { FEATURE_FLAGS_TABLE_COLUMNS } from '../../config/feature-flags-table.config';
import { FeatureFlagsRepository } from '../../data-access/feature-flags-repository.service';
import { FeatureFlagsFacade } from '../../facades/feature-flags.facade';
import type { FeatureFlag } from '../../models/feature-flag.model';

@Component({
  selector: 'daqiq-feature-flags-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  providers: [FeatureFlagsRepository, FeatureFlagsFacade],
  templateUrl: './feature-flags.page.html',
  styleUrl: './feature-flags.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureFlagsPage implements OnInit {
  protected readonly facade = inject(FeatureFlagsFacade);
  protected readonly columns = FEATURE_FLAGS_TABLE_COLUMNS;
  protected readonly searchTerm = signal('');
  protected readonly pageIndex = computed(() => this.facade.query().page ?? 0);
  protected readonly pageSize = computed(() => this.facade.query().pageSize ?? 20);

  ngOnInit(): void {
    void this.facade.loadDefault();
  }

  protected handleSearchInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.searchTerm.set(target.value);
    }
  }

  protected handleSearchSubmit(): void {
    void this.facade.search(this.searchTerm());
  }

  protected handleRefresh(): void {
    void this.facade.refresh();
  }

  protected handlePageChange(event: DataTablePageEvent): void {
    void this.facade.paginate(event.pageIndex, event.pageSize);
  }

  protected toggle(flag: FeatureFlag): void {
    void this.facade.toggle(flag);
  }
}
