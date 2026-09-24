import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="toast-host" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <button
          type="button"
          [class]="'toast toast-' + toast.type"
          (click)="toastService.dismiss(toast.id)"
        >
          <app-icon
            [name]="toast.type === 'error' ? 'alert' : toast.type === 'info' ? 'info' : 'check-circle'"
            [size]="17"
          />
          <span>{{ toast.message }}</span>
        </button>
      }
    </div>
  `,
  styles: `
    .toast-host {
      position: fixed; z-index: 120; left: 50%; transform: translateX(-50%);
      bottom: calc(76px + env(safe-area-inset-bottom, 0px));
      display: flex; flex-direction: column; gap: 0.5rem; width: min(420px, calc(100vw - 2rem));
      pointer-events: none;
    }
    .toast {
      pointer-events: auto; display: flex; align-items: center; gap: 0.55rem;
      border: 0; border-radius: 14px; padding: 0.8rem 0.95rem; font-family: inherit;
      font-size: 0.88rem; font-weight: 700; text-align: left; cursor: pointer;
      box-shadow: var(--shadow-lg); animation: toastIn 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .toast-success { background: #064e3b; color: #ecfdf5; }
    .toast-error { background: #7f1d1d; color: #fee2e2; }
    .toast-info { background: var(--navy); color: #e2e8f0; }
    @media (min-width: 1024px) {
      .toast-host { left: auto; right: 1.5rem; bottom: 1.5rem; transform: none; }
    }
    @keyframes toastIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  `,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
