import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiError, RuntimeConfigService } from '@daqiq/core';
import { NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { CustomerReceiptCommandService } from '../data-access/customer-receipt-command.service';
import { CashBankAccountRepository } from '../data-access/cash-bank-account-repository.service';
import { SettlementRepository } from '../data-access/settlement-repository.service';
import {
  PaymentEditorOptions,
  createCustomerReceiptFormFields
} from '../config/payment-form.config';
import { mapCustomerReceiptFormToRequest } from '../mappers/payment-form.mapper';
import type { CustomerReceipt } from '../models/customer-receipt.model';
import type { CustomerReceiptFormValue } from '../models/payment-form-value.model';
import { toApiError } from './payment-error.util';

@Injectable()
export class CustomerReceiptEditorFacade {
  private readonly commands = inject(CustomerReceiptCommandService);
  private readonly accounts = inject(CashBankAccountRepository);
  private readonly settlements = inject(SettlementRepository);
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private readonly notifications = inject(NotificationService);
  private readonly optionsSignal = signal<PaymentEditorOptions>({
    cashBankAccounts: [],
    currencies: [],
    paymentMethods: [],
    salesInvoices: [],
    supplierInvoices: []
  });
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<ApiError | null>(null);

  readonly options = this.optionsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly fields = computed(() => createCustomerReceiptFormFields(this.options()));

  async loadReferenceData(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const [accounts, currencies, methods, salesInvoices] = await Promise.all([
        firstValueFrom(this.accounts.list({ page: 0, pageSize: 200 })),
        firstValueFrom(this.runtimeConfig.getLookupValues('currency')),
        firstValueFrom(this.runtimeConfig.getLookupValues('payment_method')),
        firstValueFrom(this.settlements.listSales({ page: 0, pageSize: 200, settlementStatus: 'unpaid' }))
      ]);

      this.optionsSignal.set({
        cashBankAccounts: accounts.items.map((account) => ({
          label: `${account.accountCode} - ${account.accountName}`,
          value: account.id
        })),
        currencies: currencies.map((currency) => ({ label: currency.label, value: currency.id })),
        paymentMethods: methods.map((method) => ({ label: method.label, value: method.id })),
        salesInvoices: salesInvoices.items.map((invoice) => ({
          label: `${invoice.invoiceNumber} - ${invoice.customerName} - ${invoice.remainingAmount}`,
          value: invoice.salesInvoiceId
        })),
        supplierInvoices: []
      });
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async submit(value: CustomerReceiptFormValue): Promise<CustomerReceipt | null> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const receipt = await firstValueFrom(this.commands.post(mapCustomerReceiptFormToRequest(value)));
      this.notifications.success('دریافت مشتری با موفقیت ثبت شد.');
      return receipt;
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
      return null;
    } finally {
      this.loadingSignal.set(false);
    }
  }
}
