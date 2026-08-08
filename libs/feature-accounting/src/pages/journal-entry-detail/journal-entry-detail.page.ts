import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonComponent,
  CardComponent,
  DataTableComponent,
  EmptyStateComponent,
  PageContainerComponent
} from '@daqiq/ui';

import { formatDate, formatMoney } from '../../config/accounting-format.util';
import { createJournalEntryLineTableColumns } from '../../config/journal-entry-line-table.config';
import { JournalEntryFacade } from '../../facades/journal-entry.facade';
import type { JournalEntry } from '../../models/journal-entry.model';

@Component({
  selector: 'daqiq-journal-entry-detail-page',
  imports: [PageContainerComponent, CardComponent, DataTableComponent, ButtonComponent, EmptyStateComponent],
  templateUrl: './journal-entry-detail.page.html',
  styleUrl: './journal-entry-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JournalEntryDetailPage implements OnInit {
  protected readonly facade = inject(JournalEntryFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly journalId = this.route.snapshot.paramMap.get('id');
  protected readonly lineColumns = createJournalEntryLineTableColumns();
  protected readonly title = computed(() =>
    this.facade.selectedEntry()?.journalNumber
      ? `سند حسابداری ${this.facade.selectedEntry()?.journalNumber}`
      : 'جزئیات سند حسابداری'
  );

  ngOnInit(): void {
    if (this.journalId) {
      void this.facade.loadDetail(this.journalId);
    }
  }

  protected handleBack(): void {
    void this.router.navigate(['/accounting/journal-entries']);
  }

  protected handleReload(): void {
    if (this.journalId) {
      void this.facade.loadDetail(this.journalId);
    }
  }

  protected handlePost(entry: JournalEntry): void {
    void this.facade.post(entry);
  }

  protected handleCancel(entry: JournalEntry): void {
    void this.facade.cancel(entry);
  }

  protected formatDate(value: Date | null): string {
    return formatDate(value);
  }

  protected formatMoney(value: number): string {
    return formatMoney(value);
  }
}
