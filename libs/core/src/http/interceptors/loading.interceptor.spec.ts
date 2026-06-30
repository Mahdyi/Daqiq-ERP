import {
  HttpContext,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { lastValueFrom, of } from 'rxjs';

import { HttpActivityHandle, HttpActivityPort } from '../ports/http-activity.port';
import { HTTP_ACTIVITY_PORT } from '../ports/http-activity.token';
import { SKIP_HTTP_LOADING } from '../tokens/http-context.tokens';
import { loadingInterceptor } from './loading.interceptor';

describe('loadingInterceptor', () => {
  it('opens and closes an activity handle around a request', async () => {
    let activeCount = 0;
    const port: HttpActivityPort = {
      begin: (): HttpActivityHandle => {
        activeCount += 1;

        return {
          close: () => {
            activeCount -= 1;
          }
        };
      }
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: HTTP_ACTIVITY_PORT,
          useValue: port
        }
      ]
    });

    const request = new HttpRequest('GET', '/api/customers');

    await lastValueFrom(
      TestBed.runInInjectionContext(() =>
        loadingInterceptor(request, () => of(new HttpResponse({ status: 200 })))
      )
    );

    expect(activeCount).toBe(0);
  });

  it('does not start activity when skipped by context', async () => {
    let beginCalls = 0;
    const port: HttpActivityPort = {
      begin: (): HttpActivityHandle => {
        beginCalls += 1;

        return {
          close: () => undefined
        };
      }
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: HTTP_ACTIVITY_PORT,
          useValue: port
        }
      ]
    });

    const request = new HttpRequest(
      'GET',
      '/api/customers',
      {
        context: new HttpContext().set(SKIP_HTTP_LOADING, true)
      }
    );

    await lastValueFrom(
      TestBed.runInInjectionContext(() =>
        loadingInterceptor(request, () => of(new HttpResponse({ status: 200 })))
      )
    );

    expect(beginCalls).toBe(0);
  });
});
