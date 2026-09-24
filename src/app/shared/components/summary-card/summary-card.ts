import { Component, input } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [IconComponent],
  template: `
    <article class="card summary-card" [class]="'card summary-card tone-' + tone()">
      <div class="summary-top">
        <span class="summary-icon" [class]="'summary-icon tone-' + tone()">
          <app-icon [name]="icon()" [size]="18" />
        </span>
        <span class="summary-label">{{ label() }}</span>
      </div>
      <p class="summary-value">{{ value() }}</p>
      @if (sub(); as sub) {
        <p class="summary-sub">{{ sub }}</p>
      }
    </article>
  `,
  styles: `
    .summary-card { display: flex; flex-direction: column; gap: 0.45rem; }
    .summary-top { display: flex; align-items: center; gap: 0.55rem; }
    .summary-icon {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: 10px;
      background: var(--mint-soft); color: var(--primary);
    }
    .summary-icon.tone-gold { background: var(--gold-soft); color: var(--gold-deep); }
    .summary-icon.tone-blue { background: var(--blue-soft); color: var(--blue-deep); }
    .summary-icon.tone-navy { background: var(--navy-soft); color: var(--navy); }
    .summary-label {
      font-size: 0.78rem; font-weight: 600; letter-spacing: 0.04em;
      text-transform: uppercase; color: var(--muted);
    }
    .summary-value {
      font-size: clamp(1.5rem, 3vw, 1.9rem); font-weight: 800;
      color: var(--navy); letter-spacing: -0.02em; line-height: 1.1; margin: 0;
      font-variant-numeric: tabular-nums;
    }
    .summary-sub { margin: 0; font-size: 0.84rem; color: var(--muted); }
    .tone-green .summary-value { color: var(--primary-deep); }
    .tone-gold .summary-value { color: var(--gold-deep); }
    .tone-blue .summary-value { color: var(--blue-deep); }
  `,
})
export class SummaryCardComponent {
  readonly label = input<string>('');
  readonly value = input<string | number>('');
  readonly sub = input<string | null>(null);
  readonly icon = input<string>('wallet');
  readonly tone = input<'default' | 'green' | 'gold' | 'blue' | 'navy'>('default');
}
