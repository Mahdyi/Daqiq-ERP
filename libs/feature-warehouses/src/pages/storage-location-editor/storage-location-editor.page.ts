import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonComponent,
  CardComponent,
  DynamicFormComponent,
  FormSubmitEvent,
  PageContainerComponent
} from '@daqiq/ui';

import { StorageLocationFacade } from '../../facades/storage-location.facade';
import {
  DEFAULT_STORAGE_LOCATION_FORM_VALUE,
  mapStorageLocationToFormValue
} from '../../mappers/storage-location-form.mapper';
import type { StorageLocationFormValue } from '../../models/storage-location-form-value.model';

@Component({
  selector: 'daqiq-storage-location-editor-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DynamicFormComponent,
    ButtonComponent
  ],
  templateUrl: './storage-location-editor.page.html',
  styleUrl: './storage-location-editor.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorageLocationEditorPage implements OnInit {
  protected readonly facade = inject(StorageLocationFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly locationId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = this.locationId !== null;
  protected readonly title = this.isEditMode ? 'ویرایش موقعیت انبار' : 'ایجاد موقعیت انبار';
  protected readonly initialValue = computed(() => {
    const location = this.facade.editingLocation();
    return location
      ? mapStorageLocationToFormValue(location)
      : DEFAULT_STORAGE_LOCATION_FORM_VALUE;
  });

  ngOnInit(): void {
    if (this.locationId) {
      void this.facade.loadForEdit(this.locationId);
      return;
    }

    void this.facade.loadReferenceData();
  }

  protected handleRetry(): void {
    if (this.locationId) {
      void this.facade.loadForEdit(this.locationId);
      return;
    }

    void this.facade.loadReferenceData();
  }

  protected async handleSubmit(event: FormSubmitEvent<StorageLocationFormValue>): Promise<void> {
    const success = this.isEditMode && this.locationId
      ? await this.facade.updateLocation(this.locationId, event.value)
      : await this.facade.createLocation(event.value);

    if (success) {
      await this.router.navigate(['/master-data/storage-locations']);
    }
  }

  protected handleCancel(): void {
    void this.router.navigate(['/master-data/storage-locations']);
  }
}
