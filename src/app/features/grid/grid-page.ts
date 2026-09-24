import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SavingsSlot } from '../../core/models/savings.models';
import { SavingsPlanService } from '../../core/services/savings-plan.service';
import { IconComponent } from '../../shared/components/icon/icon';
import { SummaryCardComponent } from '../../shared/components/summary-card/summary-card';
import { SavingsGridComponent } from '../../shared/components/savings-grid/savings-grid';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { InrPipe } from '../../shared/pipes/inr.pipe';

@Component({
  selector: 'app-grid-page',
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    SummaryCardComponent,
    SavingsGridComponent,
    EmptyStateComponent,
    InrPipe,
    DatePipe,
  ],
  templateUrl: './grid-page.html',
  styleUrl: './grid-page.css',
})
export class GridPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly planService = inject(SavingsPlanService);

  readonly planId = signal(this.route.snapshot.paramMap.get('planId') ?? '');
  readonly selectedSlot = signal<SavingsSlot | null>(null);

  readonly plan = computed(() => this.planService.planById(this.planId()));
  readonly stats = computed(() => this.planService.getStats(this.planId()));
  readonly progressPercent = computed(
    () => `${(this.stats().slotProgress * 100).toFixed(2)}%`,
  );

  readonly slotStatusClass = computed(() => {
    const slot = this.selectedSlot();
    if (!slot) return '';
    if (slot.status === 'FULLY_PAID') return 'status-paid';
    if (slot.status === 'PARTIAL') return 'status-partial';
    return 'status-unpaid';
  });

  readonly slotStatusLabel = computed(() => {
    const slot = this.selectedSlot();
    if (!slot) return '';
    if (slot.status === 'FULLY_PAID') return 'PAID';
    if (slot.status === 'PARTIAL') return 'PARTIAL';
    const nextId = this.stats().nextSlot?.id;
    return nextId === slot.id ? 'UNPAID · NEXT' : 'UNPAID';
  });

  onSlotSelect(slot: SavingsSlot): void {
    this.selectedSlot.set(slot);
  }

  goPay(): void {
    void this.router.navigate(['/pay'], { queryParams: { plan: this.planId() } });
  }

  closeDetail(): void {
    this.selectedSlot.set(null);
  }
}
