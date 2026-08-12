import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiPage } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type {
  AmountStatusReportRowDto,
  AuditActivitySummaryReportRowDto,
  GeneralLedgerSummaryReportRowDto,
  GoodsReceiptStatusReportRowDto,
  InventoryMovementSummaryReportRowDto,
  InventoryOnHandReportRowDto,
  JournalActivityReportRowDto,
  PaymentSummaryReportRowDto,
  SalesDeliveryStatusReportRowDto,
  SalesInvoiceSettlementReportRowDto,
  SupplierInvoiceSettlementReportRowDto
} from '../dto/report-row.dto';
import {
  mapAuditActivitySummaryReportRow,
  mapGeneralLedgerSummaryReportRow,
  mapGoodsReceiptStatusReportRow,
  mapInventoryMovementSummaryReportRow,
  mapInventoryOnHandReportRow,
  mapJournalActivityReportRow,
  mapPaymentSummaryReportRow,
  mapPurchaseOrderStatusReportRow,
  mapSalesDeliveryStatusReportRow,
  mapSalesInvoiceSettlementReportRow,
  mapSalesOrderStatusReportRow,
  mapSupplierInvoiceSettlementReportRow
} from '../mappers/report.mapper';
import type { ReportQuery } from '../models/report-query.model';
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
import { parsePostgrestContentRange } from './postgrest-content-range.util';
import { PostgrestReportListRequest, buildReportListRequest } from './postgrest-report-query.util';

const INVENTORY_ON_HAND_SELECT =
  'product_id,product_sku,product_name,product_type,warehouse_id,warehouse_code,warehouse_name,storage_location_id,storage_location_code,storage_location_name,unit_code,unit_label,quantity_on_hand,last_movement_at';
const INVENTORY_MOVEMENT_SUMMARY_SELECT =
  'product_id,product_sku,product_name,warehouse_id,warehouse_code,warehouse_name,movement_type_code,movement_type_label,movement_count,total_quantity_in,total_quantity_out,first_movement_at,last_movement_at';
const AMOUNT_STATUS_SELECT = 'status_code,status_label,order_count,subtotal_amount,tax_amount,total_amount';
const GOODS_RECEIPT_STATUS_SELECT =
  'status_code,status_label,receipt_count,line_count,total_received_quantity';
const SALES_DELIVERY_STATUS_SELECT =
  'status_code,status_label,delivery_count,line_count,total_shipped_quantity';
const SALES_SETTLEMENT_SELECT =
  'customer_id,customer_code,customer_name,invoice_count,total_invoiced_amount,total_paid_amount,total_remaining_amount,overdue_amount';
const SUPPLIER_SETTLEMENT_SELECT =
  'supplier_id,supplier_code,supplier_name,invoice_count,total_invoiced_amount,total_paid_amount,total_remaining_amount,overdue_amount';
const GENERAL_LEDGER_SUMMARY_SELECT =
  'account_id,account_code,account_name,account_type_code,debit_amount,credit_amount,net_amount,journal_line_count';
const JOURNAL_ACTIVITY_SELECT =
  'source_type_code,source_type_label,journal_count,total_debit,total_credit,first_journal_date,last_journal_date';
const PAYMENT_SUMMARY_SELECT =
  'payment_direction,payment_count,total_amount,first_payment_date,last_payment_date';
const AUDIT_ACTIVITY_SELECT =
  'action,entity_type,actor_email,event_count,first_event_at,last_event_at';

@Injectable()
export class ReportRepository {
  private readonly api = inject(ApiClient);

  listInventoryOnHand(query?: ReportQuery): Observable<ApiPage<InventoryOnHandReport>> {
    return this.list(
      'report_inventory_on_hand_view',
      buildReportListRequest(INVENTORY_ON_HAND_SELECT, 'product_name.asc,warehouse_name.asc', query, [
        'product_sku',
        'product_name',
        'warehouse_code',
        'warehouse_name',
        'storage_location_code',
        'storage_location_name'
      ]),
      mapInventoryOnHandReportRow
    );
  }

  listInventoryMovementSummary(
    query?: ReportQuery
  ): Observable<ApiPage<InventoryMovementSummaryReport>> {
    return this.list(
      'report_inventory_movement_summary_view',
      buildReportListRequest(
        INVENTORY_MOVEMENT_SUMMARY_SELECT,
        'last_movement_at.desc,product_name.asc',
        query,
        ['product_sku', 'product_name', 'warehouse_code', 'warehouse_name', 'movement_type_label']
      ),
      mapInventoryMovementSummaryReportRow
    );
  }

  listPurchaseOrderStatus(query?: ReportQuery): Observable<ApiPage<AmountStatusReport>> {
    return this.list(
      'report_purchase_order_status_view',
      buildReportListRequest(AMOUNT_STATUS_SELECT, 'status_code.asc', query, ['status_label']),
      mapPurchaseOrderStatusReportRow
    );
  }

  listGoodsReceiptStatus(query?: ReportQuery): Observable<ApiPage<QuantityStatusReport>> {
    return this.list(
      'report_goods_receipt_status_view',
      buildReportListRequest(GOODS_RECEIPT_STATUS_SELECT, 'status_code.asc', query, ['status_label']),
      mapGoodsReceiptStatusReportRow
    );
  }

  listSupplierInvoiceSettlement(
    query?: ReportQuery
  ): Observable<ApiPage<SupplierInvoiceSettlementReport>> {
    return this.list(
      'report_supplier_invoice_settlement_view',
      buildReportListRequest(
        SUPPLIER_SETTLEMENT_SELECT,
        'total_remaining_amount.desc,supplier_name.asc',
        query,
        ['supplier_code', 'supplier_name']
      ),
      mapSupplierInvoiceSettlementReportRow
    );
  }

  listSalesOrderStatus(query?: ReportQuery): Observable<ApiPage<AmountStatusReport>> {
    return this.list(
      'report_sales_order_status_view',
      buildReportListRequest(AMOUNT_STATUS_SELECT, 'status_code.asc', query, ['status_label']),
      mapSalesOrderStatusReportRow
    );
  }

  listSalesDeliveryStatus(query?: ReportQuery): Observable<ApiPage<QuantityStatusReport>> {
    return this.list(
      'report_sales_delivery_status_view',
      buildReportListRequest(SALES_DELIVERY_STATUS_SELECT, 'status_code.asc', query, ['status_label']),
      mapSalesDeliveryStatusReportRow
    );
  }

  listSalesInvoiceSettlement(
    query?: ReportQuery
  ): Observable<ApiPage<SalesInvoiceSettlementReport>> {
    return this.list(
      'report_sales_invoice_settlement_view',
      buildReportListRequest(
        SALES_SETTLEMENT_SELECT,
        'total_remaining_amount.desc,customer_name.asc',
        query,
        ['customer_code', 'customer_name']
      ),
      mapSalesInvoiceSettlementReportRow
    );
  }

  listGeneralLedgerSummary(
    query?: ReportQuery
  ): Observable<ApiPage<GeneralLedgerSummaryReport>> {
    return this.list(
      'report_general_ledger_summary_view',
      buildReportListRequest(
        GENERAL_LEDGER_SUMMARY_SELECT,
        'account_code.asc',
        query,
        ['account_code', 'account_name', 'account_type_code']
      ),
      mapGeneralLedgerSummaryReportRow
    );
  }

  listJournalActivity(query?: ReportQuery): Observable<ApiPage<JournalActivityReport>> {
    return this.list(
      'report_journal_activity_view',
      buildReportListRequest(JOURNAL_ACTIVITY_SELECT, 'last_journal_date.desc', query, [
        'source_type_code',
        'source_type_label'
      ]),
      mapJournalActivityReportRow
    );
  }

  listPaymentSummary(query?: ReportQuery): Observable<ApiPage<PaymentSummaryReport>> {
    return this.list(
      'report_payment_summary_view',
      buildReportListRequest(PAYMENT_SUMMARY_SELECT, 'payment_direction.asc', query, [
        'payment_direction'
      ]),
      mapPaymentSummaryReportRow
    );
  }

  listAuditActivity(query?: ReportQuery): Observable<ApiPage<AuditActivitySummaryReport>> {
    return this.list(
      'report_audit_activity_summary_view',
      buildReportListRequest(AUDIT_ACTIVITY_SELECT, 'last_event_at.desc,action.asc', query, [
        'action',
        'entity_type',
        'actor_email'
      ]),
      mapAuditActivitySummaryReportRow
    );
  }

  private list<TDto, TModel>(
    endpoint: string,
    request: PostgrestReportListRequest,
    mapper: (dto: TDto) => TModel
  ): Observable<ApiPage<TModel>> {
    return this.api
      .getResponse<readonly TDto[]>(endpoint, {
        params: request.params,
        headers: {
          Prefer: 'count=exact',
          'Range-Unit': 'items',
          Range: request.range
        },
        responseShape: 'raw'
      })
      .pipe(
        map((response) => {
          const contentRange = parsePostgrestContentRange(response.headers.get('Content-Range'));
          const totalItems = contentRange.total;

          return {
            items: (response.body ?? []).map(mapper),
            page: request.page,
            pageSize: request.pageSize,
            totalItems,
            totalPages: Math.ceil(totalItems / request.pageSize)
          };
        })
      );
  }
}
