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
    id: 'inventory',
    label: 'انبارداری',
    icon: 'pi pi-warehouse',
    children: [
      {
        id: 'inventory-balances',
        label: 'موجودی انبار',
        icon: 'pi pi-box',
        route: ['/inventory/balances'],
        exact: false,
        authorization: {
          permissions: ['inventory.view']
        }
      },
      {
        id: 'inventory-movements',
        label: 'حرکات موجودی',
        icon: 'pi pi-history',
        route: ['/inventory/movements'],
        exact: false,
        authorization: {
          permissions: ['inventory.view']
        }
      },
      {
        id: 'inventory-adjustment',
        label: 'اصلاح موجودی',
        icon: 'pi pi-plus-circle',
        route: ['/inventory/adjustment'],
        exact: false,
        authorization: {
          permissions: ['inventory.adjust']
        }
      },
      {
        id: 'inventory-transfer',
        label: 'انتقال موجودی',
        icon: 'pi pi-arrow-right-arrow-left',
        route: ['/inventory/transfer'],
        exact: false,
        authorization: {
          permissions: ['inventory.transfer']
        }
      }
    ]
  },
  {
    id: 'purchasing',
    label: 'خرید',
    icon: 'pi pi-shopping-cart',
    children: [
      {
        id: 'purchase-orders',
        label: 'سفارش‌های خرید',
        icon: 'pi pi-file-edit',
        route: ['/purchasing/purchase-orders'],
        exact: false,
        authorization: {
          permissions: ['purchasing.view']
        }
      },
      {
        id: 'goods-receipts',
        label: 'رسیدهای خرید',
        icon: 'pi pi-inbox',
        route: ['/purchasing/goods-receipts'],
        exact: false,
        authorization: {
          permissions: ['receiving.view']
        }
      },
      {
        id: 'supplier-invoices',
        label: 'فاکتورهای تأمین‌کننده',
        icon: 'pi pi-receipt',
        route: ['/purchasing/supplier-invoices'],
        exact: false,
        authorization: {
          permissions: ['supplierInvoices.view']
        }
      }
    ]
  },
  {
    id: 'sales',
    label: 'فروش',
    icon: 'pi pi-shopping-bag',
    children: [
      {
        id: 'sales-orders',
        label: 'سفارش‌های فروش',
        icon: 'pi pi-file-edit',
        route: ['/sales/sales-orders'],
        exact: false,
        authorization: {
          permissions: ['salesOrders.view']
        }
      },
      {
        id: 'sales-deliveries',
        label: 'حواله‌های فروش',
        icon: 'pi pi-send',
        route: ['/sales/sales-deliveries'],
        exact: false,
        authorization: {
          permissions: ['salesDeliveries.view']
        }
      },
      {
        id: 'sales-invoices',
        label: 'فاکتورهای فروش',
        icon: 'pi pi-receipt',
        route: ['/sales/sales-invoices'],
        exact: false,
        authorization: {
          permissions: ['salesInvoices.view']
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
