import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonComponent } from '@daqiq/ui';

import { AuthFacade } from '../../facades/auth.facade';
import { LoginFormValue, LOGIN_LABELS } from '../../models/login-form-value.model';

type LoginForm = FormGroup<{
  email: FormControl<string>;
  password: FormControl<string>;
}>;

@Component({
  selector: 'daqiq-login-page',
  imports: [ButtonComponent, ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthFacade);
  protected readonly labels = LOGIN_LABELS;

  protected readonly form: LoginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      void this.auth.redirectAfterLogin(this.returnUrl);
    }
  }

  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    this.auth.clearError();

    if (this.form.invalid) {
      return;
    }

    await this.auth.login(this.form.getRawValue() satisfies LoginFormValue, this.returnUrl);
  }

  protected get emailControl(): FormControl<string> {
    return this.form.controls.email;
  }

  protected get passwordControl(): FormControl<string> {
    return this.form.controls.password;
  }

  private get returnUrl(): string | null {
    return this.route.snapshot.queryParamMap.get('returnUrl');
  }
}
