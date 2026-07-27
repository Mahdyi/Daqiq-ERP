import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CardComponent,
  DynamicFormComponent,
  FormSubmitEvent,
  PageContainerComponent
} from '@daqiq/ui';

import { RESET_PASSWORD_FORM_FIELDS } from '../../config/reset-password-form.config';
import { UserFacade } from '../../facades/user.facade';
import { ResetPasswordFormValue } from '../../models/reset-password-form-value.model';

@Component({
  selector: 'daqiq-reset-password-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DynamicFormComponent
  ],
  templateUrl: './reset-password.page.html',
  styleUrl: './reset-password.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordPage {
  protected readonly facade = inject(UserFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly fields = RESET_PASSWORD_FORM_FIELDS;
  protected readonly formError = signal<string | null>(null);
  private readonly userId = this.route.snapshot.paramMap.get('id');

  protected async handleSubmit(event: FormSubmitEvent<ResetPasswordFormValue>): Promise<void> {
    const newPassword = event.value.newPassword?.trim() ?? '';
    const confirmPassword = event.value.confirmPassword?.trim() ?? '';

    if (newPassword !== confirmPassword) {
      this.formError.set('تکرار رمز عبور با رمز عبور جدید یکسان نیست.');
      return;
    }

    if (!this.userId) {
      this.formError.set('شناسه کاربر معتبر نیست.');
      return;
    }

    this.formError.set(null);
    const success = await this.facade.resetPassword(this.userId, { newPassword });

    if (success) {
      await this.router.navigate(['/admin/users']);
    }
  }

  protected handleCancel(): void {
    void this.router.navigate(['/admin/users']);
  }
}
