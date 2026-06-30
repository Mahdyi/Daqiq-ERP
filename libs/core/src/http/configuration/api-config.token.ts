import { InjectionToken } from '@angular/core';

import { ApiConfig } from './api-config.model';

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG');
