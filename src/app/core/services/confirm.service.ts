import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmRequest {
  visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly state = signal<ConfirmState>({
    visible: false,
    title: '',
    message: '',
  });
  readonly dialog = this.state.asReadonly();

  private resolver: ((value: boolean) => void) | null = null;

  open(request: ConfirmRequest): Promise<boolean> {
    this.resolver?.(false);
    this.state.set({
      visible: true,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      danger: false,
      ...request,
    });
    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  confirm(): void {
    this.close(true);
  }

  cancel(): void {
    this.close(false);
  }

  private close(result: boolean): void {
    const resolver = this.resolver;
    this.resolver = null;
    this.state.update((current) => ({ ...current, visible: false }));
    resolver?.(result);
  }
}
