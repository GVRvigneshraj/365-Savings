import { Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentAllocationService } from '../../../core/services/payment-allocation.service';
import { IconComponent } from '../../../shared/components/icon/icon';
import { InrPipe } from '../../../shared/pipes/inr.pipe';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [IconComponent, InrPipe],
  templateUrl: './payment-success.html',
  styleUrl: './payment-success.css',
})
export class PaymentSuccessComponent {
  private readonly allocation = inject(PaymentAllocationService);
  private readonly router = inject(Router);

  readonly result = this.allocation.lastResult;

  readonly progressWidth = computed(() => {
    const data = this.result();
    if (!data || !data.totalSlots) return 0;
    return Math.min(100, (data.newPaidCount / data.totalSlots) * 100);
  });

  constructor() {
    effect(() => {
      if (!this.result()) void this.router.navigate(['/pay']);
    });
  }

  viewProgress(): void {
    const data = this.result();
    if (data) void this.router.navigate(['/grid', data.planId]);
  }

  backToDashboard(): void {
    void this.router.navigate(['/dashboard']);
  }

  payAgain(): void {
    const data = this.result();
    if (data) {
      void this.router.navigate(['/pay'], { queryParams: { plan: data.planId } });
    } else {
      void this.router.navigate(['/pay']);
    }
  }
}
