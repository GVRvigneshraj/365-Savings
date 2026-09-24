import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SavingsPlanService } from '../../../core/services/savings-plan.service';
import { SavingsStoreService } from '../../../core/services/savings-store.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { PLAN_TYPE_LABEL } from '../../../core/models/savings.models';
import { IconComponent } from '../../../shared/components/icon/icon';
import { SummaryCardComponent } from '../../../shared/components/summary-card/summary-card';
import { ProgressRingComponent } from '../../../shared/components/progress-ring/progress-ring';
import { SavingsGridComponent } from '../../../shared/components/savings-grid/savings-grid';
import { PaymentHistoryCardComponent } from '../../../shared/components/payment-history-card/payment-history-card';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { InrPipe } from '../../../shared/pipes/inr.pipe';

@Component({
  selector: 'app-plan-detail',
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    SummaryCardComponent,
    ProgressRingComponent,
    SavingsGridComponent,
    PaymentHistoryCardComponent,
    EmptyStateComponent,
    InrPipe,
  ],
  templateUrl: './plan-detail.html',
  styleUrl: './plan-detail.css',
})
export class PlanDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(SavingsStoreService);
  readonly planService = inject(SavingsPlanService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly planId = signal(this.route.snapshot.paramMap.get('id') ?? '');
  readonly plan = computed(() => this.planService.planById(this.planId()));
  readonly stats = computed(() => this.planService.getStats(this.planId()));

  readonly payments = computed(() =>
    [...this.store.payments()]
      .filter((payment) => payment.planId === this.planId())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
  );

  readonly typeLabel = computed(() => {
    const plan = this.plan();
    return plan ? PLAN_TYPE_LABEL[plan.type] : '';
  });

  readonly slotPercent = computed(() => `${(this.stats().slotProgress * 100).toFixed(1)}%`);
  readonly amountPercent = computed(() => `${(this.stats().amountProgress * 100).toFixed(1)}%`);

  goPay(): void {
    void this.router.navigate(['/pay'], { queryParams: { plan: this.planId() } });
  }

  goGrid(): void {
    void this.router.navigate(['/grid', this.planId()]);
  }

  async togglePause(): Promise<void> {
    const plan = this.plan();
    if (!plan) return;
    if (plan.status === 'PAUSED') {
      this.planService.setStatus(plan.id, 'ACTIVE');
      this.toast.show(`“${plan.name}” resumed.`);
      return;
    }
    if (plan.status === 'COMPLETED') return;
    const ok = await this.confirm.open({
      title: 'Pause plan?',
      message: `Payments to “${plan.name}” will be blocked until you resume it.`,
      confirmText: 'Pause plan',
      danger: true,
    });
    if (ok) {
      this.planService.setStatus(plan.id, 'PAUSED');
      this.toast.show(`“${plan.name}” paused.`, 'info');
    }
  }

  async deletePlan(): Promise<void> {
    const plan = this.plan();
    if (!plan) return;
    const ok = await this.confirm.open({
      title: 'Delete this plan?',
      message: `“${plan.name}” and its payment history will be permanently removed from this device.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.planService.deletePlan(plan.id);
    this.toast.show('Plan deleted.', 'info');
    void this.router.navigate(['/plans']);
  }

  async resetPlan(): Promise<void> {
    const plan = this.plan();
    if (!plan) return;
    const ok = await this.confirm.open({
      title: 'Reset plan progress?',
      message: `All paid slots in “${plan.name}” will be cleared and Paid Count will return to 0.`,
      confirmText: 'Reset progress',
      danger: true,
    });
    if (!ok) return;
    this.planService.resetPlan(plan.id);
    this.toast.show('Plan progress reset to 0.', 'info');
  }
}
