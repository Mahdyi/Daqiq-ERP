export interface LoginFormValue {
  readonly email: string;
  readonly password: string;
}

export const LOGIN_LABELS = {
  title: 'ورود به سامانه',
  subtitle: 'برای ادامه، اطلاعات حساب کاربری خود را وارد کنید.',
  email: 'ایمیل',
  emailPlaceholder: 'admin@erp.com',
  password: 'رمز عبور',
  passwordPlaceholder: 'رمز عبور',
  submit: 'ورود',
  submitting: 'در حال ورود...',
  invalidCredentials: 'اطلاعات ورود نامعتبر است',
  required: 'این فیلد الزامی است.',
  invalidEmail: 'ایمیل وارد شده معتبر نیست.'
} as const;
