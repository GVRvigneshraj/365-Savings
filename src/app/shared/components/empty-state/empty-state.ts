import { Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="empty-state">
      <span class="empty-icon">
        <app-icon [name]="icon()" [size]="26" />
      </span>
      <h3 class="empty-title">{{ title() }}</h3>
      <p class="empty-message">{{ message() }}</p>
      @if (actionLabel(); as label) {
        <button type="button" class="btn btn-primary" (click)="action.emit()">
          <app-icon name="plus" [size]="16" />
          {{ label }}
        </button>
      }
    </div>
  `,
  styles: `
    .empty-state {
      display: flex; flex-direction: column; align-items: center; text-align: center;
      gap: 0.5rem; padding: 2rem 1rem; color: var(--muted);
    }
    .empty-icon {
      width: 58px; height: 58px; border-radius: 18px; display: inline-flex;
      align-items: center; justify-content: center; background: var(--mint-soft);
      color: var(--primary);
    }
    .empty-title { margin: 0.4rem 0 0; font-size: 1.05rem; color: var(--navy); font-weight: 800; }
    .empty-message { margin: 0; font-size: 0.9rem; max-width: 340px; }
    .empty-state .btn { margin-top: 0.6rem; }
  `,
})
export class EmptyStateComponent {
  readonly icon = input<string>('info');
  readonly title = input<string>('Nothing here yet');
  readonly message = input<string>('');
  readonly actionLabel = input<string | null>(null);
  readonly action = output<void>();
}
