import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon';

const MOBILE_PATTERN = /^[6-9]\d{9}$/;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './login.html',
  styleUrl: './auth.css',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly showPassword = signal(false);
  readonly serverError = signal('');
  readonly submitted = signal(false);

  readonly form = new FormGroup({
    mobile: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(MOBILE_PATTERN)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  constructor() {
    if (this.auth.isLoggedIn()) void this.router.navigate(['/dashboard']);
  }

  fieldError(name: 'mobile' | 'password'): string {
    const control = this.form.controls[name];
    if (!this.submitted() && !control.touched) return '';
    if (control.hasError('required')) return name === 'mobile' ? 'Mobile number is required.' : 'Password is required.';
    if (control.hasError('pattern')) return 'Enter a valid 10-digit mobile number.';
    if (control.hasError('minlength')) return 'Password must be at least 6 characters.';
    return '';
  }

  submit(): void {
    this.submitted.set(true);
    this.serverError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { mobile, password } = this.form.getRawValue();
    const result = this.auth.login(mobile, password);
    if (!result.ok) {
      this.serverError.set(result.error ?? 'Login failed.');
      return;
    }
    this.toast.show('Welcome back! Your savings are right where you left them.');
    void this.router.navigate(['/dashboard']);
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }
}
