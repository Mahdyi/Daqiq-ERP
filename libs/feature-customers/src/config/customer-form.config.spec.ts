import { CUSTOMER_FORM_FIELDS } from './customer-form.config';

describe('CUSTOMER_FORM_FIELDS', () => {
  it('keeps required identity fields in the generic form configuration', () => {
    const code = CUSTOMER_FORM_FIELDS.find((field) => field.key === 'code');
    const name = CUSTOMER_FORM_FIELDS.find((field) => field.key === 'name');

    expect(code?.required).toBeTrue();
    expect(name?.required).toBeTrue();
  });

  it('shows credit limit only for corporate customers', () => {
    const creditLimit = CUSTOMER_FORM_FIELDS.find((field) => field.key === 'creditLimit');

    expect(creditLimit?.visible?.({
      code: '',
      name: '',
      email: null,
      phone: null,
      customerType: 'corporate',
      creditLimit: null,
      active: true
    })).toBeTrue();

    expect(creditLimit?.visible?.({
      code: '',
      name: '',
      email: null,
      phone: null,
      customerType: 'individual',
      creditLimit: null,
      active: true
    })).toBeFalse();
  });
});
