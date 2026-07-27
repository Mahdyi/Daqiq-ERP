import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  ButtonComponent,
  CardComponent,
  DataTableComponent,
  DataTablePageEvent,
  EmptyStateComponent,
  PageContainerComponent
} from '@daqiq/ui';

import { LOOKUP_VALUES_TABLE_COLUMNS } from '../../config/lookup-values-table.config';
import { LookupsRepository } from '../../data-access/lookups-repository.service';
import { LookupsFacade } from '../../facades/lookups.facade';
import type { CreateLookupValueRequest } from '../../dto/create-lookup-value-request.dto';
import type { LookupType } from '../../models/lookup-type.model';
import type { LookupValue } from '../../models/lookup-value.model';

@Component({
  selector: 'daqiq-lookup-management-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  providers: [LookupsRepository, LookupsFacade],
  templateUrl: './lookup-management.page.html',
  styleUrl: './lookup-management.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LookupManagementPage implements OnInit {
  protected readonly facade = inject(LookupsFacade);
  protected readonly columns = LOOKUP_VALUES_TABLE_COLUMNS;
  protected readonly searchTerm = signal('');
  protected readonly editingValue = signal<LookupValue | null>(null);
  protected readonly code = signal('');
  protected readonly label = signal('');
  protected readonly description = signal('');
  protected readonly sortOrder = signal('0');
  protected readonly metadataText = signal('{}');
  protected readonly active = signal(true);
  protected readonly formError = signal<string | null>(null);
  protected readonly pageIndex = computed(() => this.facade.valueQuery()?.page ?? 0);
  protected readonly pageSize = computed(() => this.facade.valueQuery()?.pageSize ?? 20);
  protected readonly selectedType = computed(() =>
    this.facade.types().find((type) => type.code === this.facade.selectedTypeCode()) ?? null
  );

  ngOnInit(): void {
    void this.facade.loadDefault();
  }

  protected selectType(type: LookupType): void {
    this.resetForm();
    void this.facade.selectType(type.code);
  }

  protected handleSearchInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.searchTerm.set(target.value);
    }
  }

  protected handleInput(event: Event, field: 'code' | 'label' | 'description' | 'sortOrder' | 'metadata'): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) {
      return;
    }

    if (field === 'code') {
      this.code.set(target.value);
    } else if (field === 'label') {
      this.label.set(target.value);
    } else if (field === 'description') {
      this.description.set(target.value);
    } else if (field === 'sortOrder') {
      this.sortOrder.set(target.value);
    } else {
      this.metadataText.set(target.value);
    }

    this.formError.set(null);
  }

  protected handleActiveChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.active.set(target.checked);
    }
  }

  protected handleSearchSubmit(): void {
    void this.facade.searchValues(this.searchTerm());
  }

  protected handleRefresh(): void {
    void this.facade.refreshValues();
  }

  protected handlePageChange(event: DataTablePageEvent): void {
    void this.facade.paginateValues(event.pageIndex, event.pageSize);
  }

  protected startCreate(): void {
    this.resetForm();
  }

  protected startEdit(value: LookupValue): void {
    this.editingValue.set(value);
    this.code.set(value.code);
    this.label.set(value.label);
    this.description.set(value.description ?? '');
    this.sortOrder.set(String(value.sortOrder));
    this.metadataText.set(JSON.stringify(value.metadata, null, 2));
    this.active.set(value.active);
    this.formError.set(null);
  }

  protected async submitForm(): Promise<void> {
    const typeCode = this.facade.selectedTypeCode();

    if (!typeCode) {
      this.formError.set('ابتدا یک نوع داده پایه را انتخاب کنید.');
      return;
    }

    const request = this.buildRequest(typeCode);

    if (!request.valid) {
      this.formError.set(request.message);
      return;
    }

    const editing = this.editingValue();
    const saved = editing
      ? await this.facade.updateValue(editing.id, request.value)
      : await this.facade.createValue(request.value);

    if (saved) {
      this.resetForm();
    }
  }

  protected async toggleActive(value: LookupValue): Promise<void> {
    await this.facade.toggleActive(value);
  }

  protected resetForm(): void {
    this.editingValue.set(null);
    this.code.set('');
    this.label.set('');
    this.description.set('');
    this.sortOrder.set('0');
    this.metadataText.set('{}');
    this.active.set(true);
    this.formError.set(null);
  }

  private buildRequest(
    lookupTypeCode: string
  ):
    | { readonly valid: true; readonly value: CreateLookupValueRequest }
    | { readonly valid: false; readonly message: string } {
    const code = this.code().trim();
    const label = this.label().trim();
    const sortOrder = Number(this.sortOrder());

    if (!code || !label) {
      return { valid: false, message: 'کد و عنوان الزامی هستند.' };
    }

    if (!Number.isInteger(sortOrder)) {
      return { valid: false, message: 'ترتیب نمایش باید عدد صحیح باشد.' };
    }

    try {
      const metadata: unknown = JSON.parse(this.metadataText().trim() || '{}');

      if (!isRecord(metadata)) {
        return { valid: false, message: 'متادیتا باید یک شیء JSON باشد.' };
      }

      return {
        valid: true,
        value: {
          lookupTypeCode,
          code,
          label,
          description: this.description().trim() || null,
          sortOrder,
          metadata,
          active: this.active()
        }
      };
    } catch {
      return { valid: false, message: 'متادیتا JSON معتبر نیست.' };
    }
  }
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
