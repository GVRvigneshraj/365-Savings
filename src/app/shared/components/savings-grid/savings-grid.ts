import { Component, computed, inject, input, output } from '@angular/core';
import { SavingsSlot } from '../../../core/models/savings.models';
import { SavingsPlanService } from '../../../core/services/savings-plan.service';

@Component({
  selector: 'app-savings-grid',
  standalone: true,
  template: `
    <div class="grid-legend">
      <span><i class="dot dot-paid"></i> Paid</span>
      <span><i class="dot dot-partial"></i> Partial</span>
      <span><i class="dot dot-unpaid"></i> Unpaid</span>
      <span><i class="dot dot-next"></i> Next</span>
    </div>

    <div class="savings-grid" role="list" [attr.aria-label]="'Savings slots for ' + planName()">
      @for (slot of slots(); track slot.id) {
        <button
          type="button"
          role="listitem"
          class="slot"
          [class.slot-paid]="slot.status === 'FULLY_PAID'"
          [class.slot-partial]="slot.status === 'PARTIAL'"
          [class.slot-unpaid]="slot.status === 'UNPAID'"
          [class.slot-next]="slot.id === nextSlotId()"
          [class.slot-selected]="slot.id === selectedId()"
          [attr.aria-label]="ariaLabel(slot)"
          [title]="titleFor(slot)"
          (click)="slotSelect.emit(slot)"
        >
          <span class="slot-num">{{ slot.slotNumber }}</span>
          <span class="slot-amt">₹{{ slot.requiredAmount }}</span>
        </button>
      }
    </div>
  `,
  styles: `
    .grid-legend {
      display: flex; flex-wrap: wrap; gap: 0.75rem 1.1rem; margin-bottom: 0.9rem;
      font-size: 0.78rem; font-weight: 600; color: var(--muted);
    }
    .grid-legend span { display: inline-flex; align-items: center; gap: 0.4rem; }
    .dot { width: 11px; height: 11px; border-radius: 4px; display: inline-block; }
    .dot-paid { background: var(--primary); }
    .dot-partial { background: var(--warning); }
    .dot-unpaid { background: var(--gray-200); border: 1px solid var(--gray-300); }
    .dot-next { background: var(--blue); box-shadow: 0 0 0 2px var(--blue-soft); }
    .savings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
      gap: 8px;
    }
    .slot {
      aspect-ratio: 1; min-height: 48px; border-radius: 12px; border: 1.5px solid transparent;
      font-weight: 700; font-size: 0.82rem; cursor: pointer; font-variant-numeric: tabular-nums;
      transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 0.05rem; padding: 0.2rem 0.1rem; font-family: inherit;
    }
    .slot-num { font-size: 0.78rem; line-height: 1.1; }
    .slot-amt { font-size: 0.56rem; font-weight: 700; opacity: 0.85; line-height: 1.1; }
    .slot:hover { transform: translateY(-2px); }
    .slot:active { transform: scale(0.96); }
    .slot-paid { background: var(--primary); color: #fff; box-shadow: 0 4px 10px rgba(4, 120, 87, 0.22); }
    .slot-partial { background: var(--warning-soft); color: var(--warning-deep); border-color: var(--warning); }
    .slot-unpaid { background: var(--gray-100); color: var(--gray-500); border-color: var(--gray-200); }
    .slot-next { box-shadow: 0 0 0 3px var(--blue-soft); border-color: var(--blue); }
    .slot-paid.slot-next { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.35); }
    .slot-selected { outline: 2px solid var(--navy); outline-offset: 2px; }
    @media (min-width: 768px) {
      .savings-grid { grid-template-columns: repeat(auto-fill, minmax(56px, 1fr)); gap: 10px; }
      .slot { min-height: 56px; font-size: 0.9rem; }
      .slot-num { font-size: 0.84rem; }
      .slot-amt { font-size: 0.6rem; }
    }
  `,
})
export class SavingsGridComponent {
  private readonly planService = inject(SavingsPlanService);

  readonly planId = input.required<string>();
  readonly selectedId = input<string | null>(null);
  readonly slotSelect = output<SavingsSlot>();

  readonly slots = computed(() => this.planService.slotsForPlan(this.planId()));
  readonly stats = computed(() => this.planService.getStats(this.planId()));
  readonly planName = computed(
    () => this.planService.planById(this.planId())?.name ?? 'Savings plan',
  );
  readonly nextSlotId = computed(() => this.stats().nextSlot?.id ?? null);

  ariaLabel(slot: SavingsSlot): string {
    return `${slot.label}, required ₹${slot.requiredAmount}, paid ₹${slot.paidAmount}, status ${slot.status}`;
  }

  titleFor(slot: SavingsSlot): string {
    const remaining = Math.max(0, slot.requiredAmount - slot.paidAmount);
    return `${slot.label} · ₹${slot.paidAmount}/₹${slot.requiredAmount} · remaining ₹${remaining}`;
  }
}
