import type { AuthorizationPolicy } from './authorization.model';

export interface AuthorizationRouteData {
  readonly authorization?: AuthorizationPolicy;
  readonly breadcrumb?: string;
}
