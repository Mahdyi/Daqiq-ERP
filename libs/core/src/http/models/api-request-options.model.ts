import {
  HttpContext,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';

export type ApiRequestParamValue =
  | string
  | number
  | boolean
  | readonly string[]
  | readonly number[]
  | readonly boolean[];

export type ApiResponseShape = 'envelope' | 'raw';

export interface ApiRequestOptions {
  readonly params?: HttpParams | Readonly<Record<string, ApiRequestParamValue | undefined>>;
  readonly headers?: HttpHeaders | Readonly<Record<string, string>>;
  readonly context?: HttpContext;
  readonly responseShape?: ApiResponseShape;
}

export interface NormalizedApiRequestOptions {
  readonly params: HttpParams;
  readonly headers: HttpHeaders;
  readonly context: HttpContext;
  readonly responseShape: ApiResponseShape;
}
