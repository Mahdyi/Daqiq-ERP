import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../configuration/api-config.token';
import { ApiClient } from './api-client.service';

describe('ApiClient response observation', () => {
  it('preserves typed body and response headers', () => {
    TestBed.configureTestingModule({
      providers: [
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
    const client = TestBed.inject(ApiClient);
    const http = TestBed.inject(HttpTestingController);
    const received: {
      contentRange: string | null;
      body: readonly { readonly id: string }[] | null;
    } = {
      contentRange: null,
      body: null
    };

    client.getResponse<readonly { readonly id: string }[]>('customers', {
      responseShape: 'raw'
    }).subscribe((response) => {
      received.contentRange = response.headers.get('Content-Range');
      received.body = response.body;
    });

    const request = http.expectOne('/api/customers');
    request.flush([{ id: 'customer-1' }], {
      headers: {
        'Content-Range': '0-0/1'
      }
    });

    expect(received.contentRange).toBe('0-0/1');
    expect(received.body).toEqual([{ id: 'customer-1' }]);
    http.verify();
  });
});
