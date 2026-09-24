import { Injectable, computed, inject, signal } from '@angular/core';
import {
  AppSettings,
  AuthUser,
  Payment,
  SavingsPlan,
  SavingsSlot,
} from '../models/savings.models';
import { LocalStorageService, STORAGE_KEYS } from './local-storage.service';

@Injectable({ providedIn: 'root' })
export class SavingsStoreService {
  private readonly storage = inject(LocalStorageService);

  private readonly plansState = signal<SavingsPlan[]>(
    this.storage.get<SavingsPlan[]>(STORAGE_KEYS.plans, []),
  );
  private readonly slotsState = signal<SavingsSlot[]>(
    this.storage.get<SavingsSlot[]>(STORAGE_KEYS.slots, []),
  );
  private readonly paymentsState = signal<Payment[]>(
    this.storage.get<Payment[]>(STORAGE_KEYS.payments, []),
  );

  readonly plans = this.plansState.asReadonly();
  readonly slots = this.slotsState.asReadonly();
  readonly payments = this.paymentsState.asReadonly();

  readonly plansById = computed<Record<string, SavingsPlan>>(() => {
    const map: Record<string, SavingsPlan> = {};
    for (const plan of this.plansState()) map[plan.id] = plan;
    return map;
  });

  readonly slotsByPlan = computed<Record<string, SavingsSlot[]>>(() => {
    const map: Record<string, SavingsSlot[]> = {};
    for (const slot of this.slotsState()) {
      (map[slot.planId] ??= []).push(slot);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.slotNumber - b.slotNumber);
    }
    return map;
  });

  slotsForPlan(planId: string): SavingsSlot[] {
    return this.slotsByPlan()[planId] ?? [];
  }

  updatePlans(updater: (plans: SavingsPlan[]) => SavingsPlan[]): void {
    this.plansState.update(updater);
    this.storage.set(STORAGE_KEYS.plans, this.plansState());
  }

  updateSlots(updater: (slots: SavingsSlot[]) => SavingsSlot[]): void {
    this.slotsState.update(updater);
    this.storage.set(STORAGE_KEYS.slots, this.slotsState());
  }

  updatePayments(updater: (payments: Payment[]) => Payment[]): void {
    this.paymentsState.update(updater);
    this.storage.set(STORAGE_KEYS.payments, this.paymentsState());
  }

  addPlan(plan: SavingsPlan, slots: SavingsSlot[]): void {
    this.plansState.update((plans) => [...plans, plan]);
    this.slotsState.update((all) => [...all, ...slots]);
    this.persistPlans();
    this.persistSlots();
  }

  commitAllocation(payload: {
    slots: SavingsSlot[];
    plan: SavingsPlan;
    payment: Payment;
  }): void {
    const slotIds = new Set(payload.slots.map((slot) => slot.id));
    this.slotsState.update((all) =>
      all.map((slot) => {
        const updated = payload.slots.find((item) => item.id === slot.id);
        return updated && slotIds.has(slot.id) ? updated : slot;
      }),
    );
    this.plansState.update((plans) =>
      plans.map((plan) => (plan.id === payload.plan.id ? payload.plan : plan)),
    );
    this.paymentsState.update((payments) => [...payments, payload.payment]);
    this.persistSlots();
    this.persistPlans();
    this.persistPayments();
  }

  replaceAll(data: {
    plans?: SavingsPlan[];
    slots?: SavingsSlot[];
    payments?: Payment[];
    settings?: AppSettings;
    user?: AuthUser | null;
  }): void {
    if (data.plans) {
      this.plansState.set(data.plans);
      this.storage.set(STORAGE_KEYS.plans, data.plans);
    }
    if (data.slots) {
      this.slotsState.set(data.slots);
      this.storage.set(STORAGE_KEYS.slots, data.slots);
    }
    if (data.payments) {
      this.paymentsState.set(data.payments);
      this.storage.set(STORAGE_KEYS.payments, data.payments);
    }
    if (data.settings) this.storage.set(STORAGE_KEYS.settings, data.settings);
    if (data.user !== undefined) this.storage.set(STORAGE_KEYS.user, data.user);
  }

  clearSavingsData(): void {
    this.plansState.set([]);
    this.slotsState.set([]);
    this.paymentsState.set([]);
    this.persistPlans();
    this.persistSlots();
    this.persistPayments();
  }

  private persistPlans(): void {
    this.storage.set(STORAGE_KEYS.plans, this.plansState());
  }

  private persistSlots(): void {
    this.storage.set(STORAGE_KEYS.slots, this.slotsState());
  }

  private persistPayments(): void {
    this.storage.set(STORAGE_KEYS.payments, this.paymentsState());
  }
}
