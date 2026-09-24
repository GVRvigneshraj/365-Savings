import { Component, computed, input, output } from '@angular/core';
import { PlanStats, SavingsPlan } from '../../../core/models/savings.models';
import { IconComponent } from '../icon/icon';
import { InrPipe } from '../../pipes/inr.pipe';

@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [IconComponent, InrPipe],
  template: `
    <article class="card plan-card">
      <header class="plan-head">
        <div class="plan-title-wrap">
          <span class="plan-icon">
            <app-icon [name]="typeIcon()" [size]="18" />
          </span>
          <div>
            <h3 class="plan-name">{{ plan().name }}</h3>
            <p class="plan-type">{{ typeLabel() }}</p>
          </div>
        </div>
        <span class="badge" [class]="statusClass()">{{ plan().status }}</span>
      </header>

      <div class="plan-counts">
        <div>
          <span class="count-value">{{ stats().paidCount }} / {{ plan().totalSlots }}</span>
          <span class="count-label">Paid slots</span>
        </div>
        <div class="count-right">
          <span class="count-value">{{ stats().totalPaid | inr }} / {{ plan().totalTarget | inr }}</span>
          <span class="count-label">Saved / target</span>
        </div>
      </div>

      <div class="progress">
        <div
          class="progress-bar"
          [style.width.%]="stats().slotProgress * 100"
          [class.complete]="stats().isComplete"
        ></div>
      </div>

      <footer class="plan-actions">
        <span class="progress-text">
          {{ percentText() }} complete
          @if (stats().partialCount) {
            <span class="partial-note"> · {{ stats().partialCount }} partial</span>
          }
        </span>
        <div class="action-buttons">
          <button type="button" class="btn btn-ghost btn-sm" (click)="view.emit()">
            View
          </button>
          @if (plan().status !== 'COMPLETED') {
            <button type="button" class="btn btn-primary btn-sm" (click)="pay.emit()">
              Pay
            </button>
          } @else {
            <button type="button" class="btn btn-soft btn-sm" (click)="view.emit()">
              <app-icon name="award" [size]="15" /> Done
            </button>
          }
        </div>
      </footer>
    </article>
  `,
  styles: `
    .plan-card { display: flex; flex-direction: column; gap: 0.9rem; }
    .plan-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
    .plan-title-wrap { display: flex; gap: 0.7rem; align-items: center; min-width: 0; }
    .plan-icon {
      width: 38px; height: 38px; border-radius: 12px; display: inline-flex;
      align-items: center; justify-content: center; background: var(--mint-soft);
      color: var(--primary); flex-shrink: 0;
    }
    .plan-name { margin: 0; font-size: 1rem; font-weight: 700; color: var(--navy); }
    .plan-type { margin: 0.1rem 0 0; font-size: 0.78rem; color: var(--muted); }
    .plan-counts { display: flex; justify-content: space-between; gap: 1rem; }
    .plan-counts > div { display: flex; flex-direction: column; gap: 0.15rem; }
    .count-right { text-align: right; align-items: flex-end; }
    .count-value { font-weight: 800; color: var(--navy); font-size: 0.98rem; font-variant-numeric: tabular-nums; }
    .count-label { font-size: 0.72rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
    .progress-text { font-size: 0.8rem; color: var(--muted); font-weight: 600; }
    .partial-note { color: var(--warning-deep); }
    .plan-actions { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
    .action-buttons { display: flex; gap: 0.5rem; }
  `,
})
export class PlanCardComponent {
  readonly plan = input.required<SavingsPlan>();
  readonly stats = input.required<PlanStats>();

  readonly view = output<void>();
  readonly pay = output<void>();

  readonly typeIcon = computed(() => {
    const map: Record<string, string> = {
      daily: 'calendar',
      weekly: 'refresh',
      monthly: 'layers',
      custom: 'target',
    };
    return map[this.plan().type] ?? 'target';
  });

  readonly typeLabel = computed(() => {
    const plan = this.plan();
    const base: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      custom: 'Custom',
    };
    const mode = plan.amountMode === 'increasing' ? ' · Increasing' : ' · Fixed';
    return `${base[plan.type] ?? plan.type}${mode}`;
  });

  readonly statusClass = computed(() => {
    const status = this.plan().status;
    if (status === 'COMPLETED') return 'badge badge-green';
    if (status === 'PAUSED') return 'badge badge-yellow';
    return 'badge badge-blue';
  });

  readonly percentText = computed(() => `${(this.stats().slotProgress * 100).toFixed(1)}%`);
}
