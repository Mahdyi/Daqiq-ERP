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
      },
      {
        id: 'products',
        label: 'کالاها',
        icon: 'pi pi-box',
        route: ['/master-data/products'],
        exact: false,
        authorization: {
          permissions: ['products.view']
        }
      },
      {
        id: 'suppliers',
        label: 'تأمین‌کنندگان',
        icon: 'pi pi-truck',
        route: ['/master-data/suppliers'],
        exact: false,
        authorization: {
          permissions: ['suppliers.view']
        }
      },
      {
        id: 'warehouses',
        label: 'انبارها',
        icon: 'pi pi-building',
        route: ['/master-data/warehouses'],
        exact: false,
        authorization: {
          permissions: ['warehouses.view']
        }
      },
      {
        id: 'storage-locations',
        label: 'موقعیت‌های انبار',
        icon: 'pi pi-map-marker',
        route: ['/master-data/storage-locations'],
        exact: false,
        authorization: {
          permissions: ['storageLocations.view']
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
      },
      {
        id: 'settings',
        label: 'تنظیمات سامانه',
        icon: 'pi pi-sliders-h',
        route: ['/admin/settings'],
        exact: false,
        authorization: {
          permissions: ['settings.view']
        }
      },
      {
        id: 'lookups',
        label: 'داده‌های پایه',
        icon: 'pi pi-list',
        route: ['/admin/lookups'],
        exact: false,
        authorization: {
          permissions: ['lookups.view']
        }
      },
      {
        id: 'feature-flags',
        label: 'قابلیت‌های سامانه',
        icon: 'pi pi-toggle-on',
        route: ['/admin/feature-flags'],
        exact: false,
        authorization: {
          permissions: ['featureFlags.view']
        }
      }
    ]
  }
] as const satisfies readonly NavigationItem[];
