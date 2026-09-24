import { Component, inject } from '@angular/core';
import { ReportService } from '../../core/services/report.service';
import { IconComponent } from '../../shared/components/icon/icon';
import { ChartCardComponent } from '../../shared/components/chart-card/chart-card';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [IconComponent, ChartCardComponent, EmptyStateComponent],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class ReportsComponent {
  readonly reportService = inject(ReportService);
  readonly reports = this.reportService.reports;

  readonly paymentTrendTotal = (): string => {
    const points = this.reports().paymentTrend;
    const total = points.reduce((sum, point) => sum + point.value, 0);
    return `₹${total.toLocaleString('en-IN')}`;
  };

  readonly comparisonBars = () =>
    this.reports().planComparison.map((point) => ({
      label: point.label,
      value: point.paid,
      max: point.target,
    }));

  readonly summaryCards = () => {
    const r = this.reports();
    return [
      { label: 'Total Saved', value: r.totalSaved, icon: 'rupee', tone: 'green' as const },
      { label: 'Total Payments', value: r.totalPayments, icon: 'wallet', tone: 'blue' as const },
      { label: 'Paid Slots', value: r.paidSlots, icon: 'check-circle', tone: 'green' as const },
      { label: 'Partial Slots', value: r.partialSlots, icon: 'clock', tone: 'gold' as const },
      { label: 'Unpaid Slots', value: r.unpaidSlots, icon: 'info', tone: 'default' as const },
      { label: 'Remaining Amount', value: r.remainingAmount, icon: 'pie', tone: 'gold' as const },
      { label: 'Average Payment', value: r.averagePayment, icon: 'chart', tone: 'blue' as const },
      { label: 'Largest Payment', value: r.largestPayment, icon: 'zap', tone: 'navy' as const },
      { label: 'Current Streak', value: r.currentStreak, icon: 'flame', tone: 'gold' as const },
      { label: 'Longest Streak', value: r.longestStreak, icon: 'award', tone: 'navy' as const },
      { label: 'Active Plans', value: r.activePlans, icon: 'play', tone: 'green' as const },
      { label: 'Completed Plans', value: r.completedPlans, icon: 'gift', tone: 'green' as const },
    ];
  };

  formatCardValue(card: { label: string; value: number }): string {
    const moneyLabels = [
      'Total Saved',
      'Remaining Amount',
      'Average Payment',
      'Largest Payment',
    ];
    if (moneyLabels.includes(card.label)) return `₹${card.value.toLocaleString('en-IN')}`;
    if (card.label.includes('Streak')) return `${card.value} days`;
    return String(card.value);
  }
}
