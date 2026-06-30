import { HttpContextToken } from '@angular/common/http';

export const SKIP_HTTP_LOADING = new HttpContextToken<boolean>(() => false);

export const SKIP_CORRELATION_ID = new HttpContextToken<boolean>(() => false);
