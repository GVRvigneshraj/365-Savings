import { Injectable, effect, inject, signal } from '@angular/core';
import { AppSettings, DEFAULT_SETTINGS, ThemeMode } from '../models/savings.models';
import { LocalStorageService, STORAGE_KEYS } from './local-storage.service';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly storage = inject(LocalStorageService);
  private mediaQuery: MediaQueryList | null =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;

  private readonly settingsState = signal<AppSettings>({
    ...DEFAULT_SETTINGS,
    ...this.storage.get<Partial<AppSettings>>(STORAGE_KEYS.settings, {}),
  });

  readonly settings = this.settingsState.asReadonly();

  constructor() {
    effect(() => {
      const theme = this.settingsState().theme;
      this.applyTheme(theme);
    });

    if (this.mediaQuery) {
      const handler = (): void => {
        if (this.settingsState().theme === 'system') this.applyTheme('system');
      };
      this.mediaQuery.addEventListener('change', handler);
    }
  }

  update(patch: Partial<AppSettings>): void {
    this.settingsState.update((current) => {
      const next = { ...current, ...patch };
      this.storage.set(STORAGE_KEYS.settings, next);
      return next;
    });
  }

  replace(settings: AppSettings): void {
    this.settingsState.set(settings);
    this.storage.set(STORAGE_KEYS.settings, settings);
  }

  reset(): void {
    this.replace({ ...DEFAULT_SETTINGS });
  }

  private applyTheme(theme: ThemeMode): void {
    if (typeof document === 'undefined') return;
    const resolved =
      theme === 'system'
        ? this.mediaQuery?.matches
          ? 'dark'
          : 'light'
        : theme;
    document.documentElement.setAttribute('data-theme', resolved);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0b1220' : '#047857');
  }
}
