import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage, AuthorizationService } from '@daqiq/core';
import { NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { SettingsRepository } from '../data-access/settings-repository.service';
import type { UpdateSystemSettingRequest } from '../dto/update-system-setting-request.dto';
import type { SettingsQuery } from '../models/settings-query.model';
import type { SystemSetting } from '../models/system-setting.model';

const DEFAULT_QUERY: SettingsQuery = {
  page: 0,
  pageSize: 20
};

@Injectable()
export class SettingsFacade {
  private readonly repository = inject(SettingsRepository);
  private readonly authorization = inject(AuthorizationService);
  private readonly notifications = inject(NotificationService);
  private readonly pageSignal = signal<ApiPage<SystemSetting> | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly submittingSignal = signal(false);
  private readonly errorSignal = signal<ApiError | null>(null);
  private readonly querySignal = signal<SettingsQuery>(DEFAULT_QUERY);

  readonly page: Signal<ApiPage<SystemSetting> | null> = this.pageSignal.asReadonly();
  readonly items = computed(() => this.page()?.items ?? []);
  readonly totalItems = computed(() => this.page()?.totalItems ?? 0);
  readonly loading = this.loadingSignal.asReadonly();
  readonly submitting = this.submittingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly canUpdate = computed(() => this.authorization.hasPermission('settings.update'));

  async loadDefault(): Promise<void> {
    await this.load(DEFAULT_QUERY);
  }

  async search(search: string): Promise<void> {
    await this.load({
      ...this.query(),
      page: 0,
      search: search.trim() || undefined
    });
  }

  async paginate(page: number, pageSize: number): Promise<void> {
    await this.load({
      ...this.query(),
      page,
      pageSize
    });
  }

  async refresh(): Promise<void> {
    await this.load(this.query());
  }

  async load(query: SettingsQuery): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.querySignal.set(query);

    try {
      this.pageSignal.set(await firstValueFrom(this.repository.list(query)));
    } catch (error: unknown) {
      this.errorSignal.set(this.toApiError(error));
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async updateSetting(request: UpdateSystemSettingRequest): Promise<boolean> {
    this.submittingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await firstValueFrom(this.repository.update(request));
      await this.refresh();
      this.notifications.success('تنظیمات سامانه با موفقیت به‌روزرسانی شد.');
      return true;
    } catch (error: unknown) {
      this.errorSignal.set(this.toApiError(error));
      return false;
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
