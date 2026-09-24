import { TestBed } from '@angular/core/testing';
import { PaymentAllocationService } from './payment-allocation.service';
import { SavingsPlanService } from './savings-plan.service';
import { SavingsStoreService } from './savings-store.service';
import { SettingsService } from './settings.service';
import { runAllocation } from './payment-allocation.service';
import { SavingsSlot } from '../models/savings.models';

function makeIncreasingSlots(planId: string, count: number): SavingsSlot[] {
  return Array.from({ length: count }, (_, index) => {
    const slotNumber = index + 1;
    return {
      id: `${planId}_s${slotNumber}`,
      planId,
      slotNumber,
      label: `Day ${slotNumber}`,
      requiredAmount: slotNumber,
      paidAmount: 0,
      status: 'UNPAID' as const,
      paidAt: null,
    };
  });
}

describe('PaymentAllocationService', () => {
  let service: PaymentAllocationService;
  let planService: SavingsPlanService;
  let store: SavingsStoreService;
  let settings: SettingsService;
  let plan365Id: string;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaymentAllocationService);
    planService = TestBed.inject(SavingsPlanService);
    store = TestBed.inject(SavingsStoreService);
    settings = TestBed.inject(SettingsService);

    settings.update({ autoAllocation: true, paymentConfirmation: false, notifications: false });

    const created = planService.createPlan({
      name: '365 Day Savings',
      type: 'daily',
      totalSlots: 365,
      amountMode: 'increasing',
      amountPerSlot: 0,
      startDate: '2026-01-01',
      autoAllocation: true,
      maxPayment: null,
    });
    plan365Id = created.plan!.id;
  });

  function slots(): SavingsSlot[] {
    return store.slotsForPlan(plan365Id);
  }

  function stats() {
    return planService.getStats(plan365Id);
  }

  function slot(number: number): SavingsSlot {
    return slots().find((item) => item.slotNumber === number)!;
  }

  it('creates a fresh 365 plan with target ₹66,795', () => {
    const plan = planService.planById(plan365Id)!;
    expect(plan.totalSlots).toBe(365);
    expect(plan.totalTarget).toBe(66795);
    expect(stats().paidCount).toBe(0);
    expect(slot(1).requiredAmount).toBe(1);
    expect(slot(365).requiredAmount).toBe(365);
  });

  it('1. ₹1 payment fully pays Day 1', () => {
    const result = service.allocatePayment(plan365Id, 1);
    expect(result.success).toBe(true);
    expect(slot(1).status).toBe('FULLY_PAID');
    expect(slot(1).paidAmount).toBe(1);
    expect(slot(2).status).toBe('UNPAID');
    expect(stats().paidCount).toBe(1);
    expect(stats().totalPaid).toBe(1);
  });

  it('2. ₹5 payment pays Days 1–2 fully and leaves Day 3 partial', () => {
    service.allocatePayment(plan365Id, 5);
    expect(slot(1).status).toBe('FULLY_PAID');
    expect(slot(2).status).toBe('FULLY_PAID');
    expect(slot(3).status).toBe('PARTIAL');
    expect(slot(3).paidAmount).toBe(2);
    expect(slot(3).requiredAmount).toBe(3);
    expect(stats().paidCount).toBe(2);
    expect(stats().partialCount).toBe(1);
    expect(stats().totalPaid).toBe(5);
  });

  it('3. ₹10 payment pays Days 1–4 fully (1+2+3+4)', () => {
    service.allocatePayment(plan365Id, 10);
    expect(stats().paidCount).toBe(4);
    expect(slot(4).status).toBe('FULLY_PAID');
    expect(slot(5).status).toBe('UNPAID');
    expect(stats().totalPaid).toBe(10);
  });

  it('4. ₹31 payment pays Days 1–7 and puts ₹3 into Day 8', () => {
    service.allocatePayment(plan365Id, 31);
    expect(stats().paidCount).toBe(7);
    expect(slot(7).status).toBe('FULLY_PAID');
    expect(slot(8).status).toBe('PARTIAL');
    expect(slot(8).paidAmount).toBe(3);
    expect(stats().totalPaid).toBe(31);
  });

  it('5. ₹32 payment pays Days 1–7 and puts ₹4 into Day 8', () => {
    service.allocatePayment(plan365Id, 32);
    expect(stats().paidCount).toBe(7);
    expect(slot(8).status).toBe('PARTIAL');
    expect(slot(8).paidAmount).toBe(4);
    expect(stats().totalPaid).toBe(32);
  });

  it('6. ₹100 payment pays Days 1–13 and puts ₹9 into Day 14', () => {
    service.allocatePayment(plan365Id, 100);
    expect(stats().paidCount).toBe(13);
    expect(slot(13).status).toBe('FULLY_PAID');
    expect(slot(14).status).toBe('PARTIAL');
    expect(slot(14).paidAmount).toBe(9);
    expect(stats().totalPaid).toBe(100);
  });

  it('7. ₹496 payment exactly completes Days 1–31 with no partial slot', () => {
    service.allocatePayment(plan365Id, 496);
    expect(stats().paidCount).toBe(31);
    expect(stats().partialCount).toBe(0);
    expect(slot(31).status).toBe('FULLY_PAID');
    expect(slot(32).status).toBe('UNPAID');
    expect(stats().totalPaid).toBe(496);
  });

  it('8. CRITICAL: ₹500 pays Days 1–31 fully with ₹4 partial on Day 32', () => {
    const result = service.allocatePayment(plan365Id, 500);
    expect(result.success).toBe(true);

    // Days 1..31 = 496 → fully paid
    for (let day = 1; day <= 31; day++) {
      expect(slot(day).status).toBe('FULLY_PAID');
      expect(slot(day).paidAmount).toBe(day);
    }

    // Day 32 partial with remaining ₹28
    expect(slot(32).status).toBe('PARTIAL');
    expect(slot(32).paidAmount).toBe(4);
    expect(slot(32).requiredAmount).toBe(32);
    expect(slot(32).requiredAmount - slot(32).paidAmount).toBe(28);

    expect(stats().paidCount).toBe(31);
    expect(stats().partialCount).toBe(1);
    expect(stats().totalPaid).toBe(500);
    expect(stats().remainingAmount).toBe(66795 - 500);
    expect(stats().nextSlot?.slotNumber).toBe(32);

    // Follow-up payment of ₹28 completes Day 32
    const followUp = service.allocatePayment(plan365Id, 28);
    expect(followUp.success).toBe(true);
    expect(slot(32).status).toBe('FULLY_PAID');
    expect(slot(32).paidAmount).toBe(32);
    expect(stats().paidCount).toBe(32);
    expect(stats().totalPaid).toBe(528);
  });

  it('9. ₹1,000 payment pays Days 1–44 and puts ₹10 into Day 45', () => {
    service.allocatePayment(plan365Id, 1000);
    expect(stats().paidCount).toBe(44);
    expect(slot(44).status).toBe('FULLY_PAID');
    expect(slot(45).status).toBe('PARTIAL');
    expect(slot(45).paidAmount).toBe(10);
    expect(stats().totalPaid).toBe(1000);
  });

  it('10. partial payment leaves a PARTIAL slot and correct remaining for it', () => {
    service.allocatePayment(plan365Id, 4);
    expect(stats().paidCount).toBe(2);
    expect(stats().partialCount).toBe(1);
    expect(slot(3).status).toBe('PARTIAL');
    expect(slot(3).paidAmount).toBe(1);
    expect(slot(3).requiredAmount - slot(3).paidAmount).toBe(2);
  });

  it('11. multiple slot allocation: ₹500 covers 31 full slots + 1 partial (32 allocations)', () => {
    const preview = service.preview(plan365Id, 500)!;
    expect(preview.lines.length).toBe(32);
    expect(preview.slotsFullyCovered).toBe(31);
    expect(preview.partialSlot?.slotNumber).toBe(32);
    expect(preview.allocatedAmount).toBe(500);
    expect(preview.leftoverAmount).toBe(0);
    expect(preview.paidCountAfter).toBe(31);

    // Preview must NOT mutate stored data
    expect(stats().paidCount).toBe(0);
    expect(stats().totalPaid).toBe(0);
  });

  it('12. completed plan: all slots fully paid marks plan COMPLETED', () => {
    const created = planService.createPlan({
      name: 'Quick 3 Slots',
      type: 'custom',
      totalSlots: 3,
      amountMode: 'fixed',
      amountPerSlot: 10,
      startDate: '2026-01-01',
      autoAllocation: true,
      maxPayment: null,
    });
    const planId = created.plan!.id;
    expect(created.plan!.totalTarget).toBe(30);

    const result = service.allocatePayment(planId, 30);
    expect(result.success).toBe(true);

    const statsAfter = planService.getStats(planId);
    expect(statsAfter.paidCount).toBe(3);
    expect(statsAfter.isComplete).toBe(true);
    expect(planService.planById(planId)!.status).toBe('COMPLETED');
    expect(result.data?.planCompleted).toBe(true);
  });

  it('13. payment limit: rejects amounts above the plan maximum', () => {
    const created = planService.createPlan({
      name: 'Limited Plan',
      type: 'custom',
      totalSlots: 10,
      amountMode: 'fixed',
      amountPerSlot: 100,
      startDate: '2026-01-01',
      autoAllocation: true,
      maxPayment: 100,
    });
    const planId = created.plan!.id;

    const rejected = service.allocatePayment(planId, 150);
    expect(rejected.success).toBe(false);
    expect(rejected.code).toBe('LIMIT_EXCEEDED');

    const accepted = service.allocatePayment(planId, 100);
    expect(accepted.success).toBe(true);
    expect(planService.getStats(planId).paidCount).toBe(1);
  });

  it('14. zero payment is rejected', () => {
    const result = service.allocatePayment(plan365Id, 0);
    expect(result.success).toBe(false);
    expect(result.code).toBe('ZERO_AMOUNT');
    expect(stats().paidCount).toBe(0);
  });

  it('15. negative payment is rejected', () => {
    const result = service.allocatePayment(plan365Id, -100);
    expect(result.success).toBe(false);
    expect(result.code).toBe('ZERO_AMOUNT');
    expect(stats().paidCount).toBe(0);
  });

  it('16. payment below ₹1 is rejected (minimum is ₹1)', () => {
    const result = service.allocatePayment(plan365Id, 0.5);
    expect(result.success).toBe(false);
    expect(result.code).toBe('MIN_AMOUNT');
    expect(stats().paidCount).toBe(0);
  });

  it('rejects invalid (NaN) payment amounts', () => {
    const result = service.allocatePayment(plan365Id, Number.NaN);
    expect(result.success).toBe(false);
    expect(result.code).toBe('INVALID_AMOUNT');
  });

  it('records payment history with allocations and slot counts', () => {
    service.allocatePayment(plan365Id, 500);
    const payments = store.payments();
    expect(payments.length).toBe(1);
    expect(payments[0].amount).toBe(500);
    expect(payments[0].allocatedAmount).toBe(500);
    expect(payments[0].slotsCompleted).toBe(31);
    expect(payments[0].allocations.length).toBe(32);
    expect(payments[0].status).toBe('COMPLETED');
  });

  it('persists plans, slots and payments to LocalStorage keys', () => {
    service.allocatePayment(plan365Id, 500);
    const storedPlans = JSON.parse(localStorage.getItem('savings_plans') ?? '[]');
    const storedSlots = JSON.parse(localStorage.getItem('savings_slots') ?? '[]');
    const storedPayments = JSON.parse(localStorage.getItem('savings_payments') ?? '[]');
    expect(storedPlans.length).toBe(1);
    expect(storedSlots.length).toBe(365);
    expect(storedPayments.length).toBe(1);
    expect(storedSlots.find((s: SavingsSlot) => s.slotNumber === 32).paidAmount).toBe(4);
  });

  it('works for monthly plans: ₹5,000 covers 2 months + 1 partial', () => {
    const created = planService.createPlan({
      name: 'Monthly Savings',
      type: 'monthly',
      totalSlots: 12,
      amountMode: 'fixed',
      amountPerSlot: 2000,
      startDate: '2026-01-01',
      autoAllocation: true,
      maxPayment: null,
    });
    const planId = created.plan!.id;
    expect(created.plan!.totalTarget).toBe(24000);

    service.allocatePayment(planId, 5000);
    const planSlots = store.slotsForPlan(planId);
    expect(planSlots[0].status).toBe('FULLY_PAID');
    expect(planSlots[1].status).toBe('FULLY_PAID');
    expect(planSlots[2].status).toBe('PARTIAL');
    expect(planSlots[2].paidAmount).toBe(1000);
    expect(planService.getStats(planId).paidCount).toBe(2);
  });

  it('records extra amount when paying a fully completed plan', () => {
    const created = planService.createPlan({
      name: 'Tiny Plan',
      type: 'custom',
      totalSlots: 2,
      amountMode: 'fixed',
      amountPerSlot: 50,
      startDate: '2026-01-01',
      autoAllocation: true,
      maxPayment: null,
    });
    const planId = created.plan!.id;
    service.allocatePayment(planId, 100);
    expect(planService.getStats(planId).isComplete).toBe(true);

    const extra = service.allocatePayment(planId, 40);
    expect(extra.success).toBe(true);
    const payment = store.payments()[store.payments().length - 1];
    expect(payment.extraAmount).toBe(40);
    expect(payment.allocatedAmount).toBe(0);
    expect(payment.status).toBe('PARTIAL');
    // Paid Count unchanged by extra money
    expect(planService.getStats(planId).paidCount).toBe(2);
  });

  it('auto allocation OFF covers only one slot per payment', () => {
    settings.update({ autoAllocation: false });
    const result = service.allocatePayment(plan365Id, 500);
    expect(result.success).toBe(true);
    expect(slot(1).status).toBe('FULLY_PAID');
    expect(slot(2).status).toBe('UNPAID');
    expect(stats().paidCount).toBe(1);
    const payment = store.payments()[0];
    expect(payment.allocatedAmount).toBe(1);
    expect(payment.extraAmount).toBe(499);
    settings.update({ autoAllocation: true });
  });

  it('never uses calendar dates to mark slots as paid', () => {
    // Even if start date is long in the past, no slot is paid without payment
    const plan = planService.planById(plan365Id)!;
    expect(plan.startDate).toBe('2026-01-01');
    expect(stats().paidCount).toBe(0);
    for (const item of slots()) {
      expect(item.status).toBe('UNPAID');
      expect(item.paidAt).toBeNull();
    }
  });
});

describe('runAllocation (pure engine)', () => {
  it('allocates sequentially and stops when money runs out', () => {
    const slots = makeIncreasingSlots('p1', 365);
    const outcome = runAllocation(slots, 500, true);
    expect(outcome.slotsFullyCovered).toBe(31);
    expect(outcome.allocatedAmount).toBe(500);
    expect(outcome.leftoverAmount).toBe(0);
    expect(outcome.lines[outcome.lines.length - 1].slotNumber).toBe(32);
    expect(outcome.lines[outcome.lines.length - 1].newPaidAmount).toBe(4);
  });

  it('does not mutate input slots', () => {
    const slots = makeIncreasingSlots('p2', 10);
    runAllocation(slots, 55, true);
    expect(slots.every((item) => item.paidAmount === 0)).toBe(true);
    expect(slots.every((item) => item.status === 'UNPAID')).toBe(true);
  });

  it('handles exact sum boundary (₹15 = 1+2+3+4+5)', () => {
    const slots = makeIncreasingSlots('p3', 10);
    const outcome = runAllocation(slots, 15, true);
    expect(outcome.slotsFullyCovered).toBe(5);
    expect(outcome.leftoverAmount).toBe(0);
    expect(outcome.partialSlot).toBeNull();
  });
});
