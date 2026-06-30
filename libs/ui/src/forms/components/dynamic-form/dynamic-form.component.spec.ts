import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Validators } from '@angular/forms';

import { DynamicFormComponent } from './dynamic-form.component';
import { FormFieldConfig } from '../../models/form-field-config.model';
import { FormSubmitEvent } from '../../models/form-submit-event.model';

interface DemoFormValue {
  readonly name: string | null;
  readonly email: string | null;
  readonly password: string | null;
  readonly amount: number | null;
  readonly description: string | null;
  readonly category: string | null;
  readonly dueDate: Date | null;
  readonly active: boolean;
  readonly locked: boolean;
}

@Component({
  selector: 'daqiq-test-host',
  imports: [DynamicFormComponent],
  template: `
    <daqiq-dynamic-form
      [fields]="fields"
      [initialValue]="initialValue"
      [layout]="{ columns: 2, showCancel: true }"
      (submitted)="handleSubmit($event)"
      (cancelled)="cancelled = true"
    />
  `
})
class TestHostComponent {
  readonly fields: readonly FormFieldConfig<DemoFormValue>[] = [
    {
      key: 'name',
      kind: 'text',
      label: 'نام',
      required: true
    },
    {
      key: 'email',
      kind: 'email',
      label: 'ایمیل',
      validators: [Validators.email]
    },
    {
      key: 'password',
      kind: 'password',
      label: 'رمز عبور'
    },
    {
      key: 'amount',
      kind: 'number',
      label: 'مبلغ',
      validators: [Validators.min(1)]
    },
    {
      key: 'description',
      kind: 'textarea',
      label: 'توضیحات'
    },
    {
      key: 'category',
      kind: 'select',
      label: 'دسته‌بندی',
      options: [
        {
          label: 'عمومی',
          value: 'general'
        }
      ]
    },
    {
      key: 'dueDate',
      kind: 'date',
      label: 'تاریخ'
    },
    {
      key: 'active',
      kind: 'switch',
      label: 'فعال'
    },
    {
      key: 'locked',
      kind: 'switch',
      label: 'قفل',
      disabled: (value) => value.active === false
    }
  ];
  initialValue: Partial<DemoFormValue> = {
    active: false
  };
  submitted: FormSubmitEvent<DemoFormValue> | null = null;
  cancelled = false;

  handleSubmit(event: FormSubmitEvent<DemoFormValue>): void {
    this.submitted = event;
  }
}

describe('DynamicFormComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TestHostComponent,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('renders every supported field kind', () => {
    const formFields = fixture.debugElement.queryAll(By.css('daqiq-dynamic-form-field'));

    expect(formFields.length).toBe(9);
  });

  it('does not emit submit for invalid forms', () => {
    const form = fixture.debugElement.query(By.css('form')).nativeElement as HTMLFormElement;

    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.componentInstance.submitted).toBeNull();
  });

  it('emits typed values for valid forms', () => {
    fixture.componentInstance.initialValue = {
      name: 'شرکت دقیق',
      active: true
    };
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form')).nativeElement as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.componentInstance.submitted?.valid).toBeTrue();
    expect(fixture.componentInstance.submitted?.value.name).toBe('شرکت دقیق');
  });
});
