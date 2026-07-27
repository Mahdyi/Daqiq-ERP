import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ButtonComponent,
  CardComponent,
  DataTableComponent,
  DataTablePageEvent,
  EmptyStateComponent,
  PageContainerComponent
} from '@daqiq/ui';

import { AUDIT_LOG_TABLE_COLUMNS } from '../../config/audit-log-table.config';
import { AuditLogFacade } from '../../facades/audit-log.facade';
import { AuditLog } from '../../models/audit-log.model';

@Component({
  selector: 'daqiq-audit-log-list-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './audit-log-list.page.html',
  styleUrl: './audit-log-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditLogListPage implements OnInit {
  protected readonly facade = inject(AuditLogFacade);
  private readonly router = inject(Router);

  protected readonly columns = AUDIT_LOG_TABLE_COLUMNS;
  protected readonly searchTerm = signal('');
  protected readonly pageIndex = computed(() => this.facade.query().page ?? 0);
  protected readonly pageSize = computed(() => this.facade.query().pageSize ?? 20);

  ngOnInit(): void {
    void this.facade.loadDefault();
  }

  protected handleSearchInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.searchTerm.set(target.value);
    }
  }

  protected handleSearchSubmit(): void {
    void this.facade.search(this.searchTerm());
  }

  protected handleRefresh(): void {
    void this.facade.refresh();
  }

  protected handlePageChange(event: DataTablePageEvent): void {
    void this.facade.paginate(event.pageIndex, event.pageSize);
  }

  protected viewDetail(log: AuditLog): void {
    void this.router.navigate(['/admin/audit-logs', log.id]);
  }
}
