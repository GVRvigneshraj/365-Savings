import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SavingsPlan } from '../../../core/models/savings.models';

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="pay-form" [formGroup]="form">
      <label class="label" for="pay-amount">Payment amount</label>
      <div class="amount-box" [class.amount-invalid]="showError()">
        <span class="currency">₹</span>
        <input
          id="pay-amount"
          class="amount-input"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          placeholder="0"
          formControlName="amount"
        />
      </div>

      <div class="quick-row">
        @for (quick of quickAmounts; track quick) {
          <button
            type="button"
            class="chip"
            [class.chip-active]="amount() === quick"
            (click)="setAmount(quick)"
          >
            {{ quick | number: '1.0-0' }}
          </button>
        }
        <button type="button" class="chip" [class.chip-active]="isCustom()" (click)="focusInput()">
          Custom
        </button>
      </div>

      @if (showError()) {
        <p class="error-text">{{ errorMessage() }}</p>
      } @else if (plan(); as activePlan) {
        @if (activePlan.maxPayment) {
          <p class="hint-text">Limit: ₹{{ activePlan.maxPayment | number: '1.0-0' }} per payment</p>
        }
      }
    </div>
  `,
  styles: `
    .pay-form { display: flex; flex-direction: column; gap: 0.55rem; }
    .amount-box {
      display: flex; align-items: center; gap: 0.4rem;
      background: var(--gray-100); border: 1.5px solid var(--gray-200);
      border-radius: 16px; padding: 0.35rem 1rem;
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .amount-box:focus-within { border-color: var(--primary); background: #fff; }
    .amount-invalid { border-color: var(--danger); background: #fff5f5; }
    .currency { font-size: 1.4rem; font-weight: 800; color: var(--primary); }
    .amount-input {
      border: 0; background: transparent; outline: none; width: 100%;
      font-size: clamp(1.7rem, 5vw, 2.3rem); font-weight: 800; color: var(--navy);
      font-family: inherit; font-variant-numeric: tabular-nums; padding: 0.4rem 0;
    }
    .amount-input::placeholder { color: var(--gray-400); }
    .quick-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.35rem; }
    .error-text { color: var(--danger); font-size: 0.85rem; font-weight: 600; margin: 0.15rem 0 0; }
    .hint-text { color: var(--muted); font-size: 0.8rem; margin: 0.15rem 0 0; }
  `,
})
export class PaymentFormComponent {
  readonly plan = input<SavingsPlan | null>(null);
  readonly presetAmount = input(0);
  readonly amountChange = output<number>();
  readonly quickAmounts = [100, 200, 500, 1000, 2000];

  readonly form = new FormGroup({
    amount: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(AMOUNT_PATTERN)],
    }),
  });

  private readonly amountState = signal(0);
  private readonly touchedState = signal(false);
  private appliedPlanId = '';

  readonly amount = this.amountState.asReadonly();
  readonly touched = this.touchedState.asReadonly();

  readonly showError = computed(
    () =>
      this.touchedState() &&
      this.form.controls.amount.invalid &&
      this.form.controls.amount.value !== '',
  );

  readonly errorMessage = computed(() => {
    const control = this.form.controls.amount;
    if (control.hasError('required')) return 'Enter a payment amount.';
    if (control.hasError('pattern'))
      return 'Enter a valid amount (e.g. 500 or 500.50).';
    if (this.amountState() > 0 && this.amountState() < 1) return 'Minimum payment is ₹1.';
    if (this.amountState() <= 0) return 'Payment must be greater than zero.';
    return 'Invalid amount.';
  });

  readonly isCustom = computed(
    () => this.amountState() > 0 && !this.quickAmounts.includes(this.amountState()),
  );

  constructor() {
    this.form.controls.amount.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        const trimmed = String(value).trim();
        const parsed = Number(trimmed);
        const amount = trimmed === '' || Number.isNaN(parsed) ? 0 : parsed;
        this.amountState.set(amount);
        this.touchedState.set(true);
        this.amountChange.emit(amount);
      });

    effect(() => {
      const planId = this.plan()?.id ?? '';
      const preset = this.presetAmount();
      if (!planId || preset < 1) return;
      const current = this.form.controls.amount.value;
      const empty = current === '' || current === '0';
      if (planId !== this.appliedPlanId || empty) {
        this.appliedPlanId = planId;
        this.setAmount(preset);
      }
    });
  }

  setAmount(value: number): void {
    this.form.controls.amount.setValue(String(value));
  }

  focusInput(): void {
    if (typeof document === 'undefined') return;
    const input = document.getElementById('pay-amount') as HTMLInputElement | null;
    input?.focus();
    input?.select();
  }

  reset(): void {
    this.form.reset({ amount: '' });
    this.touchedState.set(false);
    this.amountState.set(0);
    this.appliedPlanId = '';
  }
}
