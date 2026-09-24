import { Injectable, computed, inject } from '@angular/core';
import { Payment, SavingsPlan, SavingsSlot } from '../models/savings.models';
import { round2 } from '../utils/money';
import { computeStreaks } from '../utils/streak';
import { SavingsStoreService } from './savings-store.service';
import { computePlanStats } from './savings-plan.service';

export interface ChartPoint {
  label: string;
  value: number;
}

export interface PlanComparisonPoint {
  label: string;
  paid: number;
  target: number;
}

export interface ReportData {
  totalSaved: number;
  totalPayments: number;
  paidSlots: number;
  partialSlots: number;
  unpaidSlots: number;
  remainingAmount: number;
  averagePayment: number;
  largestPayment: number;
  currentStreak: number;
  longestStreak: number;
  activePlans: number;
  completedPlans: number;
  pausedPlans: number;
  totalTargetAll: number;
  paymentTrend: ChartPoint[];
  savingsProgress: ChartPoint[];
  planComparison: PlanComparisonPoint[];
  hasData: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly store = inject(SavingsStoreService);

  readonly reports = computed<ReportData>(() => {
    const plans = this.store.plans();
    const allSlots = this.store.slots();
    const payments = [...this.store.payments()].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const slotsByPlan: Record<string, SavingsSlot[]> = {};
    for (const slot of allSlots) (slotsByPlan[slot.planId] ??= []).push(slot);

    let totalSaved = 0;
    let remainingAmount = 0;
    let paidSlots = 0;
    let partialSlots = 0;
    let unpaidSlots = 0;
    let totalTargetAll = 0;

    for (const plan of plans) {
      const stats = computePlanStats(plan, slotsByPlan[plan.id] ?? []);
      totalSaved = round2(totalSaved + stats.totalPaid);
      remainingAmount = round2(remainingAmount + stats.remainingAmount);
      paidSlots += stats.paidCount;
      partialSlots += stats.partialCount;
      unpaidSlots += stats.unpaidCount;
      totalTargetAll = round2(totalTargetAll + plan.totalTarget);
    }

    const amounts = payments.map((payment) => payment.amount);
    const averagePayment = amounts.length
      ? round2(amounts.reduce((total, value) => total + value, 0) / amounts.length)
      : 0;
    const largestPayment = amounts.length ? Math.max(...amounts) : 0;
    const streak = computeStreaks(payments);

    const planComparison: PlanComparisonPoint[] = plans.map((plan) => ({
      label: plan.name,
      paid: computePlanStats(plan, slotsByPlan[plan.id] ?? []).totalPaid,
      target: plan.totalTarget,
    }));

    return {
      totalSaved,
      totalPayments: payments.length,
      paidSlots,
      partialSlots,
      unpaidSlots,
      remainingAmount,
      averagePayment,
      largestPayment,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      activePlans: plans.filter((plan) => plan.status === 'ACTIVE').length,
      completedPlans: plans.filter((plan) => plan.status === 'COMPLETED').length,
      pausedPlans: plans.filter((plan) => plan.status === 'PAUSED').length,
      totalTargetAll,
      paymentTrend: this.buildPaymentTrend(payments),
      savingsProgress: this.buildSavingsProgress(plans, payments, slotsByPlan),
      planComparison,
      hasData: plans.length > 0 || payments.length > 0,
    };
  });

  private buildPaymentTrend(payments: Payment[]): ChartPoint[] {
    const recent = payments.slice(-12);
    return recent.map((payment) => ({
      label: new Date(payment.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      }),
      value: payment.amount,
    }));
  }

  private buildSavingsProgress(
    plans: SavingsPlan[],
    payments: Payment[],
    slotsByPlan: Record<string, SavingsSlot[]>,
  ): ChartPoint[] {
    if (payments.length === 0) return [];
    let running = 0;
    const points: ChartPoint[] = [{ label: 'Start', value: 0 }];
    for (const payment of payments.slice(-15)) {
      running = round2(running + payment.allocatedAmount);
      points.push({
        label: new Date(payment.date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
        }),
        value: running,
      });
    }
    void plans;
    void slotsByPlan;
    return points;
  }
}
