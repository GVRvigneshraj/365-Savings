import { Component, computed, input } from '@angular/core';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { InrPipe } from '../../pipes/inr.pipe';

export interface ChartPoint {
  label: string;
  value: number;
}

export interface HBarPoint {
  label: string;
  value: number;
  max: number;
}

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [EmptyStateComponent, InrPipe],
  template: `
    <section class="card chart-card">
      <header class="chart-head">
        <div>
          <h3 class="chart-title">{{ title() }}</h3>
          @if (subtitle(); as sub) {
            <p class="chart-sub">{{ sub }}</p>
          }
        </div>
        <span class="chart-value">{{ displayValue() }}</span>
      </header>

      @if (type() === 'hbar') {
        @if (bars().length === 0) {
          <app-empty-state
            icon="chart"
            title="No data yet"
            message="Your charts will appear after you create plans and make payments."
          />
        } @else {
          <div class="hbars">
            @for (bar of bars(); track bar.label) {
              <div class="hbar-row">
                <span class="hbar-label" [title]="bar.label">{{ bar.label }}</span>
                <div class="hbar-track">
                  <div
                    class="hbar-fill"
                    [style.width.%]="barWidth(bar)"
                  ></div>
                </div>
                <span class="hbar-value">{{ bar.value | inr }}</span>
              </div>
            }
          </div>
        }
      } @else {
        @if (data().length === 0) {
          <app-empty-state
            icon="chart"
            title="No chart data"
            message="Make a payment to see your progress here."
          />
        } @else {
          @if (type() === 'bar') {
            <div class="bars">
              @for (point of data(); track $index) {
                <div class="bar-col" [title]="point.label + ': ' + (point.value | inr)">
                  <div class="bar-fill" [style.height.%]="barHeight(point)"></div>
                  <span class="bar-label">{{ point.label }}</span>
                </div>
              }
            </div>
          } @else {
            <svg class="line-chart" viewBox="0 0 320 140" preserveAspectRatio="none" role="img" [attr.aria-label]="title()">
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.35" />
                  <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.02" />
                </linearGradient>
              </defs>
              <polygon class="area" [attr.points]="areaPoints()" fill="url(#areaFill)" />
              <polyline class="line" [attr.points]="linePoints()" />
              @for (dot of dots(); track $index) {
                <circle class="dot" [attr.cx]="dot.x" [attr.cy]="dot.y" r="3.2" />
              }
            </svg>
            <div class="line-labels">
              <span>{{ data()[0].label }}</span>
              <span>{{ data()[data().length - 1].label }}</span>
            </div>
          }
        }
      }
    </section>
  `,
  styles: `
    .chart-card { display: flex; flex-direction: column; gap: 0.9rem; }
    .chart-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; }
    .chart-title { margin: 0; font-size: 1rem; font-weight: 800; color: var(--navy); }
    .chart-sub { margin: 0.2rem 0 0; font-size: 0.8rem; color: var(--muted); }
    .chart-value { font-weight: 800; color: var(--primary-deep); font-size: 1.05rem; font-variant-numeric: tabular-nums; }
    .line-chart { width: 100%; height: 150px; display: block; }
    .line { fill: none; stroke: var(--primary); stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
    .dot { fill: #fff; stroke: var(--primary); stroke-width: 2; vector-effect: non-scaling-stroke; }
    .line-labels { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--muted); font-weight: 600; }
    .bars { display: flex; align-items: flex-end; gap: 6px; height: 150px; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 0.35rem; min-width: 0; }
    .bar-fill {
      width: 100%; max-width: 34px; border-radius: 8px 8px 4px 4px;
      background: linear-gradient(180deg, var(--primary-light), var(--primary));
      min-height: 4px; transition: height 0.5s ease;
    }
    .bar-label { font-size: 0.62rem; color: var(--muted); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .hbars { display: flex; flex-direction: column; gap: 0.7rem; }
    .hbar-row { display: grid; grid-template-columns: minmax(70px, 1fr) 2fr auto; gap: 0.6rem; align-items: center; }
    .hbar-label { font-size: 0.8rem; font-weight: 700; color: var(--navy); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .hbar-track { height: 12px; background: var(--gray-100); border-radius: 999px; overflow: hidden; }
    .hbar-fill { height: 100%; background: linear-gradient(90deg, var(--primary-light), var(--primary)); border-radius: 999px; transition: width 0.6s ease; min-width: 3px; }
    .hbar-value { font-size: 0.78rem; font-weight: 700; color: var(--muted); font-variant-numeric: tabular-nums; }
  `,
})
export class ChartCardComponent {
  readonly title = input<string>('Chart');
  readonly subtitle = input<string | null>(null);
  readonly type = input<'line' | 'bar' | 'hbar'>('line');
  readonly data = input<ChartPoint[]>([]);
  readonly bars = input<HBarPoint[]>([]);
  readonly displayValue = input<string>('');

  readonly maxValue = computed(() =>
    Math.max(1, ...this.data().map((point) => point.value)),
  );

  readonly scaled = computed(() => {
    const points = this.data();
    if (points.length === 0) return [];
    const max = this.maxValue();
    const width = 320;
    const height = 140;
    const pad = 8;
    const denominator = Math.max(1, points.length - 1);
    return points.map((point, index) => ({
      x: pad + (index / denominator) * (width - pad * 2),
      y: height - pad - (point.value / max) * (height - pad * 2),
    }));
  });

  readonly linePoints = computed(() =>
    this.scaled()
      .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
      .join(' '),
  );

  readonly areaPoints = computed(() => {
    const points = this.scaled();
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    return `${first.x},140 ${points
      .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
      .join(' ')} ${last.x},140`;
  });

  readonly dots = computed(() => this.scaled());

  barHeight(point: ChartPoint): number {
    return Math.max(4, (point.value / this.maxValue()) * 100);
  }

  barWidth(bar: HBarPoint): number {
    if (bar.max <= 0) return 0;
    return Math.max(2, Math.min(100, (bar.value / bar.max) * 100));
  }
}
