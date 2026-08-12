import type { DataTableColumn } from '@daqiq/ui';

import type {
  AmountStatusReport,
  AuditActivitySummaryReport,
  GeneralLedgerSummaryReport,
  InventoryMovementSummaryReport,
  InventoryOnHandReport,
  JournalActivityReport,
  PaymentSummaryReport,
  QuantityStatusReport,
  SalesInvoiceSettlementReport,
  SupplierInvoiceSettlementReport
} from '../models/report-row.model';

export function createInventoryOnHandColumns(): readonly DataTableColumn<InventoryOnHandReport>[] {
  return [
    { id: 'productSku', field: 'productSku', header: 'کد کالا' },
    { id: 'productName', field: 'productName', header: 'کالا' },
    { id: 'warehouseName', field: 'warehouseName', header: 'انبار' },
    {
      id: 'storageLocationName',
      field: 'storageLocationName',
      header: 'موقعیت',
      formatter: (_value, row) => formatNullable(row.storageLocationName)
    },
    {
      id: 'quantityOnHand',
      field: 'quantityOnHand',
      header: 'موجودی',
      align: 'end',
      formatter: (_value, row) => formatQuantity(row.quantityOnHand)
    },
    {
      id: 'unitLabel',
      field: 'unitLabel',
      header: 'واحد',
      formatter: (_value, row) => row.unitLabel ?? row.unitCode ?? '-'
    },
    {
      id: 'lastMovementAt',
      field: 'lastMovementAt',
      header: 'آخرین گردش',
      formatter: (_value, row) => formatDateTime(row.lastMovementAt)
    }
  ];
}

export function createInventoryMovementSummaryColumns(): readonly DataTableColumn<InventoryMovementSummaryReport>[] {
  return [
    { id: 'productSku', field: 'productSku', header: 'کد کالا' },
    { id: 'productName', field: 'productName', header: 'کالا' },
    {
      id: 'warehouseName',
      field: 'warehouseName',
      header: 'انبار',
      formatter: (_value, row) => formatNullable(row.warehouseName)
    },
    { id: 'movementTypeLabel', field: 'movementTypeLabel', header: 'نوع گردش' },
    {
      id: 'movementCount',
      field: 'movementCount',
      header: 'تعداد',
      align: 'end',
      formatter: (_value, row) => formatInteger(row.movementCount)
    },
    {
      id: 'totalQuantityIn',
      field: 'totalQuantityIn',
      header: 'ورودی',
      align: 'end',
      formatter: (_value, row) => formatQuantity(row.totalQuantityIn)
    },
    {
      id: 'totalQuantityOut',
      field: 'totalQuantityOut',
      header: 'خروجی',
      align: 'end',
      formatter: (_value, row) => formatQuantity(row.totalQuantityOut)
    },
    {
      id: 'lastMovementAt',
      field: 'lastMovementAt',
      header: 'آخرین گردش',
      formatter: (_value, row) => formatDateTime(row.lastMovementAt)
    }
  ];
}

export function createAmountStatusColumns(itemHeader: string): readonly DataTableColumn<AmountStatusReport>[] {
  return [
    { id: 'statusLabel', field: 'statusLabel', header: 'وضعیت' },
    {
      id: 'itemCount',
      field: 'itemCount',
      header: itemHeader,
      align: 'end',
      formatter: (_value, row) => formatInteger(row.itemCount)
    },
    {
      id: 'subtotalAmount',
      field: 'subtotalAmount',
      header: 'مبلغ خالص',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.subtotalAmount)
    },
    {
      id: 'taxAmount',
      field: 'taxAmount',
      header: 'مالیات',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.taxAmount)
    },
    {
      id: 'totalAmount',
      field: 'totalAmount',
      header: 'جمع',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.totalAmount)
    }
  ];
}

export function createQuantityStatusColumns(documentHeader: string): readonly DataTableColumn<QuantityStatusReport>[] {
  return [
    { id: 'statusLabel', field: 'statusLabel', header: 'وضعیت' },
    {
      id: 'documentCount',
      field: 'documentCount',
      header: documentHeader,
      align: 'end',
      formatter: (_value, row) => formatInteger(row.documentCount)
    },
    {
      id: 'lineCount',
      field: 'lineCount',
      header: 'تعداد خطوط',
      align: 'end',
      formatter: (_value, row) => formatInteger(row.lineCount)
    },
    {
      id: 'totalQuantity',
      field: 'totalQuantity',
      header: 'مقدار کل',
      align: 'end',
      formatter: (_value, row) => formatQuantity(row.totalQuantity)
    }
  ];
}

export function createSalesSettlementColumns(): readonly DataTableColumn<SalesInvoiceSettlementReport>[] {
  return [
    { id: 'customerCode', field: 'customerCode', header: 'کد مشتری' },
    { id: 'customerName', field: 'customerName', header: 'مشتری' },
    {
      id: 'invoiceCount',
      field: 'invoiceCount',
      header: 'تعداد فاکتور',
      align: 'end',
      formatter: (_value, row) => formatInteger(row.invoiceCount)
    },
    {
      id: 'totalInvoicedAmount',
      field: 'totalInvoicedAmount',
      header: 'صورتحساب',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.totalInvoicedAmount)
    },
    {
      id: 'totalPaidAmount',
      field: 'totalPaidAmount',
      header: 'دریافت‌شده',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.totalPaidAmount)
    },
    {
      id: 'totalRemainingAmount',
      field: 'totalRemainingAmount',
      header: 'مانده',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.totalRemainingAmount)
    }
  ];
}

export function createSupplierSettlementColumns(): readonly DataTableColumn<SupplierInvoiceSettlementReport>[] {
  return [
    { id: 'supplierCode', field: 'supplierCode', header: 'کد تامین‌کننده' },
    { id: 'supplierName', field: 'supplierName', header: 'تامین‌کننده' },
    {
      id: 'invoiceCount',
      field: 'invoiceCount',
      header: 'تعداد فاکتور',
      align: 'end',
      formatter: (_value, row) => formatInteger(row.invoiceCount)
    },
    {
      id: 'totalInvoicedAmount',
      field: 'totalInvoicedAmount',
      header: 'صورتحساب',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.totalInvoicedAmount)
    },
    {
      id: 'totalPaidAmount',
      field: 'totalPaidAmount',
      header: 'پرداخت‌شده',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.totalPaidAmount)
    },
    {
      id: 'totalRemainingAmount',
      field: 'totalRemainingAmount',
      header: 'مانده',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.totalRemainingAmount)
    }
  ];
}

export function createGeneralLedgerSummaryColumns(): readonly DataTableColumn<GeneralLedgerSummaryReport>[] {
  return [
    { id: 'accountCode', field: 'accountCode', header: 'کد حساب' },
    { id: 'accountName', field: 'accountName', header: 'نام حساب' },
    { id: 'accountTypeCode', field: 'accountTypeCode', header: 'نوع حساب' },
    {
      id: 'debitAmount',
      field: 'debitAmount',
      header: 'بدهکار',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.debitAmount)
    },
    {
      id: 'creditAmount',
      field: 'creditAmount',
      header: 'بستانکار',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.creditAmount)
    },
    {
      id: 'netAmount',
      field: 'netAmount',
      header: 'مانده',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.netAmount)
    }
  ];
}

export function createJournalActivityColumns(): readonly DataTableColumn<JournalActivityReport>[] {
  return [
    { id: 'sourceTypeLabel', field: 'sourceTypeLabel', header: 'منبع سند' },
    {
      id: 'journalCount',
      field: 'journalCount',
      header: 'تعداد سند',
      align: 'end',
      formatter: (_value, row) => formatInteger(row.journalCount)
    },
    {
      id: 'totalDebit',
      field: 'totalDebit',
      header: 'بدهکار',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.totalDebit)
    },
    {
      id: 'totalCredit',
      field: 'totalCredit',
      header: 'بستانکار',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.totalCredit)
    },
    {
      id: 'lastJournalDate',
      field: 'lastJournalDate',
      header: 'آخرین سند',
      formatter: (_value, row) => formatDate(row.lastJournalDate)
    }
  ];
}

export function createPaymentSummaryColumns(): readonly DataTableColumn<PaymentSummaryReport>[] {
  return [
    {
      id: 'paymentDirection',
      field: 'paymentDirection',
      header: 'نوع پرداخت',
      formatter: (_value, row) =>
        row.paymentDirection === 'customer_receipt' ? 'دریافت مشتری' : 'پرداخت تامین‌کننده'
    },
    {
      id: 'paymentCount',
      field: 'paymentCount',
      header: 'تعداد',
      align: 'end',
      formatter: (_value, row) => formatInteger(row.paymentCount)
    },
    {
      id: 'totalAmount',
      field: 'totalAmount',
      header: 'جمع مبلغ',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.totalAmount)
    },
    {
      id: 'lastPaymentDate',
      field: 'lastPaymentDate',
      header: 'آخرین تاریخ',
      formatter: (_value, row) => formatDate(row.lastPaymentDate)
    }
  ];
}

export function createAuditActivityColumns(): readonly DataTableColumn<AuditActivitySummaryReport>[] {
  return [
    { id: 'action', field: 'action', header: 'عملیات' },
    { id: 'entityType', field: 'entityType', header: 'موجودیت' },
    {
      id: 'actorEmail',
      field: 'actorEmail',
      header: 'کاربر',
      formatter: (_value, row) => formatNullable(row.actorEmail)
    },
    {
      id: 'eventCount',
      field: 'eventCount',
      header: 'تعداد رخداد',
      align: 'end',
      formatter: (_value, row) => formatInteger(row.eventCount)
    },
    {
      id: 'lastEventAt',
      field: 'lastEventAt',
      header: 'آخرین رخداد',
      formatter: (_value, row) => formatDateTime(row.lastEventAt)
    }
  ];
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits: 2
  }).format(value);
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits: 4
  }).format(value);
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value: Date | null): string {
  return value?.toLocaleDateString('fa-IR') ?? '-';
}

function formatDateTime(value: Date | null): string {
  return value?.toLocaleString('fa-IR') ?? '-';
}

function formatNullable(value: string | null): string {
  return value ?? '-';
}
