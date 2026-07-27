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
  },
  {
    id: 'master-data',
    label: 'اطلاعات پایه',
    icon: 'pi pi-database',
    children: [
      {
        id: 'customers',
        label: 'مشتریان',
        icon: 'pi pi-users',
        route: ['/master-data/customers'],
        exact: false,
        authorization: {
          permissions: ['customers.view']
        }
      }
    ]
  },
  {
    id: 'system-management',
    label: 'مدیریت سیستم',
    icon: 'pi pi-cog',
    children: [
      {
        id: 'users',
        label: 'کاربران',
        icon: 'pi pi-users',
        route: ['/admin/users'],
        exact: false,
        authorization: {
          permissions: ['users.view']
        }
      },
      {
        id: 'audit-logs',
        label: 'گزارش فعالیت‌ها',
        icon: 'pi pi-history',
        route: ['/admin/audit-logs'],
        exact: false,
        authorization: {
          permissions: ['audit.view']
        }
      }
    ]
  }
] as const satisfies readonly NavigationItem[];
