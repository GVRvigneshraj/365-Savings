export type PlanType = 'daily' | 'weekly' | 'monthly' | 'custom';
export type AmountMode = 'fixed' | 'increasing';
export type PlanStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED';
export type SlotStatus = 'UNPAID' | 'PARTIAL' | 'FULLY_PAID';
export type PaymentStatus = 'COMPLETED' | 'PARTIAL';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface SavingsPlan {
  id: string;
  name: string;
  type: PlanType;
  amountMode: AmountMode;
  totalSlots: number;
  totalTarget: number;
  startDate: string;
  status: PlanStatus;
  autoAllocation: boolean;
  maxPayment: number | null;
  createdAt: string;
}

export interface SavingsSlot {
  id: string;
  planId: string;
  slotNumber: number;
  label: string;
  requiredAmount: number;
  paidAmount: number;
  status: SlotStatus;
  paidAt: string | null;
}

export interface PaymentAllocation {
  slotId: string;
  slotNumber: number;
  amountAllocated: number;
  previousPaidAmount: number;
  newPaidAmount: number;
  status: SlotStatus;
}

export interface Payment {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  allocatedAmount: number;
  extraAmount: number;
  date: string;
  allocations: PaymentAllocation[];
  slotsCompleted: number;
  status: PaymentStatus;
}

export interface AuthUser {
  fullName: string;
  mobile: string;
  passwordHash: string;
  createdAt: string;
}

export interface AppSettings {
  theme: ThemeMode;
  autoAllocation: boolean;
  paymentConfirmation: boolean;
  notifications: boolean;
  currency: 'INR';
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  autoAllocation: true,
  paymentConfirmation: true,
  notifications: true,
  currency: 'INR',
};

export interface CreatePlanRequest {
  name: string;
  type: PlanType;
  totalSlots: number;
  amountMode: AmountMode;
  amountPerSlot: number;
  startDate: string;
  maxPayment?: number | null;
  autoAllocation: boolean;
}

export interface PlanStats {
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  totalPaid: number;
  remainingAmount: number;
  slotProgress: number;
  amountProgress: number;
  nextSlot: SavingsSlot | null;
  partialBalance: number;
  isComplete: boolean;
}

export interface AllocationLine {
  slotId: string;
  slotNumber: number;
  label: string;
  requiredAmount: number;
  previousPaidAmount: number;
  amountAllocated: number;
  newPaidAmount: number;
  remainingAfter: number;
  status: SlotStatus;
  wasCompleted: boolean;
}

export interface AllocationPreview {
  planId: string;
  planName: string;
  requestedAmount: number;
  effectiveAmount: number;
  lines: AllocationLine[];
  slotsFullyCovered: number;
  partialSlot: AllocationLine | null;
  allocatedAmount: number;
  leftoverAmount: number;
  leftoverReason: 'none' | 'plan-complete' | 'auto-allocation-off';
  paidCountBefore: number;
  paidCountAfter: number;
  totalSlots: number;
  totalSavedAfter: number;
  remainingAfter: number;
}

export type PaymentErrorCode =
  | 'INVALID_AMOUNT'
  | 'ZERO_AMOUNT'
  | 'MIN_AMOUNT'
  | 'NEGATIVE_AMOUNT'
  | 'LIMIT_EXCEEDED'
  | 'NO_PLAN'
  | 'PLAN_PAUSED';

export interface PaymentValidation {
  valid: boolean;
  error?: string;
  code?: PaymentErrorCode;
}

export interface PaymentSuccessData {
  payment: Payment;
  planId: string;
  planName: string;
  previousPaidCount: number;
  newPaidCount: number;
  totalSlots: number;
  slotsCompleted: number;
  totalSavedAfter: number;
  remainingAfter: number;
  planCompleted: boolean;
}

export interface PaymentResult {
  success: boolean;
  error?: string;
  code?: PaymentErrorCode;
  data?: PaymentSuccessData;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  user: AuthUser | null;
  plans: SavingsPlan[];
  slots: SavingsSlot[];
  payments: Payment[];
  settings: AppSettings;
}

export const PLAN_TYPE_LABEL: Record<PlanType, string> = {
  daily: 'Daily Plan',
  weekly: 'Weekly Plan',
  monthly: 'Monthly Plan',
  custom: 'Custom Plan',
};

export const PLAN_SLOT_PREFIX: Record<PlanType, string> = {
  daily: 'Day',
  weekly: 'Week',
  monthly: 'Month',
  custom: 'Slot',
};
