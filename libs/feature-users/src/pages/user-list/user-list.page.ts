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

import { USER_TABLE_COLUMNS } from '../../config/user-table.config';
import { UserFacade } from '../../facades/user.facade';
import { ManagedUser } from '../../models/user.model';

@Component({
  selector: 'daqiq-user-list-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './user-list.page.html',
  styleUrl: './user-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListPage implements OnInit {
  protected readonly facade = inject(UserFacade);
  private readonly router = inject(Router);

  protected readonly columns = USER_TABLE_COLUMNS;
  protected readonly searchTerm = signal('');
  protected readonly pageIndex = computed(() => this.facade.query()?.page ?? 0);
  protected readonly pageSize = computed(() => this.facade.query()?.pageSize ?? 20);

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

  protected handleCreate(): void {
    void this.router.navigate(['/admin/users/new']);
  }

  protected handleEdit(user: ManagedUser): void {
    void this.router.navigate(['/admin/users', user.id, 'edit']);
  }

  protected handleResetPassword(user: ManagedUser): void {
    void this.router.navigate(['/admin/users', user.id, 'reset-password']);
  }

  protected handleToggleActive(user: ManagedUser): void {
    if (user.active) {
      void this.facade.deactivateUser(user);
      return;
    }

    void this.facade.activateUser(user);
  }

  protected handlePageChange(event: DataTablePageEvent): void {
    void this.facade.paginate(event.pageIndex, event.pageSize);
  }
}
