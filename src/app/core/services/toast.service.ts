import { Injectable, signal } from '@angular/core';
import { createId } from '../utils/ids';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsState = signal<Toast[]>([]);
  readonly toasts = this.toastsState.asReadonly();

  show(message: string, type: ToastType = 'success', duration = 3200): void {
    const toast: Toast = { id: createId('toast'), message, type };
    this.toastsState.update((list) => [...list.slice(-2), toast]);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => this.dismiss(toast.id), duration);
    }
  }

  dismiss(id: string): void {
    this.toastsState.update((list) => list.filter((toast) => toast.id !== id));
  }
}
