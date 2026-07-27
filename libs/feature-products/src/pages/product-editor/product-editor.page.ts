import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonComponent,
  CardComponent,
  DynamicFormComponent,
  FormSubmitEvent,
  PageContainerComponent
} from '@daqiq/ui';

import { ProductFacade } from '../../facades/product.facade';
import {
  DEFAULT_PRODUCT_FORM_VALUE,
  mapProductToFormValue
} from '../../mappers/product-form.mapper';
import type { ProductFormValue } from '../../models/product-form-value.model';

@Component({
  selector: 'daqiq-product-editor-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DynamicFormComponent,
    ButtonComponent
  ],
  templateUrl: './product-editor.page.html',
  styleUrl: './product-editor.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductEditorPage implements OnInit {
  protected readonly facade = inject(ProductFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly productId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = this.productId !== null;
  protected readonly title = this.isEditMode ? 'ویرایش کالا' : 'ایجاد کالا';
  protected readonly initialValue = computed(() => {
    const product = this.facade.editingProduct();
    return product ? mapProductToFormValue(product) : DEFAULT_PRODUCT_FORM_VALUE;
  });

  ngOnInit(): void {
    if (this.productId) {
      void this.facade.loadForEdit(this.productId);
      return;
    }

    void this.facade.loadLookups();
  }

  protected handleRetry(): void {
    if (this.productId) {
      void this.facade.loadForEdit(this.productId);
      return;
    }

    void this.facade.loadLookups();
  }

  protected async handleSubmit(event: FormSubmitEvent<ProductFormValue>): Promise<void> {
    const success = this.isEditMode && this.productId
      ? await this.facade.updateProduct(this.productId, event.value)
      : await this.facade.createProduct(event.value);

    if (success) {
      await this.router.navigate(['/master-data/products']);
    }
  }

  protected handleCancel(): void {
    void this.router.navigate(['/master-data/products']);
  }
}
