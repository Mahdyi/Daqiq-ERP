import { WAREHOUSE_ROUTES } from './warehouse.routes';

describe('WAREHOUSE_ROUTES', () => {
  it('protects warehouse routes with permissions', () => {
    const warehouseRoutes = WAREHOUSE_ROUTES.find((route) => route.path === 'warehouses');
    const children = warehouseRoutes?.children ?? [];

    expect(children[0]?.data?.['authorization']).toEqual({
      permissions: ['warehouses.view']
    });
    expect(children[1]?.data?.['authorization']).toEqual({
      permissions: ['warehouses.create']
    });
    expect(children[2]?.data?.['authorization']).toEqual({
      permissions: ['warehouses.update']
    });
  });

  it('protects storage location routes with permissions', () => {
    const storageRoutes = WAREHOUSE_ROUTES.find((route) => route.path === 'storage-locations');
    const children = storageRoutes?.children ?? [];

    expect(children[0]?.data?.['authorization']).toEqual({
      permissions: ['storageLocations.view']
    });
    expect(children[1]?.data?.['authorization']).toEqual({
      permissions: ['storageLocations.create']
    });
    expect(children[2]?.data?.['authorization']).toEqual({
      permissions: ['storageLocations.update']
    });
  });
});
