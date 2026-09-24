import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { SavingsPlanService } from '../../core/services/savings-plan.service';
import { AuthService } from '../../core/services/auth.service';
import { formatAmount } from '../../core/utils/money';
import { IconComponent } from '../../shared/components/icon/icon';
import { SummaryCardComponent } from '../../shared/components/summary-card/summary-card';
import { PlanCardComponent } from '../../shared/components/plan-card/plan-card';
import { ProgressRingComponent } from '../../shared/components/progress-ring/progress-ring';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { InrPipe } from '../../shared/pipes/inr.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    SummaryCardComponent,
    PlanCardComponent,
    ProgressRingComponent,
    EmptyStateComponent,
    InrPipe,
    DatePipe,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly dashboardService = inject(DashboardService);
  readonly planService = inject(SavingsPlanService);

  readonly data = this.dashboardService.dashboard;

  readonly firstName = computed(() => this.auth.displayName().split(' ')[0]);

  readonly totalSavedText = computed(() => formatAmount(this.data().totalSaved));
  readonly remainingText = computed(() => formatAmount(this.data().remainingAmount));
  readonly paidCountText = computed(
    () => `${this.data().focusPaidCount} / ${this.data().focusTotalSlots}`,
  );
  readonly progressText = computed(() =>
    this.data().focusTotalSlots
      ? `${(this.data().focusSlotProgress * 100).toFixed(2)}%`
      : '0.00%',
  );

  readonly greetingLine = computed(() => {
    const streak = this.data().streak.current;
    if (streak > 0) return `Keep saving. ${streak}-day streak in progress.`;
    return 'Keep saving. Your future self will thank you.';
  });

  viewPlan(planId: string): void {
    void this.router.navigate(['/plans', planId]);
  }

  payPlan(planId: string): void {
    void this.router.navigate(['/pay'], { queryParams: { plan: planId } });
  }

  goSchemes(): void {
    void this.router.navigate(['/schemes']);
  }

  openGrid(): void {
    const id = this.data().focusPlan?.id;
    if (id) void this.router.navigate(['/grid', id]);
    else void this.router.navigate(['/plans']);
  }
}
