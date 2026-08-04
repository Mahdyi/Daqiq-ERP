import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage } from '@daqiq/core';
import { firstValueFrom } from 'rxjs';

import { InventoryMovementRepository } from '../data-access/inventory-movement-repository.service';
import type { InventoryMovementQuery } from '../models/inventory-query.model';
import type { InventoryMovement } from '../models/inventory-movement.model';

const DEFAULT_QUERY: InventoryMovementQuery = {
  page: 0,
  pageSize: 20,
  sortField: 'occurredAt',
  sortDirection: 'desc'
};

interface InventoryMovementState {
  readonly page: ApiPage<InventoryMovement> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
  readonly requestVersion: number;
}

@Injectable()
export class InventoryMovementFacade {
  private readonly repository = inject(InventoryMovementRepository);
  private readonly stateSignal = signal<InventoryMovementState>({
    page: null,
    loading: false,
    error: null,
    requestVersion: 0
  });
  private readonly querySignal = signal<InventoryMovementQuery | null>(null);

  readonly state: Signal<InventoryMovementState> = this.stateSignal.asReadonly();
  readonly query: Signal<InventoryMovementQuery | null> = this.querySignal.asReadonly();
  readonly page = computed(() => this.state().page);
  readonly items = computed(() => this.page()?.items ?? []);
  readonly totalItems = computed(() => this.page()?.totalItems ?? 0);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadDefault(): Promise<void> {
    await this.load(DEFAULT_QUERY);
  }

  async load(query: InventoryMovementQuery): Promise<void> {
    const requestVersion = this.state().requestVersion + 1;
    this.querySignal.set(query);
    this.stateSignal.update((state) => ({
      ...state,
      loading: true,
      error: null,
      requestVersion
    }));

    try {
      const page = await firstValueFrom(this.repository.list(query));

      if (this.state().requestVersion !== requestVersion) {
        return;
      }

      this.stateSignal.update((state) => ({
        ...state,
        page,
        loading: false,
        error: null
      }));
    } catch (error: unknown) {
      if (this.state().requestVersion !== requestVersion) {
        return;
      }

      this.stateSignal.update((state) => ({
        ...state,
        loading: false,
        error: toApiError(error)
      }));
    }
  }

  async refresh(): Promise<void> {
    await this.load(this.query() ?? DEFAULT_QUERY);
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

  async sort(
    sortField: keyof InventoryMovement | null,
    sortDirection: 'asc' | 'desc' | null
  ): Promise<void> {
    await this.load({
      ...(this.query() ?? DEFAULT_QUERY),
      page: 0,
      sortField: sortField ?? undefined,
      sortDirection: sortDirection ?? undefined
    });
  }
}

function toApiError(error: unknown): ApiError {
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
