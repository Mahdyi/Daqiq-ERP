import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, AuthorizationService } from '@daqiq/core';
import { CrudFacadeBase } from '@daqiq/shared';
import { ConfirmationService, NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { UserRepository } from '../data-access/user-repository.service';
import { CreateUserRequest } from '../dto/create-user-request.dto';
import { ResetUserPasswordRequest } from '../dto/reset-user-password-request.dto';
import { UpdateUserRequest } from '../dto/update-user-request.dto';
import {
  mapFormValueToCreateUserRequest,
  mapFormValueToUpdateUserRequest
} from '../mappers/user-form.mapper';
import { ManagedUser } from '../models/user.model';
import { UserFormValue } from '../models/user-form-value.model';
import { UserQuery } from '../models/user-query.model';

const DEFAULT_QUERY: UserQuery = {
  page: 0,
  pageSize: 20
};

@Injectable()
export class UserFacade extends CrudFacadeBase<
  ManagedUser,
  string,
  CreateUserRequest,
  UpdateUserRequest,
  UserQuery
> {
  protected override readonly resource = inject(UserRepository);

  private readonly authorization = inject(AuthorizationService);
  private readonly notifications = inject(NotificationService);
  private readonly confirmations = inject(ConfirmationService);
  private readonly editingUserSignal = signal<ManagedUser | null>(null);
  private readonly editorLoadingSignal = signal(false);
  private readonly editorErrorSignal = signal<ApiError | null>(null);
  private readonly submittingSignal = signal(false);

  readonly editingUser: Signal<ManagedUser | null> = this.editingUserSignal.asReadonly();
  readonly editorLoading: Signal<boolean> = this.editorLoadingSignal.asReadonly();
  readonly editorError: Signal<ApiError | null> = this.editorErrorSignal.asReadonly();
  readonly submitting: Signal<boolean> = this.submittingSignal.asReadonly();
  readonly canView = computed(() => this.authorization.hasPermission('users.view'));
  readonly canCreate = computed(() => this.authorization.hasPermission('users.create'));
  readonly canUpdate = computed(() => this.authorization.hasPermission('users.update'));
  readonly canDelete = computed(() => this.authorization.hasPermission('users.delete'));

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

  async loadForEdit(id: string): Promise<void> {
    this.editorLoadingSignal.set(true);
    this.editorErrorSignal.set(null);

    try {
      const user = await firstValueFrom(this.resource.getById(id));
      this.editingUserSignal.set(user);
    } catch (error: unknown) {
      this.editorErrorSignal.set(this.toApiError(error));
      this.editingUserSignal.set(null);
    } finally {
      this.editorLoadingSignal.set(false);
    }
  }

  async createUser(value: Readonly<UserFormValue>): Promise<boolean> {
    this.submittingSignal.set(true);

    try {
      const result = await this.create(mapFormValueToCreateUserRequest(value));

      if (result.success) {
        this.notifications.success('کاربر با موفقیت ایجاد شد.');
        return true;
      }

      return false;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  async updateUser(id: string, value: Readonly<UserFormValue>): Promise<boolean> {
    this.submittingSignal.set(true);

    try {
      const result = await this.update(id, mapFormValueToUpdateUserRequest(value));

      if (result.success) {
        this.notifications.success('اطلاعات کاربر با موفقیت به‌روزرسانی شد.');
        return true;
      }

      return false;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  async deactivateUser(user: ManagedUser): Promise<void> {
    const accepted = await this.confirmations.confirm({
      header: 'غیرفعال‌سازی کاربر',
      message: 'آیا از غیرفعال‌سازی این کاربر مطمئن هستید؟',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger'
    });

    if (!accepted) {
      return;
    }

    const result = await this.delete(user.id);

    if (result.success) {
      this.notifications.success('کاربر با موفقیت غیرفعال شد.');
    }
  }

  async activateUser(user: ManagedUser): Promise<void> {
    try {
      await firstValueFrom(this.resource.activate(user.id));
      await this.refresh();
      this.notifications.success('کاربر با موفقیت فعال شد.');
    } catch (error: unknown) {
      this.notifications.error(this.toApiError(error).message);
    }
  }

  async resetPassword(id: string, request: ResetUserPasswordRequest): Promise<boolean> {
    const accepted = await this.confirmations.confirm({
      header: 'تغییر رمز عبور',
      message: 'آیا از تغییر رمز عبور این کاربر مطمئن هستید؟',
      icon: 'pi pi-key'
    });

    if (!accepted) {
      return false;
    }

    this.submittingSignal.set(true);

    try {
      await firstValueFrom(this.resource.resetPassword(id, request));
      this.notifications.success('رمز عبور با موفقیت تغییر کرد.');
      return true;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  private toApiError(error: unknown): ApiError {
    return error instanceof ApiError
      ? error
      : new ApiError({
          status: 0,
          code: 'UNKNOWN',
          message: 'خطای غیرمنتظره رخ داد.',
          fieldErrors: [],
          cause: error
        });
  }
}
