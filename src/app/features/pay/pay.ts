import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SavingsPlan } from '../../core/models/savings.models';
import { PaymentAllocationService } from '../../core/services/payment-allocation.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { SettingsService } from '../../core/services/settings.service';
import { SavingsPlanService } from '../../core/services/savings-plan.service';
import { IconComponent } from '../../shared/components/icon/icon';
import { PaymentFormComponent } from '../../shared/components/payment-form/payment-form';
import { PaymentPreviewComponent } from '../../shared/components/payment-preview/payment-preview';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { InrPipe } from '../../shared/pipes/inr.pipe';

@Component({
  selector: 'app-pay',
  standalone: true,
  imports: [
    IconComponent,
    PaymentFormComponent,
    PaymentPreviewComponent,
    EmptyStateComponent,
    InrPipe,
  ],
  templateUrl: './pay.html',
  styleUrl: './pay.css',
})
export class PayComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly allocation = inject(PaymentAllocationService);
  private readonly confirm = inject(ConfirmService);
  private readonly settings = inject(SettingsService);
  readonly planService = inject(SavingsPlanService);

  readonly selectedId = signal(this.route.snapshot.queryParamMap.get('plan') ?? '');
  readonly amount = signal(0);
  readonly error = signal('');
  readonly busy = signal(false);

  readonly selectedPlan = computed(() => {
    const list = this.planService.plans();
    return (
      list.find((plan) => plan.id === this.selectedId()) ??
      list.find((plan) => plan.status === 'ACTIVE') ??
      list[0] ??
      null
    );
  });

  readonly stats = computed(() => {
    const plan = this.selectedPlan();
    return plan ? this.planService.getStats(plan.id) : null;
  });

  readonly preview = computed(() => {
    const plan = this.selectedPlan();
    if (!plan) return null;
    return this.allocation.preview(plan.id, this.amount());
  });

  readonly validationMessage = computed(() => {
    const plan = this.selectedPlan();
    if (!plan) return 'Select a savings plan to continue.';
    if (plan.status === 'PAUSED') return 'This plan is paused. Resume it to pay.';
    const amount = this.amount();
    if (amount < 1) return null;
    if (plan.maxPayment !== null && amount > plan.maxPayment)
      return `Maximum allowed per payment is ₹${plan.maxPayment}.`;
    return null;
  });

  readonly canConfirm = computed(() => {
    const plan = this.selectedPlan();
    if (!plan || this.busy()) return false;
    if (plan.status === 'PAUSED') return false;
    const amount = this.amount();
    if (amount < 1) return false;
    if (plan.maxPayment !== null && amount > plan.maxPayment) return false;
    return true;
  });

  readonly nextDueLabel = computed(() => this.stats()?.nextSlot?.label ?? '');
  readonly nextDueAmount = computed(() => {
    const next = this.stats()?.nextSlot;
    return next ? Math.max(0, next.requiredAmount - next.paidAmount) : 0;
  });

  constructor() {
    const planId = this.route.snapshot.queryParamMap.get('plan');
    if (planId) this.selectedId.set(planId);
  }

  selectPlan(plan: SavingsPlan): void {
    this.selectedId.set(plan.id);
    this.error.set('');
  }

  goSchemes(): void {
    void this.router.navigate(['/schemes']);
  }

  async confirmPayment(): Promise<void> {
    const plan = this.selectedPlan();
    if (!plan || this.busy()) return;

    const amount = this.amount();
    const validation = this.allocation.validate(plan, amount);
    if (!validation.valid) {
      this.error.set(validation.error ?? 'Invalid payment.');
      return;
    }
    this.error.set('');

    if (this.settings.settings().paymentConfirmation) {
      const ok = await this.confirm.open({
        title: 'Confirm payment',
        message: `Pay ₹${amount} to “${plan.name}”? Review the allocation preview before it is applied.`,
        confirmText: 'Confirm Payment',
      });
      if (!ok) return;
    }

    this.busy.set(true);
    try {
      const result = this.allocation.allocatePayment(plan.id, amount);
      if (!result.success) {
        this.error.set(result.error ?? 'Payment failed.');
        return;
      }
      await this.router.navigate(['/pay/success']);
    } finally {
      this.busy.set(false);
    }
  }
}
