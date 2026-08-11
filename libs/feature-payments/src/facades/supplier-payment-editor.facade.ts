import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiError, RuntimeConfigService } from '@daqiq/core';
import { NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { CashBankAccountRepository } from '../data-access/cash-bank-account-repository.service';
import { SettlementRepository } from '../data-access/settlement-repository.service';
import { SupplierPaymentCommandService } from '../data-access/supplier-payment-command.service';
import {
  PaymentEditorOptions,
  createSupplierPaymentFormFields
} from '../config/payment-form.config';
import { mapSupplierPaymentFormToRequest } from '../mappers/payment-form.mapper';
import type { SupplierPaymentFormValue } from '../models/payment-form-value.model';
import type { SupplierPayment } from '../models/supplier-payment.model';
import { toApiError } from './payment-error.util';

@Injectable()
export class SupplierPaymentEditorFacade {
  private readonly commands = inject(SupplierPaymentCommandService);
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
  readonly fields = computed(() => createSupplierPaymentFormFields(this.options()));

  async loadReferenceData(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const [accounts, currencies, methods, supplierInvoices] = await Promise.all([
        firstValueFrom(this.accounts.list({ page: 0, pageSize: 200 })),
        firstValueFrom(this.runtimeConfig.getLookupValues('currency')),
        firstValueFrom(this.runtimeConfig.getLookupValues('payment_method')),
        firstValueFrom(
          this.settlements.listSuppliers({ page: 0, pageSize: 200, settlementStatus: 'unpaid' })
        )
      ]);

      this.optionsSignal.set({
        cashBankAccounts: accounts.items.map((account) => ({
          label: `${account.accountCode} - ${account.accountName}`,
          value: account.id
        })),
        currencies: currencies.map((currency) => ({ label: currency.label, value: currency.id })),
        paymentMethods: methods.map((method) => ({ label: method.label, value: method.id })),
        salesInvoices: [],
        supplierInvoices: supplierInvoices.items.map((invoice) => ({
          label: `${invoice.invoiceNumber} - ${invoice.supplierName} - ${invoice.remainingAmount}`,
          value: invoice.supplierInvoiceId
        }))
      });
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async submit(value: SupplierPaymentFormValue): Promise<SupplierPayment | null> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const payment = await firstValueFrom(this.commands.post(mapSupplierPaymentFormToRequest(value)));
      this.notifications.success('پرداخت تأمین‌کننده با موفقیت ثبت شد.');
      return payment;
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
      return null;
    } finally {
      this.loadingSignal.set(false);
    }
  }
}
