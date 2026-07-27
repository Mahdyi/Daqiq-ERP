import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent, CardComponent, EmptyStateComponent, PageContainerComponent } from '@daqiq/ui';

import { AuditLogFacade } from '../../facades/audit-log.facade';
import { stringifySafeMetadata } from '../../mappers/audit-log.mapper';
import { AuditLog } from '../../models/audit-log.model';
import { formatAuditLogOutcome } from '../../models/audit-log-outcome.model';

const DATE_FORMATTER = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'full',
  timeStyle: 'medium'
});

@Component({
  selector: 'daqiq-audit-log-detail-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './audit-log-detail.page.html',
  styleUrl: './audit-log-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditLogDetailPage implements OnInit {
  protected readonly facade = inject(AuditLogFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly metadataText = computed(() => {
    const log = this.facade.selectedLog();
    return log ? stringifySafeMetadata(log.metadata) : '{}';
  });
  protected readonly metadataEmpty = computed(() => this.metadataText() === '{}');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      void this.facade.loadDetail(id);
    }
  }

  protected formatDate(log: AuditLog): string {
    return DATE_FORMATTER.format(log.occurredAt);
  }

  protected formatOutcome(log: AuditLog): string {
    return formatAuditLogOutcome(log.outcome);
  }

  protected backToList(): void {
    void this.router.navigate(['/admin/audit-logs']);
  }
}
