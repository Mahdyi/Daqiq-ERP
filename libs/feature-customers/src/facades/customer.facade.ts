import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError } from '@daqiq/core';
import { AuthorizationService } from '@daqiq/core';
import { CrudFacadeBase } from '@daqiq/shared';
import { ConfirmationService, NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { CustomerRepository } from '../data-access/customer-repository.service';
import { CreateCustomerPostgrestRequest } from '../dto/create-customer-postgrest-request.dto';
import { UpdateCustomerPostgrestRequest } from '../dto/update-customer-postgrest-request.dto';
import {
  mapFormValueToCreateRequest,
  mapFormValueToUpdateRequest
} from '../mappers/customer-form.mapper';
import { Customer } from '../models/customer.model';
import { CustomerFormValue } from '../models/customer-form-value.model';
import { CustomerQuery } from '../models/customer-query.model';

const DEFAULT_QUERY: CustomerQuery = {
  page: 0,
  pageSize: 20,
  sortField: 'createdAt',
  sortDirection: 'desc'
};

@Injectable()
export class CustomerFacade extends CrudFacadeBase<
  Customer,
  string,
  CreateCustomerPostgrestRequest,
  UpdateCustomerPostgrestRequest,
  CustomerQuery
> {
  protected override readonly resource = inject(CustomerRepository);

  private readonly authorization = inject(AuthorizationService);
  private readonly notifications = inject(NotificationService);
  private readonly confirmations = inject(ConfirmationService);
  private readonly editingCustomerSignal = signal<Customer | null>(null);
  private readonly editorLoadingSignal = signal(false);
  private readonly editorErrorSignal = signal<ApiError | null>(null);
  private readonly submittingSignal = signal(false);

  readonly editingCustomer: Signal<Customer | null> = this.editingCustomerSignal.asReadonly();
  readonly editorLoading: Signal<boolean> = this.editorLoadingSignal.asReadonly();
  readonly editorError: Signal<ApiError | null> = this.editorErrorSignal.asReadonly();
  readonly submitting: Signal<boolean> = this.submittingSignal.asReadonly();
  readonly canCreate = computed(() => this.authorization.hasPermission('customers.create'));
  readonly canUpdate = computed(() => this.authorization.hasPermission('customers.update'));
  readonly canDelete = computed(() => this.authorization.hasPermission('customers.delete'));
  readonly canView = computed(() => this.authorization.hasPermission('customers.view'));

  async loadDefault(): Promise<void> {
    await this.load(DEFAULT_QUERY);
  }

  async search(search: string): Promise<void> {
    await this.load({
      ...(this.query() ?? DEFAULT_QUERY),
      page: 0,
      search: search.trim() || undefined
    });
  }

  async paginate(page: number, pageSize: number): Promise<void> {
    await this.load({
      ...(this.query() ?? DEFAULT_QUERY),
      page,
      pageSize
    });
  }

  async sort(sortField: keyof Customer | null, sortDirection: 'asc' | 'desc' | null): Promise<void> {
    await this.load({
      ...(this.query() ?? DEFAULT_QUERY),
      page: 0,
      sortField: sortField ?? undefined,
      sortDirection: sortDirection ?? undefined
    });
  }

  async loadForEdit(id: string): Promise<void> {
    this.editorLoadingSignal.set(true);
    this.editorErrorSignal.set(null);

    try {
      const customer = await firstValueFrom(this.resource.getById(id));
      this.editingCustomerSignal.set(customer);
    } catch (error: unknown) {
      const apiError = error instanceof ApiError
        ? error
        : new ApiError({
            status: 0,
            code: 'UNKNOWN',
            message: 'خطای غیرمنتظره رخ داد.',
            fieldErrors: [],
            cause: error
          });
      this.editorErrorSignal.set(apiError);
      this.editingCustomerSignal.set(null);
    } finally {
      this.editorLoadingSignal.set(false);
    }
  }

  async createCustomer(value: Readonly<CustomerFormValue>): Promise<boolean> {
    this.submittingSignal.set(true);

    try {
      const result = await this.create(mapFormValueToCreateRequest(value));

      if (result.success) {
        this.notifications.success('مشتری با موفقیت ایجاد شد.');
        return true;
      }

      return false;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  async updateCustomer(id: string, value: Readonly<CustomerFormValue>): Promise<boolean> {
    this.submittingSignal.set(true);

    try {
      const result = await this.update(id, mapFormValueToUpdateRequest(value));

      if (result.success) {
        this.notifications.success('اطلاعات مشتری با موفقیت به‌روزرسانی شد.');
        return true;
      }

      return false;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  async deleteCustomer(customer: Customer): Promise<void> {
    const accepted = await this.confirmations.confirm({
      header: 'حذف مشتری',
      message: 'آیا از حذف این مشتری مطمئن هستید؟',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger'
    });

    if (!accepted) {
      return;
    }

    const result = await this.delete(customer.id);

    if (result.success) {
      this.notifications.success('مشتری با موفقیت حذف شد.');
    }
  }
}
