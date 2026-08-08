import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ButtonComponent,
  CardComponent,
  PageContainerComponent
} from '@daqiq/ui';

import { formatMoney } from '../../config/accounting-format.util';
import { JournalEntryEditorFacade } from '../../facades/journal-entry-editor.facade';

@Component({
  selector: 'daqiq-journal-entry-editor-page',
  imports: [PageContainerComponent, CardComponent, ButtonComponent],
  templateUrl: './journal-entry-editor.page.html',
  styleUrl: './journal-entry-editor.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JournalEntryEditorPage implements OnInit {
  protected readonly facade = inject(JournalEntryEditorFacade);
  private readonly router = inject(Router);
  protected readonly journalDate = signal(new Date().toISOString().slice(0, 10));
  protected readonly description = signal<string | null>(null);
  protected readonly currencyLookupValueId = signal<string | null>(null);

  ngOnInit(): void {
    void this.facade.loadReferenceData();
  }

  protected handleHeaderInput(field: 'journalDate' | 'description' | 'currency', event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
      return;
    }

    const value = target.value.trim();

    if (field === 'journalDate') {
      this.journalDate.set(value);
    } else if (field === 'description') {
      this.description.set(value || null);
    } else {
      this.currencyLookupValueId.set(value || null);
    }
  }

  protected handleLineInput(
    index: number,
    field: 'accountId' | 'description' | 'debitAmount' | 'creditAmount',
    event: Event
  ): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
      return;
    }

    const value = target.value.trim();

    if (field === 'debitAmount' || field === 'creditAmount') {
      this.facade.updateLine(index, { [field]: Number(value || 0) });
      return;
    }

    if (field === 'description') {
      this.facade.updateLine(index, { description: value || null });
      return;
    }

    this.facade.updateLine(index, { accountId: value });
  }

  protected handleAddLine(): void {
    this.facade.addLine();
  }

  protected handleRemoveLine(index: number): void {
    this.facade.removeLine(index);
  }

  protected handleSubmit(): void {
    void this.facade.submit({
      journalDate: this.journalDate(),
      description: this.description(),
      currencyLookupValueId: this.currencyLookupValueId()
    });
  }

  protected handleCancel(): void {
    void this.router.navigate(['/accounting/journal-entries']);
  }

  protected formatMoney(value: number): string {
    return formatMoney(value);
  }
}
