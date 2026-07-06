import {
  buildOrderParam,
  buildPostgrestCustomerListRequest,
  escapePostgrestIlikeTerm
} from './postgrest-customer-query.util';

describe('PostgREST customer query utilities', () => {
  it('converts pagination to range headers', () => {
    const request = buildPostgrestCustomerListRequest({
      page: 2,
      pageSize: 25
    });

    expect(request.range).toBe('50-74');
  });

  it('escapes user search text before building OR filters', () => {
    expect(escapePostgrestIlikeTerm('شرکت*,()')).toBe('شرکت\\*\\,\\(\\)');
  });

  it('uses a whitelist for sortable fields', () => {
    expect(buildOrderParam({ page: 0, pageSize: 20, sortField: 'name', sortDirection: 'asc' }))
      .toBe('name.asc,id.asc');
  });
});
