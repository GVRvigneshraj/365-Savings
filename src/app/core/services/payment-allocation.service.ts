import { Injectable, computed, inject, signal } from '@angular/core';
import {
  AllocationLine,
  AllocationPreview,
  Payment,
  PaymentAllocation,
  PaymentResult,
  PaymentSuccessData,
  PaymentValidation,
  SavingsPlan,
  SavingsSlot,
} from '../models/savings.models';
import { round2, sum } from '../utils/money';
import { createId } from '../utils/ids';
import { SavingsStoreService } from './savings-store.service';
import { SettingsService } from './settings.service';
import { ToastService } from './toast.service';
import {
  computePlanStats,
  EMPTY_STATS,
} from './savings-plan.service';

export interface AllocationOutcome {
  lines: AllocationLine[];
  allocations: PaymentAllocation[];
  allocatedAmount: number;
  leftoverAmount: number;
  slotsFullyCovered: number;
  partialSlot: AllocationLine | null;
}

/**
 * Pure sequential payment allocation engine.
 *
 * Money is distributed to the first unpaid/partial slots in slot order.
 * Paid Count only ever counts slots whose required amount is fully covered.
 * Calendar dates are never used to mark a slot as paid.
 */
export function runAllocation(
  slots: SavingsSlot[],
  paymentAmount: number,
  autoAllocation: boolean,
): AllocationOutcome {
  const ordered = [...slots].sort((a, b) => a.slotNumber - b.slotNumber);
  let remainingPayment = round2(paymentAmount);
  const lines: AllocationLine[] = [];
  const allocations: PaymentAllocation[] = [];
  let allocatedAmount = 0;
  let slotsFullyCovered = 0;

  for (const slot of ordered) {
    if (remainingPayment <= 0) break;
    if (slot.status === 'FULLY_PAID') continue;
    if (!autoAllocation && lines.length >= 1) break;

    const remainingForSlot = round2(slot.requiredAmount - slot.paidAmount);
    if (remainingForSlot <= 0) continue;

    const amountAllocated = Math.min(remainingPayment, remainingForSlot);
    if (amountAllocated <= 0) break;

    const previousPaidAmount = slot.paidAmount;
    const newPaidAmount = round2(previousPaidAmount + amountAllocated);
    const status =
      newPaidAmount >= slot.requiredAmount ? ('FULLY_PAID' as const) : ('PARTIAL' as const);
    const wasCompleted = status === 'FULLY_PAID';

    lines.push({
      slotId: slot.id,
      slotNumber: slot.slotNumber,
      label: slot.label,
      requiredAmount: slot.requiredAmount,
      previousPaidAmount,
      amountAllocated: round2(amountAllocated),
      newPaidAmount,
      remainingAfter: round2(slot.requiredAmount - newPaidAmount),
      status,
      wasCompleted,
    });

    allocations.push({
      slotId: slot.id,
      slotNumber: slot.slotNumber,
      amountAllocated: round2(amountAllocated),
      previousPaidAmount,
      newPaidAmount,
      status,
    });

    allocatedAmount = round2(allocatedAmount + amountAllocated);
    remainingPayment = round2(remainingPayment - amountAllocated);
    if (wasCompleted) slotsFullyCovered++;
  }

  const partialLine = lines.length ? lines[lines.length - 1] : null;
  return {
    lines,
    allocations,
    allocatedAmount,
    leftoverAmount: Math.max(0, remainingPayment),
    slotsFullyCovered,
    partialSlot: partialLine && partialLine.status === 'PARTIAL' ? partialLine : null,
  };
}

@Injectable({ providedIn: 'root' })
export class PaymentAllocationService {
  private readonly store = inject(SavingsStoreService);
  private readonly settings = inject(SettingsService);
  private readonly toast = inject(ToastService);

  private readonly lastResultState = signal<PaymentSuccessData | null>(null);
  readonly lastResult = this.lastResultState.asReadonly();

  readonly isAutoAllocation = computed(
    () => this.settings.settings().autoAllocation,
  );

  private effectiveAutoAllocation(plan: SavingsPlan): boolean {
    return this.settings.settings().autoAllocation && plan.autoAllocation;
  }

  validate(plan: SavingsPlan | undefined, rawAmount: unknown): PaymentValidation {
    if (!plan) return { valid: false, error: 'Select a savings plan.', code: 'NO_PLAN' };
    if (plan.status === 'PAUSED')
      return { valid: false, error: 'This plan is paused. Resume it to pay.', code: 'PLAN_PAUSED' };

    const amount = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount);
    if (!Number.isFinite(amount) || Number.isNaN(amount))
      return { valid: false, error: 'Enter a valid amount.', code: 'INVALID_AMOUNT' };
    if (amount <= 0)
      return { valid: false, error: 'Payment must be greater than zero.', code: 'ZERO_AMOUNT' };
    if (amount < 1)
      return { valid: false, error: 'Minimum payment is ₹1.', code: 'MIN_AMOUNT' };
    if (plan.maxPayment !== null && amount > plan.maxPayment)
      return {
        valid: false,
        error: `Maximum allowed per payment is ₹${plan.maxPayment}.`,
        code: 'LIMIT_EXCEEDED',
      };
    return { valid: true };
  }

  preview(planId: string, rawAmount: number | string): AllocationPreview | null {
    const plan = this.store.plansById()[planId];
    if (!plan) return null;
    const amount = Number(rawAmount);
    const slots = this.store.slotsForPlan(planId);
    const stats = computePlanStats(plan, slots);

    const blank: AllocationPreview = {
      planId,
      planName: plan.name,
      requestedAmount: Number.isFinite(amount) ? amount : 0,
      effectiveAmount: 0,
      lines: [],
      slotsFullyCovered: 0,
      partialSlot: null,
      allocatedAmount: 0,
      leftoverAmount: 0,
      leftoverReason: 'none',
      paidCountBefore: stats.paidCount,
      paidCountAfter: stats.paidCount,
      totalSlots: plan.totalSlots,
      totalSavedAfter: stats.totalPaid,
      remainingAfter: stats.remainingAmount,
    };

    if (!Number.isFinite(amount) || amount <= 0) return blank;

    const outcome = runAllocation(slots, amount, this.effectiveAutoAllocation(plan));
    const allFull = stats.paidCount === plan.totalSlots;
    const leftoverReason = allFull
      ? 'plan-complete'
      : !this.effectiveAutoAllocation(plan) && outcome.leftoverAmount > 0
        ? 'auto-allocation-off'
        : 'none';

    const totalSavedAfter = round2(stats.totalPaid + outcome.allocatedAmount);

    return {
      ...blank,
      requestedAmount: amount,
      effectiveAmount: outcome.allocatedAmount,
      lines: outcome.lines,
      slotsFullyCovered: outcome.slotsFullyCovered,
      partialSlot: outcome.partialSlot,
      allocatedAmount: outcome.allocatedAmount,
      leftoverAmount: outcome.leftoverAmount,
      leftoverReason,
      paidCountAfter: round2(stats.paidCount + outcome.slotsFullyCovered),
      totalSavedAfter,
      remainingAfter: round2(Math.max(0, plan.totalTarget - totalSavedAfter)),
    };
  }

  allocatePayment(planId: string, paymentAmount: number): PaymentResult {
    const plan = this.store.plansById()[planId];
    const validation = this.validate(plan, paymentAmount);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error ?? 'Invalid payment.',
        code: validation.code,
      };
    }

    const activePlan = plan as SavingsPlan;
    const slots = this.store.slotsForPlan(planId);
    const statsBefore = computePlanStats(activePlan, slots);
    const amount = round2(Number(paymentAmount));
    const outcome = runAllocation(slots, amount, this.effectiveAutoAllocation(activePlan));

    const nowIso = new Date().toISOString();
    const updatedSlots = slots.map((slot) => {
      const line = outcome.lines.find((item) => item.slotId === slot.id);
      if (!line) return slot;
      return {
        ...slot,
        paidAmount: line.newPaidAmount,
        status: line.status,
        paidAt: line.wasCompleted ? nowIso : slot.paidAt,
      };
    });

    const statsAfter = computePlanStats(activePlan, updatedSlots);
    const planCompleted = statsAfter.isComplete;
    const updatedPlan: SavingsPlan = {
      ...activePlan,
      status: planCompleted ? 'COMPLETED' : activePlan.status === 'COMPLETED' ? 'ACTIVE' : activePlan.status,
    };

    const payment: Payment = {
      id: createId('pay'),
      planId,
      planName: activePlan.name,
      amount,
      allocatedAmount: outcome.allocatedAmount,
      extraAmount: outcome.leftoverAmount,
      date: nowIso,
      allocations: outcome.allocations,
      slotsCompleted: outcome.slotsFullyCovered,
      status: outcome.leftoverAmount > 0 ? 'PARTIAL' : 'COMPLETED',
    };

    this.store.commitAllocation({
      slots: updatedSlots,
      plan: updatedPlan,
      payment,
    });

    const data: PaymentSuccessData = {
      payment,
      planId,
      planName: activePlan.name,
      previousPaidCount: statsBefore.paidCount,
      newPaidCount: statsAfter.paidCount,
      totalSlots: activePlan.totalSlots,
      slotsCompleted: outcome.slotsFullyCovered,
      totalSavedAfter: statsAfter.totalPaid,
      remainingAfter: statsAfter.remainingAmount,
      planCompleted,
    };
    this.lastResultState.set(data);

    if (this.settings.settings().notifications) {
      if (planCompleted) {
        this.toast.show(`🎉 Plan completed! ${activePlan.name} is fully paid.`, 'success', 4200);
      } else {
        this.toast.show(
          `Payment of ₹${amount} recorded · ${outcome.slotsFullyCovered} slot(s) completed`,
          'success',
        );
      }
    }

    return { success: true, data };
  }

  clearResult(): void {
    this.lastResultState.set(null);
  }

  planStats(planId: string) {
    const plan = this.store.plansById()[planId];
    return computePlanStats(plan, this.store.slotsForPlan(planId)) ?? EMPTY_STATS;
  }

  sum(values: number[]): number {
    return sum(values);
  }
}
