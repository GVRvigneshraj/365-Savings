import { Injectable, inject } from '@angular/core';
import { AmountMode, PlanType, SavingsPlan } from '../models/savings.models';
import { formatAmount, toDateInputValue } from '../utils/money';
import { SavingsPlanService } from './savings-plan.service';
import { ToastService } from './toast.service';

export type SchemeCategory = 'daily' | 'weekly' | 'monthly';

export interface CatalogScheme {
  key: string;
  name: string;
  category: SchemeCategory;
  totalSlots: number;
  amountMode: AmountMode;
  amountPerSlot: number;
}

export interface SchemeCategoryInfo {
  key: SchemeCategory;
  label: string;
  unit: string;
  icon: string;
}

export const SCHEME_CATEGORIES: SchemeCategoryInfo[] = [
  { key: 'daily', label: 'Daily', unit: 'days', icon: 'calendar' },
  { key: 'weekly', label: 'Weekly', unit: 'weeks', icon: 'refresh' },
  { key: 'monthly', label: 'Monthly', unit: 'months', icon: 'layers' },
];

/**
 * Pre-built savings schemes. Totals are computed with plain math:
 * - increasing: 1 + 2 + … + n = n(n+1)/2
 * - fixed: amountPerSlot × n
 */
export const SCHEME_CATALOG: CatalogScheme[] = [
  { key: 'd-challenge', name: '365 Day Challenge', category: 'daily', totalSlots: 365, amountMode: 'increasing', amountPerSlot: 0 },
  { key: 'd-10', name: 'Daily ₹10', category: 'daily', totalSlots: 365, amountMode: 'fixed', amountPerSlot: 10 },
  { key: 'd-50', name: 'Daily ₹50', category: 'daily', totalSlots: 365, amountMode: 'fixed', amountPerSlot: 50 },
  { key: 'd-100', name: 'Daily ₹100', category: 'daily', totalSlots: 365, amountMode: 'fixed', amountPerSlot: 100 },
  { key: 'd-200', name: 'Daily ₹200', category: 'daily', totalSlots: 365, amountMode: 'fixed', amountPerSlot: 200 },

  { key: 'w-challenge', name: 'Weekly Challenge', category: 'weekly', totalSlots: 52, amountMode: 'increasing', amountPerSlot: 0 },
  { key: 'w-100', name: 'Weekly ₹100', category: 'weekly', totalSlots: 52, amountMode: 'fixed', amountPerSlot: 100 },
  { key: 'w-500', name: 'Weekly ₹500', category: 'weekly', totalSlots: 52, amountMode: 'fixed', amountPerSlot: 500 },
  { key: 'w-1000', name: 'Weekly ₹1,000', category: 'weekly', totalSlots: 52, amountMode: 'fixed', amountPerSlot: 1000 },
  { key: 'w-2500', name: 'Weekly ₹2,500', category: 'weekly', totalSlots: 52, amountMode: 'fixed', amountPerSlot: 2500 },

  { key: 'm-challenge', name: 'Monthly Challenge', category: 'monthly', totalSlots: 12, amountMode: 'increasing', amountPerSlot: 0 },
  { key: 'm-1000', name: 'Monthly ₹1,000', category: 'monthly', totalSlots: 12, amountMode: 'fixed', amountPerSlot: 1000 },
  { key: 'm-2000', name: 'Monthly ₹2,000', category: 'monthly', totalSlots: 12, amountMode: 'fixed', amountPerSlot: 2000 },
  { key: 'm-5000', name: 'Monthly ₹5,000', category: 'monthly', totalSlots: 12, amountMode: 'fixed', amountPerSlot: 5000 },
  { key: 'm-10000', name: 'Monthly ₹10,000', category: 'monthly', totalSlots: 12, amountMode: 'fixed', amountPerSlot: 10000 },
];

export function schemeTarget(scheme: CatalogScheme): number {
  const n = scheme.totalSlots;
  if (scheme.amountMode === 'increasing') return (n * (n + 1)) / 2;
  return n * scheme.amountPerSlot;
}

export function schemeMathLine(scheme: CatalogScheme): string {
  if (scheme.amountMode === 'increasing') return `1 + 2 + 3 + … + ${scheme.totalSlots}`;
  return `${formatAmount(scheme.amountPerSlot)} × ${scheme.totalSlots}`;
}

export interface StartSchemeResult {
  plan: SavingsPlan;
  created: boolean;
}

@Injectable({ providedIn: 'root' })
export class SchemeCatalogService {
  private readonly planService = inject(SavingsPlanService);
  private readonly toast = inject(ToastService);

  readonly categories = SCHEME_CATEGORIES;
  readonly catalog = SCHEME_CATALOG;

  schemesFor(category: SchemeCategory): CatalogScheme[] {
    return SCHEME_CATALOG.filter((scheme) => scheme.category === category);
  }

  categoryInfo(category: SchemeCategory): SchemeCategoryInfo {
    return SCHEME_CATEGORIES.find((info) => info.key === category) ?? SCHEME_CATEGORIES[0];
  }

  startedPlan(scheme: CatalogScheme): SavingsPlan | undefined {
    return this.planService
      .plans()
      .find((plan) => plan.name === scheme.name && plan.status !== 'COMPLETED');
  }

  startedCount(category: SchemeCategory): number {
    return this.schemesFor(category).filter((scheme) => this.startedPlan(scheme)).length;
  }

  start(scheme: CatalogScheme): StartSchemeResult | null {
    const existing = this.startedPlan(scheme);
    if (existing) return { plan: existing, created: false };

    const result = this.planService.createPlan({
      name: scheme.name,
      type: scheme.category as PlanType,
      totalSlots: scheme.totalSlots,
      amountMode: scheme.amountMode,
      amountPerSlot: scheme.amountPerSlot,
      startDate: toDateInputValue(),
      autoAllocation: true,
      maxPayment: null,
    });

    if (!result.ok || !result.plan) {
      this.toast.show(result.error ?? 'Could not start this scheme.', 'error');
      return null;
    }
    return { plan: result.plan, created: true };
  }
}
