import { Component, computed, input, signal } from '@angular/core';
import { AllocationPreview } from '../../../core/models/savings.models';
import { IconComponent } from '../icon/icon';
import { InrPipe } from '../../pipes/inr.pipe';

@Component({
  selector: 'app-payment-preview',
  standalone: true,
  imports: [IconComponent, InrPipe],
  template: `
    @if (preview(); as data) {
      <section class="card preview-card">
        <header class="preview-head">
          <div>
            <p class="preview-kicker">Live allocation preview</p>
            <h3 class="preview-title">{{ data.requestedAmount | inr }} payment</h3>
          </div>
          <span class="preview-plan">{{ data.planName }}</span>
        </header>

        @if (data.lines.length === 0) {
          <p class="preview-empty">
            Enter an amount to see how it will be distributed across your savings slots.
          </p>
        } @else {
          <ul class="alloc-list">
            @for (line of visibleLines(); track line.slotId) {
              <li [class]="'alloc-line status-' + line.status.toLowerCase()">
                <span class="alloc-label">{{ line.label }}</span>
                <span class="alloc-amount">{{ line.amountAllocated | inr }}</span>
                <span class="alloc-status">
                  @if (line.status === 'FULLY_PAID') {
                    FULL
                  } @else {
                    {{ line.newPaidAmount | inr }}/{{ line.requiredAmount | inr }}
                  }
                </span>
              </li>
            }
          </ul>
          @if (hiddenLineCount() > 0) {
            <button type="button" class="link-more" (click)="expanded.set(true)">
              + {{ hiddenLineCount() }} more slot(s)
            </button>
          }
        }

        <div class="preview-stats">
          <div class="pstat">
            <span class="pstat-value">{{ data.slotsFullyCovered }}</span>
            <span class="pstat-label">Slots fully covered</span>
          </div>
          <div class="pstat">
            <span class="pstat-value">{{ data.partialSlot ? data.partialSlot.label : '—' }}</span>
            <span class="pstat-label">Partial slot</span>
          </div>
          <div class="pstat">
            <span class="pstat-value success">{{ data.allocatedAmount | inr }}</span>
            <span class="pstat-label">Allocated</span>
          </div>
          <div class="pstat">
            <span class="pstat-value" [class.warn]="data.leftoverAmount > 0">
              {{ data.leftoverAmount | inr }}
            </span>
            <span class="pstat-label">Remaining payment</span>
          </div>
        </div>

        @if (data.leftoverAmount > 0) {
          <p class="leftover-note">
            <app-icon [name]="leftoverIcon()" [size]="16" />
            <span>{{ leftoverMessage() }}</span>
          </p>
        }

        <div class="preview-footer">
          <span>Paid count after payment</span>
          <strong>{{ data.paidCountAfter }} / {{ data.totalSlots }}</strong>
        </div>
      </section>
    }
  `,
  styles: `
    .preview-card { display: flex; flex-direction: column; gap: 0.9rem; }
    .preview-head {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 0.75rem; flex-wrap: wrap;
    }
    .preview-kicker {
      margin: 0; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em;
      text-transform: uppercase; color: var(--primary);
    }
    .preview-title { margin: 0.15rem 0 0; font-size: 1.35rem; font-weight: 800; color: var(--navy); }
    .preview-plan {
      font-size: 0.75rem; font-weight: 700; color: var(--blue-deep);
      background: var(--blue-soft); padding: 0.3rem 0.65rem; border-radius: 999px;
    }
    .preview-empty { margin: 0; color: var(--muted); font-size: 0.9rem; }
    .alloc-list {
      list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column;
      gap: 0.4rem; max-height: 240px; overflow: auto;
    }
    .alloc-line {
      display: grid; grid-template-columns: 1fr auto auto; gap: 0.75rem;
      align-items: center; background: var(--gray-100); border-radius: 10px;
      padding: 0.55rem 0.75rem; font-size: 0.88rem;
    }
    .alloc-line.status-fully_paid { background: rgba(4, 120, 87, 0.08); }
    .alloc-line.status-partial { background: rgba(245, 158, 11, 0.12); }
    .alloc-label { font-weight: 700; color: var(--navy); }
    .alloc-amount { font-weight: 800; color: var(--primary-deep); font-variant-numeric: tabular-nums; }
    .alloc-status { font-size: 0.72rem; font-weight: 700; color: var(--muted); text-align: right; }
    .link-more {
      border: 0; background: transparent; color: var(--primary); font-weight: 700;
      cursor: pointer; padding: 0.35rem 0; font-size: 0.85rem; font-family: inherit;
    }
    .preview-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
    .pstat {
      background: var(--gray-100); border-radius: 12px; padding: 0.65rem 0.75rem;
      display: flex; flex-direction: column; gap: 0.15rem;
    }
    .pstat-value {
      font-weight: 800; color: var(--navy); font-size: 1rem; font-variant-numeric: tabular-nums;
    }
    .pstat-value.success { color: var(--primary-deep); }
    .pstat-value.warn { color: var(--warning-deep); }
    .pstat-label {
      font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em;
      color: var(--muted); font-weight: 600;
    }
    .leftover-note {
      margin: 0; display: flex; gap: 0.5rem; align-items: flex-start;
      background: var(--gold-soft); color: var(--gold-deep); border-radius: 12px;
      padding: 0.7rem 0.8rem; font-size: 0.85rem; font-weight: 600;
    }
    .preview-footer {
      display: flex; justify-content: space-between; align-items: center;
      border-top: 1px dashed var(--gray-200); padding-top: 0.75rem;
      font-size: 0.9rem; color: var(--muted); font-weight: 600;
    }
    .preview-footer strong { color: var(--navy); font-size: 1.05rem; }
    @media (min-width: 640px) {
      .preview-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
  `,
})
export class PaymentPreviewComponent {
  readonly preview = input<AllocationPreview | null>(null);

  readonly expanded = signal(false);

  readonly visibleLines = computed(() => {
    const data = this.preview();
    if (!data) return [];
    return this.expanded() ? data.lines : data.lines.slice(0, 8);
  });

  readonly hiddenLineCount = computed(() => {
    const data = this.preview();
    if (!data) return 0;
    return Math.max(0, data.lines.length - 8);
  });

  readonly leftoverIcon = computed(() =>
    this.preview()?.leftoverReason === 'plan-complete' ? 'gift' : 'info',
  );

  readonly leftoverMessage = computed(() => {
    const data = this.preview();
    if (!data || data.leftoverAmount <= 0) return '';
    if (data.leftoverReason === 'plan-complete')
      return `Plan already complete. Extra ₹${data.leftoverAmount} is recorded separately and does not change Paid Count.`;
    if (data.leftoverReason === 'auto-allocation-off')
      return `Auto allocation is off, so only one slot was covered. ₹${data.leftoverAmount} of this payment stays unallocated.`;
    return `₹${data.leftoverAmount} could not be allocated.`;
  });
}
