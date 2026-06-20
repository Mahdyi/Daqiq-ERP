import type { AuthorizationPolicy } from '../../auth/authorization/authorization.model';

export interface NavigationItem {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly route?: readonly string[];
  readonly externalUrl?: string;
  readonly children?: readonly NavigationItem[];
  readonly authorization?: AuthorizationPolicy;
  readonly exact?: boolean;
}
