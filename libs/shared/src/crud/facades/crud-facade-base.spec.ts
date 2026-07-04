import { ApiError, ApiPage, ApiQuery } from '@daqiq/core';
import { Observable, Subject, of, throwError } from 'rxjs';

import { CrudResource } from '../models/crud-resource.model';
import { CrudFacadeBase } from './crud-facade-base';

interface ExampleEntity {
  readonly id: string;
  readonly name: string;
}

interface ExampleCreateRequest {
  readonly name: string;
}

interface ExampleUpdateRequest {
  readonly name: string;
}

interface ExampleQuery extends ApiQuery {
  readonly search?: string;
}

class ExampleResource
  implements
    CrudResource<
      ExampleEntity,
      string,
      ExampleCreateRequest,
      ExampleUpdateRequest,
      ExampleQuery
    >
{
  readonly listQueries: (ExampleQuery | undefined)[] = [];
  listResponses: Observable<ApiPage<ExampleEntity>>[] = [];
  createResponse: Observable<ExampleEntity> = of({ id: 'created', name: 'Created' });
  updateResponse: Observable<ExampleEntity> = of({ id: 'updated', name: 'Updated' });
  deleteResponse: Observable<void> = of(undefined);

  list(query?: ExampleQuery): Observable<ApiPage<ExampleEntity>> {
    this.listQueries.push(query);

    return this.listResponses.shift() ?? of(createPage([]));
  }

  getById(id: string): Observable<ExampleEntity> {
    return of({ id, name: 'Loaded' });
  }

  create(): Observable<ExampleEntity> {
    return this.createResponse;
  }

  update(): Observable<ExampleEntity> {
    return this.updateResponse;
  }

  delete(): Observable<void> {
    return this.deleteResponse;
  }
}

class ExampleFacade extends CrudFacadeBase<
  ExampleEntity,
  string,
  ExampleCreateRequest,
  ExampleUpdateRequest,
  ExampleQuery
> {
  protected override readonly resource: ExampleResource;

  constructor(resource: ExampleResource) {
    super();
    this.resource = resource;
  }
}

describe('CrudFacadeBase', () => {
  it('loads a typed page and exposes items', async () => {
    const resource = new ExampleResource();
    resource.listResponses = [
      of(createPage([{ id: '1', name: 'One' }]))
    ];
    const facade = new ExampleFacade(resource);

    await facade.load({ page: 1, pageSize: 10 });

    expect(facade.items()).toEqual([{ id: '1', name: 'One' }]);
    expect(facade.totalItems()).toBe(1);
    expect(facade.loading()).toBeFalse();
    expect(facade.error()).toBeNull();
  });

  it('prevents stale list responses from overwriting newer results', async () => {
    const resource = new ExampleResource();
    const firstResponse = new Subject<ApiPage<ExampleEntity>>();
    const secondResponse = new Subject<ApiPage<ExampleEntity>>();
    resource.listResponses = [firstResponse, secondResponse];
    const facade = new ExampleFacade(resource);

    const firstLoad = facade.load({ page: 1, pageSize: 10, search: 'old' });
    const secondLoad = facade.load({ page: 2, pageSize: 10, search: 'new' });

    secondResponse.next(createPage([{ id: '2', name: 'New' }], 2));
    secondResponse.complete();
    firstResponse.next(createPage([{ id: '1', name: 'Old' }], 1));
    firstResponse.complete();

    await Promise.all([firstLoad, secondLoad]);

    expect(facade.items()).toEqual([{ id: '2', name: 'New' }]);
    expect(facade.query()).toEqual({ page: 2, pageSize: 10, search: 'new' });
  });

  it('refreshes with the current query', async () => {
    const resource = new ExampleResource();
    resource.listResponses = [
      of(createPage([{ id: '1', name: 'First' }])),
      of(createPage([{ id: '2', name: 'Refreshed' }]))
    ];
    const facade = new ExampleFacade(resource);
    const query: ExampleQuery = { page: 3, pageSize: 25, search: 'active' };

    await facade.load(query);
    await facade.refresh();

    expect(resource.listQueries).toEqual([query, query]);
    expect(facade.items()).toEqual([{ id: '2', name: 'Refreshed' }]);
  });

  it('returns create success results and refreshes the active list', async () => {
    const resource = new ExampleResource();
    resource.listResponses = [
      of(createPage([{ id: '1', name: 'Existing' }])),
      of(createPage([{ id: 'created', name: 'Created' }]))
    ];
    resource.createResponse = of({ id: 'created', name: 'Created' });
    const facade = new ExampleFacade(resource);

    await facade.load({ page: 1, pageSize: 10 });
    const result = await facade.create({ name: 'Created' });

    expect(result).toEqual({
      success: true,
      data: { id: 'created', name: 'Created' }
    });
    expect(resource.listQueries.length).toBe(2);
    expect(facade.items()).toEqual([{ id: 'created', name: 'Created' }]);
  });

  it('returns typed update failures for ApiError values', async () => {
    const resource = new ExampleResource();
    const apiError = createApiError('VALIDATION');
    resource.updateResponse = throwError(() => apiError);
    const facade = new ExampleFacade(resource);

    const result = await facade.update('1', { name: 'Invalid' });

    expect(result).toEqual({
      success: false,
      error: apiError
    });
    expect(facade.error()).toBe(apiError);
  });

  it('returns delete success results and refreshes the active list', async () => {
    const resource = new ExampleResource();
    resource.listResponses = [
      of(createPage([{ id: '1', name: 'Existing' }])),
      of(createPage([]))
    ];
    const facade = new ExampleFacade(resource);

    await facade.load({ page: 1, pageSize: 10 });
    const result = await facade.delete('1');

    expect(result).toEqual({ success: true });
    expect(resource.listQueries.length).toBe(2);
    expect(facade.items()).toEqual([]);
  });

  it('clears local error state', async () => {
    const resource = new ExampleResource();
    resource.updateResponse = throwError(() => createApiError('SERVER'));
    const facade = new ExampleFacade(resource);

    await facade.update('1', { name: 'Broken' });
    facade.clearError();

    expect(facade.error()).toBeNull();
    expect(facade.hasError()).toBeFalse();
  });

  it('normalizes unexpected mutation errors safely', async () => {
    const resource = new ExampleResource();
    resource.createResponse = throwError(() => new Error('Unexpected'));
    const facade = new ExampleFacade(resource);

    const result = await facade.create({ name: 'Broken' });

    expect(result.success).toBeFalse();

    if (!result.success) {
      expect(result.error.code).toBe('UNKNOWN');
      expect(result.error.message).toBe('خطای غیرمنتظره رخ داد.');
    }
  });
});

function createPage(
  items: readonly ExampleEntity[],
  page = 1
): ApiPage<ExampleEntity> {
  return {
    items,
    page,
    pageSize: 10,
    totalItems: items.length,
    totalPages: items.length > 0 ? 1 : 0
  };
}

function createApiError(code: ApiError['code']): ApiError {
  return new ApiError({
    status: 400,
    code,
    message: 'خطای تست',
    fieldErrors: []
  });
}
