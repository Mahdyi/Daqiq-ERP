import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiClient, ApiError, API_CONFIG } from '@daqiq/core';

import { CustomerPostgrestRow } from '../dto/customer-postgrest-row.dto';
import { CustomerRepository } from './customer-repository.service';

describe('CustomerRepository', () => {
  const row: CustomerPostgrestRow = {
    id: '10000000-0000-4000-8000-000000000001',
    code: 'CUST-1001',
    name: 'شرکت نمونه',
    email: 'info@example.test',
    phone: null,
    customer_type: 'corporate',
    credit_limit: '1500000.00',
    active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z'
  };

  function setup(): {
    readonly repository: CustomerRepository;
    readonly http: HttpTestingController;
  } {
    TestBed.configureTestingModule({
      providers: [
        CustomerRepository,
        ApiClient,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: API_CONFIG,
          useValue: {
            baseUrl: '/api'
          }
        }
      ]
    });

    return {
      repository: TestBed.inject(CustomerRepository),
      http: TestBed.inject(HttpTestingController)
    };
  }

  it('lists customers using PostgREST range and count headers', () => {
    const { repository, http } = setup();
    let totalItems = 0;
    let firstCustomerName = '';

    repository.list({ page: 1, pageSize: 10 }).subscribe((page) => {
      totalItems = page.totalItems;
      firstCustomerName = page.items[0]?.name ?? '';
    });

    const request = http.expectOne((candidate) =>
      candidate.url === '/api/customers' &&
      candidate.headers.get('Range') === '10-19' &&
      candidate.headers.get('Prefer') === 'count=exact'
    );

    request.flush([row], {
      headers: {
        'Content-Range': '10-10/21'
      }
    });

    expect(totalItems).toBe(21);
    expect(firstCustomerName).toBe('شرکت نمونه');
    http.verify();
  });

  it('creates customers with return representation preference', () => {
    const { repository, http } = setup();
    let createdCode = '';

    repository
      .create({
        code: 'CUST-1001',
        name: 'شرکت نمونه',
        email: 'info@example.test',
        phone: null,
        customer_type: 'corporate',
        credit_limit: 1500000,
        active: true
      })
      .subscribe((customer) => {
        createdCode = customer.code;
      });

    const request = http.expectOne('/api/customers?select=id,code,name,email,phone,customer_type,credit_limit,active,created_at,updated_at');

    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Prefer')).toBe('return=representation');
    request.flush([row]);

    expect(createdCode).toBe('CUST-1001');
    http.verify();
  });

  it('maps missing single-row responses to a typed not-found error', () => {
    const { repository, http } = setup();
    const captured: {
      error: ApiError | null;
    } = {
      error: null
    };

    repository.getById(row.id).subscribe({
      error: (error: unknown) => {
        captured.error = error instanceof ApiError ? error : null;
      }
    });

    const request = http.expectOne((candidate) =>
      candidate.url === '/api/customers' &&
      candidate.params.get('id') === `eq.${row.id}`
    );

    request.flush([]);

    expect(captured.error?.code).toBe('NOT_FOUND');
    http.verify();
  });
});
