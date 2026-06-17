import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';

import { DashboardSummaryResponse } from '../dto/dashboard-summary-response.dto';

const DASHBOARD_MOCK_DELAY_MS = 500;

@Injectable({
  providedIn: 'root'
})
export class DashboardApiService {
  getSummary(): Observable<DashboardSummaryResponse> {
    const response: DashboardSummaryResponse = {
      kpis: [
        {
          key: 'today-sales',
          title: 'فروش امروز',
          value: 184500000,
          icon: 'pi pi-shopping-cart',
          trend: {
            direction: 'up',
            percentage: 12,
            label: 'نسبت به دیروز'
          }
        },
        {
          key: 'open-orders',
          title: 'سفارش‌های باز',
          value: 37,
          icon: 'pi pi-file',
          trend: {
            direction: 'neutral',
            percentage: 0,
            label: 'در انتظار رسیدگی'
          }
        },
        {
          key: 'unpaid-invoices',
          title: 'فاکتورهای پرداخت‌نشده',
          value: 14,
          icon: 'pi pi-wallet',
          trend: {
            direction: 'down',
            percentage: 8,
            label: 'کاهش نسبت به هفته قبل'
          }
        },
        {
          key: 'critical-inventory',
          title: 'موجودی‌های بحرانی',
          value: 9,
          icon: 'pi pi-box',
          trend: {
            direction: 'up',
            percentage: 5,
            label: 'نیازمند پیگیری'
          }
        }
      ],
      lastUpdatedAt: new Date().toISOString()
    };

    return of(response).pipe(delay(DASHBOARD_MOCK_DELAY_MS));
  }
}
