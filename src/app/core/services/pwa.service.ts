import { Injectable, computed, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { ToastService } from './toast.service';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly sw = inject(SwUpdate);
  private readonly toast = inject(ToastService);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  readonly updateReady = signal(false);
  readonly canInstall = signal(false);
  readonly installing = signal(false);
  readonly standalone = signal(false);

  readonly statusText = computed(() => {
    if (this.updateReady()) return 'New version ready';
    if (this.canInstall()) return 'Install available';
    if (this.standalone()) return 'Installed · up to date';
    return 'PWA · offline ready';
  });

  constructor() {
    if (typeof window === 'undefined') return;

    this.standalone.set(
      window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
    );

    if (this.sw.isEnabled) {
      this.sw.versionUpdates
        .pipe(
          filter(
            (evt): evt is VersionReadyEvent =>
              evt.type === 'VERSION_READY',
          ),
        )
        .subscribe(() => {
          this.updateReady.set(true);
        this.toast.show(
          'Update available — tap the banner (or Settings → App Update) to refresh.',
          'info',
          6000,
        );
        });
    }

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall.set(false);
      this.standalone.set(true);
      this.toast.show('365 Savings installed to your device.');
    });

    window.matchMedia('(display-mode: standalone)').addEventListener('change', (event) => {
      this.standalone.set(event.matches);
    });
  }

  async applyUpdate(): Promise<void> {
    if (!this.sw.isEnabled || !this.updateReady()) return;
    this.toast.show('Applying update…', 'info', 2000);
    try {
      await this.sw.activateUpdate();
    } catch {
      document.location.reload();
      return;
    }
    document.location.reload();
  }

  async install(): Promise<void> {
    if (!this.deferredPrompt || this.installing()) return;
    this.installing.set(true);
    try {
      await this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        this.canInstall.set(false);
      }
    } finally {
      this.deferredPrompt = null;
      this.installing.set(false);
    }
  }
}
