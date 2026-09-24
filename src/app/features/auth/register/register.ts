import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon';

const MOBILE_PATTERN = /^[6-9]\d{9}$/;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './register.html',
  styleUrl: '../login/auth.css',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly showPassword = signal(false);
  readonly serverError = signal('');
  readonly submitted = signal(false);

  readonly form = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(60)],
    }),
    mobile: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(MOBILE_PATTERN)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    if (this.auth.isLoggedIn()) void this.router.navigate(['/dashboard']);
  }

  fieldError(name: 'fullName' | 'mobile' | 'password' | 'confirmPassword'): string {
    const control = this.form.controls[name];
    if (!this.submitted() && !control.touched) return '';
    if (control.hasError('required')) {
      const labels: Record<string, string> = {
        fullName: 'Full name',
        mobile: 'Mobile number',
        password: 'Password',
        confirmPassword: 'Confirm password',
      };
      return `${labels[name]} is required.`;
    }
    if (control.hasError('minlength')) return 'Must be at least 2 characters.';
    if (control.hasError('maxlength')) return 'Must be 60 characters or fewer.';
    if (control.hasError('pattern')) return 'Enter a valid 10-digit Indian mobile number.';
    if (name === 'confirmPassword' && this.form.controls.confirmPassword.value)
      return '';
    return '';
  }

  mismatchError(): string {
    if (!this.submitted() && !this.form.controls.confirmPassword.touched) return '';
    const { password, confirmPassword } = this.form.getRawValue();
    if (confirmPassword && password !== confirmPassword) return 'Passwords do not match.';
    return '';
  }

  submit(): void {
    this.submitted.set(true);
    this.serverError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { fullName, mobile, password, confirmPassword } = this.form.getRawValue();
    const result = this.auth.register(fullName, mobile, password, confirmPassword);
    if (!result.ok) {
      this.serverError.set(result.error ?? 'Registration failed.');
      return;
    }
    this.toast.show(`Welcome, ${fullName.split(' ')[0]}! Pick a savings scheme to get started.`);
    void this.router.navigate(['/schemes']);
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }
}
