import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SavingsPlanService } from '../../../core/services/savings-plan.service';
import { IconComponent } from '../../../shared/components/icon/icon';
import { PlanCardComponent } from '../../../shared/components/plan-card/plan-card';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-plans-list',
  standalone: true,
  imports: [RouterLink, IconComponent, PlanCardComponent, EmptyStateComponent],
  template: `
    <section class="page">
      <header class="page-head">
        <div>
          <h1 class="page-title">My Plans</h1>
          <p class="page-sub">Schemes you have started. Progress follows payments, not dates.</p>
        </div>
        <a class="btn btn-soft" routerLink="/schemes">
          <app-icon name="layers" [size]="17" /> Browse Schemes
        </a>
      </header>

      @if (planService.plans().length === 0) {
        <div class="card">
          <app-empty-state
            icon="layers"
            title="No schemes started yet"
            message="Pick a ready-made Daily, Weekly or Monthly scheme — no forms to fill."
            actionLabel="Browse Schemes"
            (action)="goSchemes()"
          />
        </div>
      } @else {
        <div class="plans-grid">
          @for (plan of planService.plans(); track plan.id) {
            <app-plan-card
              [plan]="plan"
              [stats]="planService.getStats(plan.id)"
              (view)="view(plan.id)"
              (pay)="pay(plan.id)"
            />
          }
        </div>
      }
    </section>
  `,
  styles: `
    .plans-grid { display: grid; grid-template-columns: 1fr; gap: 0.9rem; }
    @media (min-width: 720px) { .plans-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (min-width: 1180px) { .plans-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  `,
})
export class PlansListComponent {
  readonly planService = inject(SavingsPlanService);
  private readonly router = inject(Router);

  goSchemes(): void {
    void this.router.navigate(['/schemes']);
  }

  view(id: string): void {
    void this.router.navigate(['/plans', id]);
  }

  pay(id: string): void {
    void this.router.navigate(['/pay'], { queryParams: { plan: id } });
  }
}
