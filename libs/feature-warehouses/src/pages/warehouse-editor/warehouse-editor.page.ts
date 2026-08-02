import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonComponent,
  CardComponent,
  DynamicFormComponent,
  FormSubmitEvent,
  PageContainerComponent
} from '@daqiq/ui';

import { WarehouseFacade } from '../../facades/warehouse.facade';
import {
  DEFAULT_WAREHOUSE_FORM_VALUE,
  mapWarehouseToFormValue
} from '../../mappers/warehouse-form.mapper';
import type { WarehouseFormValue } from '../../models/warehouse-form-value.model';

@Component({
  selector: 'daqiq-warehouse-editor-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DynamicFormComponent,
    ButtonComponent
  ],
  templateUrl: './warehouse-editor.page.html',
  styleUrl: './warehouse-editor.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarehouseEditorPage implements OnInit {
  protected readonly facade = inject(WarehouseFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly warehouseId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = this.warehouseId !== null;
  protected readonly title = this.isEditMode ? 'ویرایش انبار' : 'ایجاد انبار';
  protected readonly initialValue = computed(() => {
    const warehouse = this.facade.editingWarehouse();
    return warehouse ? mapWarehouseToFormValue(warehouse) : DEFAULT_WAREHOUSE_FORM_VALUE;
  });

  ngOnInit(): void {
    if (this.warehouseId) {
      void this.facade.loadForEdit(this.warehouseId);
      return;
    }

    void this.facade.loadLookups();
  }

  protected handleRetry(): void {
    if (this.warehouseId) {
      void this.facade.loadForEdit(this.warehouseId);
      return;
    }

    void this.facade.loadLookups();
  }

  protected async handleSubmit(event: FormSubmitEvent<WarehouseFormValue>): Promise<void> {
    const success = this.isEditMode && this.warehouseId
      ? await this.facade.updateWarehouse(this.warehouseId, event.value)
      : await this.facade.createWarehouse(event.value);

    if (success) {
      await this.router.navigate(['/master-data/warehouses']);
    }
  }

  protected handleCancel(): void {
    void this.router.navigate(['/master-data/warehouses']);
  }
}
