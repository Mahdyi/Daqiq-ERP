import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  ButtonComponent,
  CardComponent,
  DataTableComponent,
  DataTablePageEvent,
  EmptyStateComponent,
  PageContainerComponent
} from '@daqiq/ui';

import {
  SETTINGS_TABLE_COLUMNS,
  formatSettingValue
} from '../../config/settings-table.config';
import { SettingsRepository } from '../../data-access/settings-repository.service';
import { SettingsFacade } from '../../facades/settings.facade';
import {
  SystemSetting,
  SystemSettingValue
} from '../../models/system-setting.model';

@Component({
  selector: 'daqiq-settings-list-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  providers: [SettingsRepository, SettingsFacade],
  templateUrl: './settings-list.page.html',
  styleUrl: './settings-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsListPage implements OnInit {
  protected readonly facade = inject(SettingsFacade);
  protected readonly columns = SETTINGS_TABLE_COLUMNS;
  protected readonly searchTerm = signal('');
  protected readonly editingSetting = signal<SystemSetting | null>(null);
  protected readonly editValueText = signal('');
  protected readonly parseError = signal<string | null>(null);
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

  protected handleEditValueInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      this.editValueText.set(target.value);
      this.parseError.set(null);
    }
  }

  protected handleBooleanValueChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.editValueText.set(target.value);
      this.parseError.set(null);
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

  protected startEdit(setting: SystemSetting): void {
    if (!setting.editable || !this.facade.canUpdate()) {
      return;
    }

    this.editingSetting.set(setting);
    this.editValueText.set(formatSettingValue(setting.settingValue));
    this.parseError.set(null);
  }

  protected cancelEdit(): void {
    this.editingSetting.set(null);
    this.editValueText.set('');
    this.parseError.set(null);
  }

  protected async saveEdit(): Promise<void> {
    const setting = this.editingSetting();

    if (!setting) {
      return;
    }

    const parsed = this.parseValue(setting);

    if (!parsed.valid) {
      this.parseError.set(parsed.message);
      return;
    }

    const saved = await this.facade.updateSetting({
      settingKey: setting.settingKey,
      settingValue: parsed.value
    });

    if (saved) {
      this.cancelEdit();
    }
  }

  private parseValue(
    setting: SystemSetting
  ):
    | { readonly valid: true; readonly value: SystemSettingValue }
    | { readonly valid: false; readonly message: string } {
    const raw = this.editValueText().trim();

    if (setting.valueType === 'string') {
      return {
        valid: true,
        value: raw
      };
    }

    if (setting.valueType === 'number') {
      const value = Number(raw);

      return Number.isFinite(value)
        ? { valid: true, value }
        : { valid: false, message: 'مقدار عددی معتبر نیست.' };
    }

    if (setting.valueType === 'boolean') {
      if (raw === 'true') {
        return { valid: true, value: true };
      }

      if (raw === 'false') {
        return { valid: true, value: false };
      }

      return { valid: false, message: 'مقدار بولی معتبر نیست.' };
    }

    try {
      const value: unknown = JSON.parse(raw);
      return isSystemSettingValue(value)
        ? { valid: true, value }
        : { valid: false, message: 'ساختار JSON معتبر نیست.' };
    } catch {
      return { valid: false, message: 'ساختار JSON معتبر نیست.' };
    }
  }
}

function isSystemSettingValue(value: unknown): value is SystemSettingValue {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    Array.isArray(value) ||
    isRecord(value)
  );
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
