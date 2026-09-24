import { Injectable, computed, inject } from '@angular/core';
import {
  AmountMode,
  CreatePlanRequest,
  PLAN_SLOT_PREFIX,
  PlanStats,
  SavingsPlan,
  SavingsSlot,
  SlotStatus,
} from '../models/savings.models';
import { round2, sum } from '../utils/money';
import { createId } from '../utils/ids';
import { SavingsStoreService } from './savings-store.service';

export const EMPTY_STATS: PlanStats = {
  paidCount: 0,
  partialCount: 0,
  unpaidCount: 0,
  totalPaid: 0,
  remainingAmount: 0,
  slotProgress: 0,
  amountProgress: 0,
  nextSlot: null,
  partialBalance: 0,
  isComplete: false,
};

export function slotLabel(type: SavingsPlan['type'], slotNumber: number): string {
  return `${PLAN_SLOT_PREFIX[type]} ${slotNumber}`;
}

export function buildSlots(
  planId: string,
  type: SavingsPlan['type'],
  totalSlots: number,
  amountMode: AmountMode,
  amountPerSlot: number,
): SavingsSlot[] {
  const slots: SavingsSlot[] = [];
  for (let i = 1; i <= totalSlots; i++) {
    slots.push({
      id: createId('slot'),
      planId,
      slotNumber: i,
      label: slotLabel(type, i),
      requiredAmount: amountMode === 'increasing' ? i : round2(amountPerSlot),
      paidAmount: 0,
      status: 'UNPAID' as SlotStatus,
      paidAt: null,
    });
  }
  return slots;
}

export function computePlanStats(
  plan: SavingsPlan | undefined,
  slots: SavingsSlot[],
): PlanStats {
  if (!plan || slots.length === 0) {
    if (plan && slots.length === 0) {
      return { ...EMPTY_STATS, remainingAmount: plan.totalTarget };
    }
    return EMPTY_STATS;
  }

  let paidCount = 0;
  let partialCount = 0;
  let totalPaid = 0;
  let nextSlot: SavingsSlot | null = null;
  let partialBalance = 0;

  for (const slot of slots) {
    totalPaid = round2(totalPaid + slot.paidAmount);
    if (slot.status === 'FULLY_PAID') paidCount++;
    else if (slot.status === 'PARTIAL') partialCount++;
    if (!nextSlot && slot.status !== 'FULLY_PAID') {
      nextSlot = slot;
      if (slot.status === 'PARTIAL') partialBalance = slot.paidAmount;
    }
  }

  const remainingAmount = round2(Math.max(0, plan.totalTarget - totalPaid));
  const unpaidCount = slots.length - paidCount - partialCount;

  return {
    paidCount,
    partialCount,
    unpaidCount,
    totalPaid,
    remainingAmount,
    slotProgress: slots.length ? paidCount / slots.length : 0,
    amountProgress: plan.totalTarget ? totalPaid / plan.totalTarget : 0,
    nextSlot,
    partialBalance,
    isComplete: paidCount === slots.length && slots.length > 0,
  };
}

export interface CreatePlanResult {
  ok: boolean;
  error?: string;
  plan?: SavingsPlan;
}

@Injectable({ providedIn: 'root' })
export class SavingsPlanService {
  readonly store = inject(SavingsStoreService);

  readonly plans = this.store.plans;
  readonly slots = this.store.slots;
  readonly slotsByPlan = this.store.slotsByPlan;

  readonly activePlans = computed(() =>
    this.plans().filter((plan) => plan.status === 'ACTIVE'),
  );
  readonly completedPlans = computed(() =>
    this.plans().filter((plan) => plan.status === 'COMPLETED'),
  );
  readonly pausedPlans = computed(() =>
    this.plans().filter((plan) => plan.status === 'PAUSED'),
  );

  readonly statsByPlan = computed<Record<string, PlanStats>>(() => {
    const map: Record<string, PlanStats> = {};
    const grouped = this.slotsByPlan();
    for (const plan of this.plans()) {
      map[plan.id] = computePlanStats(plan, grouped[plan.id] ?? []);
    }
    return map;
  });

  planById(id: string): SavingsPlan | undefined {
    return this.store.plansById()[id];
  }

  slotsForPlan(planId: string): SavingsSlot[] {
    return this.store.slotsForPlan(planId);
  }

  getStats(planId: string): PlanStats {
    return this.statsByPlan()[planId] ?? EMPTY_STATS;
  }

  statsSignal(planId: string) {
    return computed(() => this.statsByPlan()[planId] ?? EMPTY_STATS);
  }

  createPlan(request: CreatePlanRequest): CreatePlanResult {
    const name = request.name.trim();
    if (name.length < 2) return { ok: false, error: 'Enter a plan name.' };

    const totalSlots = Math.floor(Number(request.totalSlots));
    if (!Number.isFinite(totalSlots) || totalSlots < 1 || totalSlots > 1000)
      return { ok: false, error: 'Number of slots must be between 1 and 1000.' };

    if (request.amountMode === 'fixed') {
      const perSlot = Number(request.amountPerSlot);
      if (!Number.isFinite(perSlot) || perSlot <= 0)
        return { ok: false, error: 'Amount per slot must be greater than zero.' };
    }

    const maxPayment =
      request.maxPayment && request.maxPayment > 0
        ? round2(request.maxPayment)
        : null;
    if (maxPayment !== null && maxPayment <= 0)
      return { ok: false, error: 'Maximum payment must be greater than zero.' };

    const id = createId('plan');
    const slots = buildSlots(
      id,
      request.type,
      totalSlots,
      request.amountMode,
      Number(request.amountPerSlot) || 0,
    );
    const totalTarget = sum(slots.map((slot) => slot.requiredAmount));

    const plan: SavingsPlan = {
      id,
      name,
      type: request.type,
      amountMode: request.amountMode,
      totalSlots,
      totalTarget,
      startDate: request.startDate,
      status: 'ACTIVE',
      autoAllocation: request.autoAllocation,
      maxPayment,
      createdAt: new Date().toISOString(),
    };

    this.store.addPlan(plan, slots);
    return { ok: true, plan };
  }

  setStatus(planId: string, status: SavingsPlan['status']): void {
    this.store.updatePlans((plans) =>
      plans.map((plan) => (plan.id === planId ? { ...plan, status } : plan)),
    );
  }

  updatePlan(planId: string, patch: Partial<SavingsPlan>): void {
    this.store.updatePlans((plans) =>
      plans.map((plan) => (plan.id === planId ? { ...plan, ...patch } : plan)),
    );
  }

  deletePlan(planId: string): void {
    this.store.updatePlans((plans) => plans.filter((plan) => plan.id !== planId));
    this.store.updateSlots((slots) => slots.filter((slot) => slot.planId !== planId));
    this.store.updatePayments((payments) =>
      payments.filter((payment) => payment.planId !== planId),
    );
  }

  resetPlan(planId: string): void {
    this.store.updateSlots((slots) =>
      slots.map((slot) =>
        slot.planId === planId
          ? { ...slot, paidAmount: 0, status: 'UNPAID', paidAt: null }
          : slot,
      ),
    );
    this.store.updatePayments((payments) =>
      payments.filter((payment) => payment.planId !== planId),
    );
    this.setStatus(planId, 'ACTIVE');
  }

  seedSamplePlans(): void {
    const samples: CreatePlanRequest[] = [
      {
        name: '365 Day Savings',
        type: 'daily',
        totalSlots: 365,
        amountMode: 'increasing',
        amountPerSlot: 0,
        startDate: new Date().toISOString().slice(0, 10),
        autoAllocation: true,
        maxPayment: null,
      },
      {
        name: 'Monthly Savings',
        type: 'monthly',
        totalSlots: 12,
        amountMode: 'fixed',
        amountPerSlot: 2000,
        startDate: new Date().toISOString().slice(0, 10),
        autoAllocation: true,
        maxPayment: null,
      },
      {
        name: 'Emergency Fund',
        type: 'custom',
        totalSlots: 50,
        amountMode: 'fixed',
        amountPerSlot: 1000,
        startDate: new Date().toISOString().slice(0, 10),
        autoAllocation: true,
        maxPayment: null,
      },
    ];

    const existing = new Set(this.plans().map((plan) => plan.name));
    for (const sample of samples) {
      if (!existing.has(sample.name)) this.createPlan(sample);
    }
  }
}
