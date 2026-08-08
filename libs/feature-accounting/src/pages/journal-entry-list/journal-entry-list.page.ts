import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ButtonComponent,
  CardComponent,
  DataTableComponent,
  EmptyStateComponent,
  PageContainerComponent
} from '@daqiq/ui';

import { createJournalEntryTableColumns } from '../../config/journal-entry-table.config';
import { JournalEntryFacade } from '../../facades/journal-entry.facade';
import type { JournalEntry } from '../../models/journal-entry.model';

@Component({
  selector: 'daqiq-journal-entry-list-page',
  imports: [PageContainerComponent, CardComponent, DataTableComponent, ButtonComponent, EmptyStateComponent],
  templateUrl: './journal-entry-list.page.html',
  styleUrl: './journal-entry-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JournalEntryListPage implements OnInit {
  protected readonly facade = inject(JournalEntryFacade);
  private readonly router = inject(Router);
  protected readonly columns = createJournalEntryTableColumns();
  protected readonly searchTerm = signal('');

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

  protected handleCreate(): void {
    void this.router.navigate(['/accounting/journal-entries/new']);
  }

  protected handleView(entry: JournalEntry): void {
    void this.router.navigate(['/accounting/journal-entries', entry.id]);
  }
}
