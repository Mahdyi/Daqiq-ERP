import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { ApiClient } from '../api-client/api-client.service';
import { ApiPage } from '../models/api-page.model';
import { ApiRequestOptions } from '../models/api-request-options.model';
import { BaseRepository } from './base-repository';

interface TestEntity {
  readonly id: number;
  readonly name: string;
}

interface TestCreateRequest {
  readonly name: string;
}

interface TestUpdateRequest {
  readonly name: string;
}

class TestRepository extends BaseRepository<
  TestEntity,
  number,
  TestCreateRequest,
  TestUpdateRequest
> {
  protected override readonly resourcePath = 'customers';
}

describe('BaseRepository', () => {
  it('builds list query parameters for ERP collection endpoints', () => {
    let capturedEndpoint = '';
    let capturedOptions: ApiRequestOptions | undefined;
    const emptyPage: ApiPage<TestEntity> = {
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0
    };

    const fakeApiClient = {
      get: <TResponse>(
        endpoint: string,
        options?: ApiRequestOptions
      ): Observable<TResponse> => {
        capturedEndpoint = endpoint;
        capturedOptions = options;

        return of(emptyPage as TResponse);
      },
      post: <TRequest, TResponse>(): Observable<TResponse> => of({} as TResponse),
      put: <TRequest, TResponse>(): Observable<TResponse> => of({} as TResponse),
      patch: <TRequest, TResponse>(): Observable<TResponse> => of({} as TResponse),
      delete: <TResponse>(): Observable<TResponse> => of(undefined as TResponse)
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ApiClient,
          useValue: fakeApiClient
        }
      ]
    });

    const repository = TestBed.runInInjectionContext(() => new TestRepository());

    repository
      .list({
        page: 2,
        pageSize: 50,
        sort: ['name:asc'],
        filters: {
          status: 'active'
        }
      })
      .subscribe();

    expect(capturedEndpoint).toBe('customers');
    expect(capturedOptions?.params).toEqual({
      page: 2,
      pageSize: 50,
      sort: ['name:asc'],
      'filter.status': 'active'
    });
  });

  it('builds encoded item endpoints', () => {
    let capturedEndpoint = '';
    const fakeApiClient = {
      get: <TResponse>(endpoint: string): Observable<TResponse> => {
        capturedEndpoint = endpoint;

        return of({ id: 1, name: 'A' } as TResponse);
      },
      post: <TRequest, TResponse>(): Observable<TResponse> => of({} as TResponse),
      put: <TRequest, TResponse>(): Observable<TResponse> => of({} as TResponse),
      patch: <TRequest, TResponse>(): Observable<TResponse> => of({} as TResponse),
      delete: <TResponse>(): Observable<TResponse> => of(undefined as TResponse)
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ApiClient,
          useValue: fakeApiClient
        }
      ]
    });

    const repository = TestBed.runInInjectionContext(() => new TestRepository());

    repository.getById(42).subscribe();

    expect(capturedEndpoint).toBe('customers/42');
  });
});
