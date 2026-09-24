import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  CatalogScheme,
  SchemeCatalogService,
  SchemeCategory,
  schemeMathLine,
  schemeTarget,
} from '../../core/services/scheme-catalog.service';
import { SavingsPlanService } from '../../core/services/savings-plan.service';
import { ToastService } from '../../core/services/toast.service';
import { formatAmount } from '../../core/utils/money';
import { IconComponent } from '../../shared/components/icon/icon';
import { InrPipe } from '../../shared/pipes/inr.pipe';

@Component({
  selector: 'app-schemes',
  standalone: true,
  imports: [IconComponent, InrPipe],
  template: `
    <section class="page">
      <header class="page-head">
        <div>
          <h1 class="page-title">Savings Schemes</h1>
          <p class="page-sub">
            Ready-made Daily, Weekly and Monthly schemes — tap Start, no forms to fill.
          </p>
        </div>
      </header>

      <div class="tabs" role="tablist">
        @for (cat of catalog.categories; track cat.key) {
          <button
            type="button"
            role="tab"
            class="tab"
            [class.active]="activeCat() === cat.key"
            [attr.aria-selected]="activeCat() === cat.key"
            (click)="activeCat.set(cat.key)"
          >
            <app-icon [name]="cat.icon" [size]="15" />
            {{ cat.label }}
            <span class="tab-count">{{ startedCount(cat.key) }}/{{ schemesFor(cat.key).length }}</span>
          </button>
        }
      </div>

      <div class="scheme-grid">
        @for (scheme of schemes(); track scheme.key) {
          <article class="card scheme-item">
            <header class="s-head">
              <span class="s-icon">
                <app-icon [name]="catInfo(scheme.category).icon" [size]="18" />
              </span>
              <div class="s-title">
                <h3>{{ scheme.name }}</h3>
                <p>{{ scheme.totalSlots }} {{ catInfo(scheme.category).unit }} · {{ modeLabel(scheme) }}</p>
              </div>
              @if (started(scheme); as plan) {
                <span
                  class="badge"
                  [class]="plan.status === 'COMPLETED' ? 'badge badge-green' : plan.status === 'PAUSED' ? 'badge badge-yellow' : 'badge badge-blue'"
                >
                  {{ plan.status }}
                </span>
              }
            </header>

            <div class="s-math">
              <span class="math-line">{{ mathLine(scheme) }}</span>
              <span class="math-target">Target {{ target(scheme) }}</span>
            </div>

            @if (started(scheme); as plan) {
              <div class="s-progress">
                <div class="s-bar">
                  <div
                    class="s-bar-fill"
                    [style.width.%]="statsFor(plan.id).slotProgress * 100"
                    [class.complete]="statsFor(plan.id).isComplete"
                  ></div>
                </div>
                <span class="s-progress-text">
                  {{ statsFor(plan.id).paidCount }}/{{ plan.totalSlots }} paid ·
                  {{ statsFor(plan.id).totalPaid | inr }} saved
                </span>
              </div>
              <footer class="s-actions">
                <button type="button" class="btn btn-ghost" (click)="open(plan.id)">
                  Open
                </button>
                @if (plan.status !== 'COMPLETED') {
                  <button type="button" class="btn btn-primary" (click)="pay(plan.id)">
                    Pay
                  </button>
                }
              </footer>
            } @else {
              <footer class="s-actions">
                <button
                  type="button"
                  class="btn btn-primary btn-block"
                  (click)="startScheme(scheme)"
                >
                  Start saving
                </button>
              </footer>
            }
          </article>
        }
      </div>

      <p class="s-note">
        Paid Count grows only when you pay — never from the calendar date. Minimum payment is ₹1.
      </p>
    </section>
  `,
  styles: `
    .tabs {
      display: flex; gap: 0.45rem; flex-wrap: wrap; margin-bottom: 1rem;
      background: var(--gray-100); padding: 0.35rem; border-radius: 14px;
      width: fit-content; max-width: 100%;
    }
    .tab {
      display: inline-flex; align-items: center; gap: 0.4rem;
      border: 0; background: transparent; border-radius: 11px;
      padding: 0.55rem 0.9rem; font-family: inherit; font-weight: 700;
      font-size: 0.86rem; color: var(--muted); cursor: pointer;
      transition: all 0.15s ease;
    }
    .tab.active {
      background: #fff; color: var(--navy);
      box-shadow: 0 3px 10px rgba(15, 23, 42, 0.08);
    }
    .tab-count {
      font-size: 0.7rem; font-weight: 800; background: var(--gray-200);
      color: var(--muted); border-radius: 999px; padding: 0.05rem 0.42rem;
    }
    .tab.active .tab-count { background: var(--mint-soft); color: var(--primary-deep); }

    .scheme-grid { display: grid; grid-template-columns: 1fr; gap: 0.9rem; }
    .scheme-item { display: flex; flex-direction: column; gap: 0.85rem; }

    .s-head { display: flex; align-items: center; gap: 0.7rem; }
    .s-icon {
      width: 38px; height: 38px; border-radius: 12px; display: inline-flex;
      align-items: center; justify-content: center; background: var(--mint-soft);
      color: var(--primary); flex-shrink: 0;
    }
    .s-title { flex: 1; min-width: 0; }
    .s-title h3 { margin: 0; font-size: 1rem; font-weight: 700; color: var(--navy); }
    .s-title p { margin: 0.1rem 0 0; font-size: 0.78rem; color: var(--muted); }

    .s-math {
      display: flex; justify-content: space-between; align-items: center;
      gap: 0.75rem; background: var(--gray-100); border-radius: 12px;
      padding: 0.65rem 0.8rem; flex-wrap: wrap;
    }
    .math-line {
      font-size: 0.84rem; font-weight: 700; color: var(--navy);
      font-variant-numeric: tabular-nums;
    }
    .math-target {
      font-size: 0.84rem; font-weight: 800; color: var(--primary-deep);
      font-variant-numeric: tabular-nums;
    }

    .s-progress { display: flex; flex-direction: column; gap: 0.4rem; }
    .s-bar { height: 8px; background: var(--gray-200); border-radius: 999px; overflow: hidden; }
    .s-bar-fill {
      height: 100%; background: var(--primary); border-radius: 999px;
      transition: width 0.3s ease;
    }
    .s-bar-fill.complete { background: var(--green, #10b981); }
    .s-progress-text { font-size: 0.78rem; color: var(--muted); font-weight: 600; }

    .s-actions { display: flex; gap: 0.6rem; }
    .s-actions .btn { flex: 1; justify-content: center; }

    .s-note {
      margin: 1.1rem 0 0; text-align: center; font-size: 0.8rem;
      color: var(--muted); line-height: 1.5;
    }

    @media (min-width: 720px) { .scheme-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (min-width: 1180px) { .scheme-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  `,
})
export class SchemesComponent {
  readonly catalog = inject(SchemeCatalogService);
  readonly planService = inject(SavingsPlanService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly activeCat = signal<SchemeCategory>('daily');

  readonly schemes = computed(() => this.catalog.schemesFor(this.activeCat()));

  schemesFor(category: SchemeCategory): CatalogScheme[] {
    return this.catalog.schemesFor(category);
  }

  catInfo(category: SchemeCategory) {
    return this.catalog.categoryInfo(category);
  }

  startedCount(category: SchemeCategory): number {
    return this.catalog.startedCount(category);
  }

  started(scheme: CatalogScheme) {
    return this.catalog.startedPlan(scheme);
  }

  statsFor(planId: string) {
    return this.planService.getStats(planId);
  }

  target(scheme: CatalogScheme): string {
    return formatAmount(schemeTarget(scheme));
  }

  mathLine(scheme: CatalogScheme): string {
    return schemeMathLine(scheme);
  }

  modeLabel(scheme: CatalogScheme): string {
    return scheme.amountMode === 'increasing' ? 'Increasing ₹1, ₹2, ₹3…' : 'Fixed amount';
  }

  startScheme(scheme: CatalogScheme): void {
    const result = this.catalog.start(scheme);
    if (!result) return;
    this.toast.show(
      result.created ? `${scheme.name} started 🎉` : `${scheme.name} is already running.`,
      'success',
    );
    void this.router.navigate(['/plans', result.plan.id]);
  }

  open(planId: string): void {
    void this.router.navigate(['/plans', planId]);
  }

  pay(planId: string): void {
    void this.router.navigate(['/pay'], { queryParams: { plan: planId } });
  }
}
