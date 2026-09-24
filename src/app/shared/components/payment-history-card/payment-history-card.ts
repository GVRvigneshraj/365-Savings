import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { Payment } from '../../../core/models/savings.models';
import { IconComponent } from '../icon/icon';
import { InrPipe } from '../../pipes/inr.pipe';

@Component({
  selector: 'app-payment-history-card',
  standalone: true,
  imports: [IconComponent, InrPipe, DatePipe],
  template: `
    <article class="card history-card">
      <button type="button" class="history-main" (click)="expanded = !expanded">
        <span class="history-icon" [class.partial]="payment().status === 'PARTIAL'">
          <app-icon [name]="payment().status === 'COMPLETED' ? 'check' : 'clock'" [size]="18" />
        </span>
        <span class="history-info">
          <span class="history-amount">{{ payment().amount | inr }}</span>
          <span class="history-meta">{{ payment().date | date: 'dd MMM yyyy' }} · {{ payment().planName }}</span>
        </span>
        <span class="history-right">
          <span class="badge" [class]="payment().status === 'COMPLETED' ? 'badge badge-green' : 'badge badge-yellow'">
            {{ payment().status === 'COMPLETED' ? 'Completed' : 'Partial' }}
          </span>
          @if (payment().allocations.length) {
            <app-icon [name]="expanded ? 'chevron-down' : 'chevron-right'" [size]="16" />
          }
        </span>
      </button>

      @if (expanded && payment().allocations.length) {
        <div class="alloc-panel">
          <p class="alloc-title">
            Allocation · {{ payment().slotsCompleted }} slot(s) completed
            @if (payment().allocatedAmount !== payment().amount) {
              · Allocated {{ payment().allocatedAmount | inr }}
            }
          </p>
          <ul>
            @for (alloc of payment().allocations; track alloc.slotId) {
              <li>
                <span>Slot #{{ alloc.slotNumber }}</span>
                <span class="alloc-amt">{{ alloc.amountAllocated | inr }}</span>
                <span class="alloc-status" [class.full]="alloc.status === 'FULLY_PAID'">
                  {{ alloc.status === 'FULLY_PAID' ? 'FULL' : 'PARTIAL' }}
                </span>
              </li>
            }
          </ul>
          @if (payment().extraAmount > 0) {
            <p class="extra-note">Extra / unallocated: {{ payment().extraAmount | inr }}</p>
          }
        </div>
      }
    </article>
  `,
  styles: `
    .history-card { padding: 0; overflow: hidden; }
    .history-main {
      width: 100%; display: flex; align-items: center; gap: 0.8rem;
      padding: 0.95rem 1rem; background: transparent; border: 0; cursor: pointer;
      font-family: inherit; text-align: left;
    }
    .history-main:hover { background: var(--gray-100); }
    .history-icon {
      width: 38px; height: 38px; border-radius: 12px; display: inline-flex;
      align-items: center; justify-content: center; background: var(--mint-soft);
      color: var(--primary); flex-shrink: 0;
    }
    .history-icon.partial { background: var(--warning-soft); color: var(--warning-deep); }
    .history-info { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; flex: 1; }
    .history-amount { font-weight: 800; color: var(--navy); font-size: 1.05rem; font-variant-numeric: tabular-nums; }
    .history-meta { font-size: 0.8rem; color: var(--muted); }
    .history-right { display: flex; align-items: center; gap: 0.5rem; color: var(--muted); }
    .alloc-panel { border-top: 1px solid var(--gray-200); background: var(--gray-50); padding: 0.85rem 1rem 1rem; }
    .alloc-title { margin: 0 0 0.5rem; font-size: 0.78rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .alloc-panel ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
    .alloc-panel li {
      display: grid; grid-template-columns: 1fr auto auto; gap: 0.75rem;
      font-size: 0.87rem; color: var(--navy); font-weight: 600;
      background: #fff; border-radius: 8px; padding: 0.45rem 0.65rem;
    }
    .alloc-amt { font-weight: 800; color: var(--primary-deep); }
    .alloc-status { font-size: 0.7rem; font-weight: 800; color: var(--warning-deep); }
    .alloc-status.full { color: var(--primary); }
    .extra-note { margin: 0.6rem 0 0; font-size: 0.82rem; color: var(--gold-deep); font-weight: 700; }
  `,
})
export class PaymentHistoryCardComponent {
  readonly payment = input.required<Payment>();
  expanded = false;
}
