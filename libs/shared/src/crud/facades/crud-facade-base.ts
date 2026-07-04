import { Signal, computed, signal } from '@angular/core';
import type { ApiError, ApiPage, ApiQuery } from '@daqiq/core';
import { firstValueFrom } from 'rxjs';

import { CrudId } from '../models/crud-id.model';
import { CrudListState } from '../models/crud-list-state.model';
import {
  CrudDeleteResult,
  CrudMutationResult
} from '../models/crud-mutation-result.model';
import { CrudPageRequest } from '../models/crud-page-request.model';
import { CrudResource } from '../models/crud-resource.model';
import { normalizeCrudError } from '../utilities/crud-error.util';

export abstract class CrudFacadeBase<
  TEntity,
  TId extends CrudId,
  TCreateRequest,
  TUpdateRequest,
  TQuery extends ApiQuery = ApiQuery
> {
  protected abstract readonly resource: CrudResource<
    TEntity,
    TId,
    TCreateRequest,
    TUpdateRequest,
    TQuery
  >;

  private readonly stateSignal = signal<CrudListState<TEntity>>({
    page: null,
    loading: false,
    error: null,
    requestVersion: 0
  });
  private readonly querySignal = signal<TQuery | null>(null);
  private activeOperationCount = 0;
  private nextRequestVersion = 0;

  readonly state: Signal<CrudListState<TEntity>> = this.stateSignal.asReadonly();
  readonly page: Signal<ApiPage<TEntity> | null> = computed(() => this.state().page);
  readonly items: Signal<readonly TEntity[]> = computed(() => this.page()?.items ?? []);
  readonly totalItems: Signal<number> = computed(() => this.page()?.totalItems ?? 0);
  readonly loading: Signal<boolean> = computed(() => this.state().loading);
  readonly error: Signal<ApiError | null> = computed(() => this.state().error);
  readonly hasError: Signal<boolean> = computed(() => this.error() !== null);
  readonly query: Signal<TQuery | null> = this.querySignal.asReadonly();

  async load(query: TQuery, options?: CrudPageRequest<TQuery>): Promise<void> {
    const effectiveQuery = options?.query ?? query;
    const requestVersion = this.createRequestVersion();

    this.querySignal.set(effectiveQuery);
    this.beginOperation();
    this.stateSignal.update((state) => ({
      ...state,
      error: null,
      requestVersion
    }));

    try {
      const page = await firstValueFrom(this.resource.list(effectiveQuery));

      if (this.isLatestRequest(requestVersion)) {
        this.stateSignal.update((state) => ({
          ...state,
          page,
          error: null
        }));
      }
    } catch (error: unknown) {
      if (this.isLatestRequest(requestVersion)) {
        this.stateSignal.update((state) => ({
          ...state,
          error: normalizeCrudError(error)
        }));
      }
    } finally {
      this.endOperation();
    }
  }

  async refresh(): Promise<void> {
    const currentQuery = this.query();

    if (currentQuery === null) {
      return;
    }

    await this.load(currentQuery, {
      query: currentQuery,
      forceRefresh: true
    });
  }

  async create(request: TCreateRequest): Promise<CrudMutationResult<TEntity>> {
    this.beginOperation();

    try {
      const data = await firstValueFrom(this.resource.create(request));
      await this.refresh();

      return {
        success: true,
        data
      };
    } catch (error: unknown) {
      const normalizedError = normalizeCrudError(error);
      this.setError(normalizedError);

      return {
        success: false,
        error: normalizedError
      };
    } finally {
      this.endOperation();
    }
  }

  async update(
    id: TId,
    request: TUpdateRequest
  ): Promise<CrudMutationResult<TEntity>> {
    this.beginOperation();

    try {
      const data = await firstValueFrom(this.resource.update(id, request));
      await this.refresh();

      return {
        success: true,
        data
      };
    } catch (error: unknown) {
      const normalizedError = normalizeCrudError(error);
      this.setError(normalizedError);

      return {
        success: false,
        error: normalizedError
      };
    } finally {
      this.endOperation();
    }
  }

  async delete(id: TId): Promise<CrudDeleteResult> {
    this.beginOperation();

    try {
      await firstValueFrom(this.resource.delete(id));
      await this.refresh();

      return {
        success: true
      };
    } catch (error: unknown) {
      const normalizedError = normalizeCrudError(error);
      this.setError(normalizedError);

      return {
        success: false,
        error: normalizedError
      };
    } finally {
      this.endOperation();
    }
  }

  clearError(): void {
    this.stateSignal.update((state) => ({
      ...state,
      error: null
    }));
  }

  private createRequestVersion(): number {
    this.nextRequestVersion += 1;
    return this.nextRequestVersion;
  }

  private isLatestRequest(requestVersion: number): boolean {
    return this.state().requestVersion === requestVersion;
  }

  private beginOperation(): void {
    this.activeOperationCount += 1;
    this.updateLoadingState();
  }

  private endOperation(): void {
    this.activeOperationCount = Math.max(0, this.activeOperationCount - 1);
    this.updateLoadingState();
  }

  private updateLoadingState(): void {
    const loading = this.activeOperationCount > 0;

    this.stateSignal.update((state) =>
      state.loading === loading
        ? state
        : {
            ...state,
            loading
          }
    );
  }

  private setError(error: ApiError): void {
    this.stateSignal.update((state) => ({
      ...state,
      error
    }));
  }
}
