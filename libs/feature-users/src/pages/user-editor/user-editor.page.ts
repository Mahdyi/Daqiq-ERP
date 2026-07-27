import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppRole } from '@daqiq/core';
import {
  ButtonComponent,
  CardComponent,
  DynamicFormComponent,
  FormSubmitEvent,
  PageContainerComponent
} from '@daqiq/ui';

import {
  CREATE_USER_FORM_FIELDS,
  UPDATE_USER_FORM_FIELDS
} from '../../config/user-form.config';
import { USER_ROLE_OPTIONS } from '../../config/user-role.config';
import { UserFacade } from '../../facades/user.facade';
import {
  DEFAULT_USER_FORM_VALUE,
  mapUserToFormValue
} from '../../mappers/user-form.mapper';
import { UserFormValue } from '../../models/user-form-value.model';

@Component({
  selector: 'daqiq-user-editor-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DynamicFormComponent,
    ButtonComponent
  ],
  templateUrl: './user-editor.page.html',
  styleUrl: './user-editor.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserEditorPage implements OnInit {
  protected readonly facade = inject(UserFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly roleOptions = USER_ROLE_OPTIONS;
  protected readonly selectedRoles = signal<readonly AppRole[]>(DEFAULT_USER_FORM_VALUE.roles ?? []);
  protected readonly userId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = this.userId !== null;
  protected readonly title = this.isEditMode ? 'ویرایش کاربر' : 'ایجاد کاربر';
  protected readonly fields = this.isEditMode ? UPDATE_USER_FORM_FIELDS : CREATE_USER_FORM_FIELDS;
  protected readonly initialValue = computed(() => {
    if (!this.isEditMode) {
      return DEFAULT_USER_FORM_VALUE;
    }

    const user = this.facade.editingUser();
    return user ? mapUserToFormValue(user) : DEFAULT_USER_FORM_VALUE;
  });

  async ngOnInit(): Promise<void> {
    if (!this.userId) {
      return;
    }

    await this.facade.loadForEdit(this.userId);
    const user = this.facade.editingUser();

    if (user) {
      this.selectedRoles.set(user.roles);
    }
  }

  protected handleRetry(): void {
    if (this.userId) {
      void this.facade.loadForEdit(this.userId);
    }
  }

  protected roleSelected(role: AppRole): boolean {
    return this.selectedRoles().includes(role);
  }

  protected handleRoleToggle(role: AppRole, event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.selectedRoles.update((roles) => {
      if (target.checked && !roles.includes(role)) {
        return [...roles, role];
      }

      if (!target.checked) {
        return roles.filter((currentRole) => currentRole !== role);
      }

      return roles;
    });
  }

  protected async handleSubmit(event: FormSubmitEvent<UserFormValue>): Promise<void> {
    const value: UserFormValue = {
      ...event.value,
      roles: this.selectedRoles()
    };

    const success = this.isEditMode && this.userId
      ? await this.facade.updateUser(this.userId, value)
      : await this.facade.createUser(value);

    if (success) {
      await this.router.navigate(['/admin/users']);
    }
  }

  protected handleCancel(): void {
    void this.router.navigate(['/admin/users']);
  }
}
