import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage, AuthorizationService } from '@daqiq/core';
import { ConfirmationService, NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { FeatureFlagsRepository } from '../data-access/feature-flags-repository.service';
import type { FeatureFlag } from '../models/feature-flag.model';
import type { FeatureFlagQuery } from '../models/feature-flag-query.model';

const DEFAULT_QUERY: FeatureFlagQuery = {
  page: 0,
  pageSize: 20
};

@Injectable()
export class FeatureFlagsFacade {
  private readonly repository = inject(FeatureFlagsRepository);
  private readonly authorization = inject(AuthorizationService);
  private readonly notifications = inject(NotificationService);
  private readonly confirmations = inject(ConfirmationService);
  private readonly pageSignal = signal<ApiPage<FeatureFlag> | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly submittingSignal = signal(false);
  private readonly errorSignal = signal<ApiError | null>(null);
  private readonly querySignal = signal<FeatureFlagQuery>(DEFAULT_QUERY);

  readonly page: Signal<ApiPage<FeatureFlag> | null> = this.pageSignal.asReadonly();
  readonly items = computed(() => this.page()?.items ?? []);
  readonly totalItems = computed(() => this.page()?.totalItems ?? 0);
  readonly loading = this.loadingSignal.asReadonly();
  readonly submitting = this.submittingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly canUpdate = computed(() => this.authorization.hasPermission('featureFlags.update'));

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

  async toggle(flag: FeatureFlag): Promise<void> {
    const enabled = !flag.enabled;
    const accepted = await this.confirmations.confirm({
      header: enabled ? 'فعال‌سازی قابلیت' : 'غیرفعال‌سازی قابلیت',
      message: enabled
        ? 'آیا از فعال‌سازی این قابلیت مطمئن هستید؟'
        : 'آیا از غیرفعال‌سازی این قابلیت مطمئن هستید؟',
      icon: 'pi pi-toggle-on'
    });

    if (!accepted) {
      return;
    }

    this.submittingSignal.set(true);

    try {
      await firstValueFrom(
        this.repository.update({
          flagKey: flag.flagKey,
          enabled
        })
      );
      await this.refresh();
      this.notifications.success('وضعیت قابلیت با موفقیت به‌روزرسانی شد.');
    } catch (error: unknown) {
      this.errorSignal.set(this.toApiError(error));
    } finally {
      this.submittingSignal.set(false);
    }
  }

  private async load(query: FeatureFlagQuery): Promise<void> {
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
