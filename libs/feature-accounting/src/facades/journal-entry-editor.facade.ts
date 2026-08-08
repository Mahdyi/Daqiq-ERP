import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiError, RuntimeConfigService, RuntimeLookupValue } from '@daqiq/core';
import { NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { GlAccountRepository } from '../data-access/gl-account-repository.service';
import { JournalEntryCommandService } from '../data-access/journal-entry-command.service';
import type { GlAccount } from '../models/gl-account.model';
import { calculateJournalTotals, isValidManualJournalLine } from '../models/journal-balance.util';
import type { ManualJournalFormValue, ManualJournalLineValue } from '../models/manual-journal.model';
import { toApiError } from './accounting-error.util';

const EMPTY_LINE: ManualJournalLineValue = {
  accountId: '',
  description: null,
  debitAmount: 0,
  creditAmount: 0
};

@Injectable()
export class JournalEntryEditorFacade {
  private readonly accounts = inject(GlAccountRepository);
  private readonly commands = inject(JournalEntryCommandService);
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  private readonly accountOptionsSignal = signal<readonly GlAccount[]>([]);
  private readonly currencyOptionsSignal = signal<readonly RuntimeLookupValue[]>([]);
  private readonly linesSignal = signal<readonly ManualJournalLineValue[]>([
    { ...EMPTY_LINE },
    { ...EMPTY_LINE }
  ]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<ApiError | null>(null);

  readonly accountOptions = this.accountOptionsSignal.asReadonly();
  readonly currencyOptions = this.currencyOptionsSignal.asReadonly();
  readonly lines = this.linesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly totals = computed(() => calculateJournalTotals(this.lines()));
  readonly canSubmit = computed(
    () =>
      this.lines().length >= 2 &&
      this.lines().every(isValidManualJournalLine) &&
      this.totals().balanced &&
      !this.loading()
  );

  async loadReferenceData(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const [accounts, currencies] = await Promise.all([
        firstValueFrom(this.accounts.list({ page: 0, pageSize: 500, active: true, postable: true })),
        firstValueFrom(this.runtimeConfig.getLookupValues('currency'))
      ]);
      this.accountOptionsSignal.set(accounts.items);
      this.currencyOptionsSignal.set(currencies);
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
    } finally {
      this.loadingSignal.set(false);
    }
  }

  addLine(): void {
    this.linesSignal.update((lines) => [...lines, { ...EMPTY_LINE }]);
  }

  removeLine(index: number): void {
    this.linesSignal.update((lines) =>
      lines.length <= 2 ? lines : lines.filter((_line, lineIndex) => lineIndex !== index)
    );
  }

  updateLine(index: number, patch: Partial<ManualJournalLineValue>): void {
    this.linesSignal.update((lines) =>
      lines.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line))
    );
  }

  async submit(header: Omit<ManualJournalFormValue, 'lines'>): Promise<void> {
    if (!this.canSubmit()) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const result = await firstValueFrom(
        this.commands.createManual({
          ...header,
          lines: this.lines()
        })
      );
      this.notifications.success('سند حسابداری با موفقیت ایجاد شد.');
      await this.router.navigate(['/accounting/journal-entries', result.entry.id]);
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
    } finally {
      this.loadingSignal.set(false);
    }
  }
}
