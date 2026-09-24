import { Injectable, computed, inject } from '@angular/core';
import { Payment, SavingsPlan, SavingsSlot } from '../models/savings.models';
import { round2 } from '../utils/money';
import { computeStreaks, StreakResult } from '../utils/streak';
import { SavingsStoreService } from './savings-store.service';
import {
  computePlanStats,
  EMPTY_STATS,
  SavingsPlanService,
} from './savings-plan.service';

export interface DashboardData {
  totalSaved: number;
  remainingAmount: number;
  focusPlan: SavingsPlan | null;
  focusPaidCount: number;
  focusTotalSlots: number;
  focusSlotProgress: number;
  focusAmountProgress: number;
  focusTotalTarget: number;
  focusTotalPaid: number;
  focusNextSlotLabel: string;
  focusNextRequired: number;
  focusPartialBalance: number;
  focusPartialRemaining: number;
  activePlans: SavingsPlan[];
  completedPlans: SavingsPlan[];
  recentPayments: Payment[];
  streak: StreakResult;
  hasPlans: boolean;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly store = inject(SavingsStoreService);
  private readonly planService = inject(SavingsPlanService);

  readonly dashboard = computed<DashboardData>(() => {
    const plans = this.store.plans();
    const slots = this.store.slots();
    const payments = [...this.store.payments()].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const activePlans = plans
      .filter((plan) => plan.status === 'ACTIVE')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const completedPlans = plans.filter((plan) => plan.status === 'COMPLETED');

    const slotsByPlan: Record<string, SavingsSlot[]> = {};
    for (const slot of slots) (slotsByPlan[slot.planId] ??= []).push(slot);

    let totalSaved = 0;
    let remainingAmount = 0;
    for (const plan of plans) {
      const stats = computePlanStats(plan, slotsByPlan[plan.id] ?? []);
      totalSaved = round2(totalSaved + stats.totalPaid);
      remainingAmount = round2(remainingAmount + stats.remainingAmount);
    }

    const focusPlan = activePlans[0] ?? completedPlans[0] ?? plans[0] ?? null;
    const focusStats = focusPlan
      ? computePlanStats(focusPlan, slotsByPlan[focusPlan.id] ?? [])
      : EMPTY_STATS;

    const nextSlot = focusStats.nextSlot;
    const partialRemaining = nextSlot
      ? round2(nextSlot.requiredAmount - nextSlot.paidAmount)
      : 0;

    return {
      totalSaved,
      remainingAmount,
      focusPlan,
      focusPaidCount: focusStats.paidCount,
      focusTotalSlots: focusPlan?.totalSlots ?? 0,
      focusSlotProgress: focusStats.slotProgress,
      focusAmountProgress: focusStats.amountProgress,
      focusTotalTarget: focusPlan?.totalTarget ?? 0,
      focusTotalPaid: focusStats.totalPaid,
      focusNextSlotLabel: nextSlot?.label ?? 'All slots paid',
      focusNextRequired: nextSlot ? partialRemaining : 0,
      focusPartialBalance: focusStats.partialBalance,
      focusPartialRemaining: partialRemaining,
      activePlans,
      completedPlans,
      recentPayments: payments.slice(0, 5),
      streak: computeStreaks(payments),
      hasPlans: plans.length > 0,
    };
  });

  readonly focusPlanId = computed(() => this.dashboard().focusPlan?.id ?? null);
}
