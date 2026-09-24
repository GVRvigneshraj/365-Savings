import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  template: `
    <div
      class="ring"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.--ring-color]="color()"
      [style.--ring-track]="track()"
    >
      <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 100 100">
        <circle class="ring-track" cx="50" cy="50" r="42" />
        <circle
          class="ring-value"
          cx="50"
          cy="50"
          r="42"
          pathLength="100"
          [attr.stroke-dasharray]="'100'"
          [attr.stroke-dashoffset]="dashOffset()"
        />
      </svg>
      <div class="ring-center">
        <span class="ring-main">{{ display() }}</span>
        @if (sub(); as sub) {
          <span class="ring-sub">{{ sub }}</span>
        }
      </div>
    </div>
  `,
  styles: `
    .ring {
      position: relative; display: inline-grid; place-items: center;
      --ring-color: var(--primary); --ring-track: var(--track, var(--mint-soft));
    }
    svg { transform: rotate(-90deg); display: block; }
    .ring-track { fill: none; stroke: var(--ring-track); stroke-width: 9; }
    .ring-value {
      fill: none; stroke: var(--ring-color); stroke-width: 9;
      stroke-linecap: round; transition: stroke-dashoffset 0.7s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .ring-center {
      position: absolute; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; text-align: center; gap: 0.1rem;
    }
    .ring-main {
      font-weight: 800; font-size: 1.15rem; color: var(--navy);
      font-variant-numeric: tabular-nums; letter-spacing: -0.02em;
    }
    .ring-sub { font-size: 0.68rem; color: var(--muted); font-weight: 600; }
  `,
})
export class ProgressRingComponent {
  readonly percent = input(0);
  readonly size = input(120);
  readonly color = input('var(--primary)');
  readonly track = input('var(--mint-soft)');
  readonly display = input('');
  readonly sub = input<string | null>(null);

  readonly dashOffset = computed(() => {
    const value = Math.max(0, Math.min(1, this.percent()));
    return `${100 - value * 100}`;
  });
}
