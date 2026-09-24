import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SavingsStoreService } from '../../core/services/savings-store.service';
import { IconComponent } from '../../shared/components/icon/icon';
import { PaymentHistoryCardComponent } from '../../shared/components/payment-history-card/payment-history-card';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { InrPipe } from '../../shared/pipes/inr.pipe';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    PaymentHistoryCardComponent,
    EmptyStateComponent,
    InrPipe,
  ],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class PaymentHistoryComponent {
  readonly store = inject(SavingsStoreService);
  private readonly router = inject(Router);

  goPay(): void {
    void this.router.navigate(['/pay']);
  }

  readonly search = signal('');
  readonly planFilter = signal('all');
  readonly statusFilter = signal('all');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly filtersOpen = signal(false);

  readonly plans = computed(() =>
    [...this.store.plans()].sort((a, b) => a.name.localeCompare(b.name)),
  );

  readonly filteredPayments = computed(() => {
    const query = this.search().trim().toLowerCase();
    const planId = this.planFilter();
    const status = this.statusFilter();
    const from = this.dateFrom();
    const to = this.dateTo();

    return [...this.store.payments()]
      .filter((payment) => {
        if (planId !== 'all' && payment.planId !== planId) return false;
        if (status !== 'all' && payment.status !== status) return false;

        const paymentDate = new Date(payment.date);
        if (from) {
          const fromDate = new Date(`${from}T00:00:00`);
          if (Number.isNaN(fromDate.getTime()) || paymentDate < fromDate) return false;
        }
        if (to) {
          const toDate = new Date(`${to}T23:59:59`);
          if (Number.isNaN(toDate.getTime()) || paymentDate > toDate) return false;
        }

        if (query) {
          const haystack = `${payment.planName} ${payment.amount} ${payment.status}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  readonly totalFiltered = computed(() =>
    this.filteredPayments().reduce((total, payment) => total + payment.amount, 0),
  );

  readonly hasActiveFilters = computed(
    () =>
      this.search().trim() !== '' ||
      this.planFilter() !== 'all' ||
      this.statusFilter() !== 'all' ||
      this.dateFrom() !== '' ||
      this.dateTo() !== '',
  );

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  onPlanChange(event: Event): void {
    this.planFilter.set((event.target as HTMLSelectElement).value);
  }

  onStatusChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
  }

  onFromChange(event: Event): void {
    this.dateFrom.set((event.target as HTMLInputElement).value);
  }

  onToChange(event: Event): void {
    this.dateTo.set((event.target as HTMLInputElement).value);
  }

  toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }

  clearFilters(): void {
    this.search.set('');
    this.planFilter.set('all');
    this.statusFilter.set('all');
    this.dateFrom.set('');
    this.dateTo.set('');
  }
}
