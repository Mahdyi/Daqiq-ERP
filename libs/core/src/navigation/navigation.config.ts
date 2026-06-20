import { NavigationItem } from './models/navigation-item.model';

export const APP_NAVIGATION = [
  {
    id: 'dashboard',
    label: 'داشبورد',
    icon: 'pi pi-home',
    route: ['/dashboard'],
    exact: true,
    authorization: {
      permissions: ['dashboard.view']
    }
  }
] as const satisfies readonly NavigationItem[];
