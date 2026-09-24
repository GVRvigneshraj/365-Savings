import { Component, inject } from '@angular/core';
import { ConfirmService } from '../../../core/services/confirm.service';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (confirm.dialog(); as dialog) {
      @if (dialog.visible) {
        <div class="dialog-backdrop" (click)="confirm.cancel()">
          <div
            class="dialog"
            role="alertdialog"
            aria-modal="true"
            [attr.aria-label]="dialog.title"
            (click)="$event.stopPropagation()"
          >
            <span class="dialog-icon" [class.danger]="dialog.danger">
              <app-icon [name]="dialog.danger ? 'alert' : 'info'" [size]="22" />
            </span>
            <h2 class="dialog-title">{{ dialog.title }}</h2>
            <p class="dialog-message">{{ dialog.message }}</p>
            <div class="dialog-actions">
              <button type="button" class="btn btn-ghost" (click)="confirm.cancel()">
                {{ dialog.cancelText || 'Cancel' }}
              </button>
              <button
                type="button"
                class="btn"
                [class.btn-danger]="dialog.danger"
                [class.btn-primary]="!dialog.danger"
                (click)="confirm.confirm()"
              >
                {{ dialog.confirmText || 'Confirm' }}
              </button>
            </div>
          </div>
        </div>
      }
    }
  `,
  styles: `
    .dialog-backdrop {
      position: fixed; inset: 0; z-index: 90; display: grid; place-items: center;
      background: rgba(8, 15, 30, 0.55); backdrop-filter: blur(4px);
      padding: 1.25rem; animation: fadeIn 0.18s ease;
    }
    .dialog {
      width: min(420px, 100%); background: #fff; border-radius: 22px;
      padding: 1.5rem 1.35rem 1.35rem; box-shadow: var(--shadow-lg);
      display: flex; flex-direction: column; align-items: center; text-align: center;
      gap: 0.55rem; animation: popIn 0.22s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .dialog-icon {
      width: 48px; height: 48px; border-radius: 16px; display: inline-flex;
      align-items: center; justify-content: center; background: var(--mint-soft);
      color: var(--primary);
    }
    .dialog-icon.danger { background: #fee2e2; color: var(--danger); }
    .dialog-title { margin: 0.3rem 0 0; font-size: 1.15rem; font-weight: 800; color: var(--navy); }
    .dialog-message { margin: 0; font-size: 0.92rem; color: var(--muted); line-height: 1.55; }
    .dialog-actions { display: flex; gap: 0.6rem; width: 100%; margin-top: 0.8rem; }
    .dialog-actions .btn { flex: 1; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: translateY(10px) scale(0.97); } to { opacity: 1; transform: none; } }
  `,
})
export class ConfirmDialogComponent {
  readonly confirm = inject(ConfirmService);
}
