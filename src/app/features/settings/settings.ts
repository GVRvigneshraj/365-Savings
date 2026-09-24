import { Component, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AppSettings, BackupData, ThemeMode } from '../../core/models/savings.models';
import {
  LocalStorageService,
  STORAGE_KEYS,
} from '../../core/services/local-storage.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { SettingsService } from '../../core/services/settings.service';
import { SavingsStoreService } from '../../core/services/savings-store.service';
import { SavingsPlanService } from '../../core/services/savings-plan.service';
import { ToastService } from '../../core/services/toast.service';
import { PwaService } from '../../core/services/pwa.service';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class SettingsComponent {
  private readonly router = inject(Router);
  private readonly storage = inject(LocalStorageService);
  readonly auth = inject(AuthService);
  readonly settingsService = inject(SettingsService);
  private readonly store = inject(SavingsStoreService);
  private readonly planService = inject(SavingsPlanService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  readonly pwa = inject(PwaService);

  readonly settings = this.settingsService.settings;
  readonly importError = signal('');
  readonly profileSaved = signal(false);

  readonly profileForm = new FormGroup({
    fullName: new FormControl(this.auth.displayName(), {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(60)],
    }),
  });

  readonly themes: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: 'sun' },
    { value: 'dark', label: 'Dark', icon: 'moon' },
    { value: 'system', label: 'System', icon: 'settings' },
  ];

  readonly toggles = computed(() => [
    {
      key: 'autoAllocation' as const,
      label: 'Auto Allocation',
      hint: 'Distribute payments across the next unpaid slots automatically. When off, a payment covers only one slot.',
      value: this.settings().autoAllocation,
    },
    {
      key: 'paymentConfirmation' as const,
      label: 'Payment Confirmation',
      hint: 'Ask for confirmation before a payment is applied.',
      value: this.settings().paymentConfirmation,
    },
    {
      key: 'notifications' as const,
      label: 'Notifications',
      hint: 'Show a toast after payments and important actions.',
      value: this.settings().notifications,
    },
  ]);

  readonly dataCounts = computed(
    () =>
      `${this.store.plans().length} plans · ${this.store.slots().length} slots · ${this.store.payments().length} payments`,
  );

  readonly memberSince = computed(() => {
    const created = this.auth.user()?.createdAt;
    if (!created) return '—';
    return new Date(created).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  });

  setTheme(theme: ThemeMode): void {
    this.settingsService.update({ theme });
    this.toast.show(`Theme set to ${theme}.`, 'info');
  }

  toggle(key: 'autoAllocation' | 'paymentConfirmation' | 'notifications'): void {
    const current = this.settings()[key];
    this.settingsService.update({ [key]: !current } as Partial<AppSettings>);
    const label =
      key === 'autoAllocation'
        ? 'Auto Allocation'
        : key === 'paymentConfirmation'
          ? 'Payment Confirmation'
          : 'Notifications';
    this.toast.show(`${label} turned ${!current ? 'ON' : 'OFF'}.`, 'info', 2000);
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const result = this.auth.updateProfile(this.profileForm.controls.fullName.value);
    if (!result.ok) {
      this.toast.show(result.error ?? 'Unable to update profile.', 'error');
      return;
    }
    this.profileSaved.set(true);
    this.toast.show('Profile updated.');
    if (typeof window !== 'undefined') {
      window.setTimeout(() => this.profileSaved.set(false), 2500);
    }
  }

  exportData(): void {
    const backup: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      user: this.auth.user(),
      plans: this.store.plans(),
      slots: this.store.slots(),
      payments: this.store.payments(),
      settings: this.settings(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `365-savings-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.toast.show('Backup exported successfully.');
  }

  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.importError.set('');

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<BackupData>;
        if (!Array.isArray(parsed.plans) || !Array.isArray(parsed.slots) || !Array.isArray(parsed.payments)) {
          throw new Error('Invalid backup file structure.');
        }
        this.store.replaceAll({
          plans: parsed.plans,
          slots: parsed.slots,
          payments: parsed.payments,
        });
        if (parsed.settings) this.settingsService.replace(parsed.settings);
        this.toast.show('Data imported successfully.');
      } catch (error) {
        this.importError.set(
          error instanceof Error ? error.message : 'Unable to import this file.',
        );
      } finally {
        input.value = '';
      }
    };
    reader.onerror = () => {
      this.importError.set('Unable to read the selected file.');
      input.value = '';
    };
    reader.readAsText(file);
  }

  loadSampleData(): void {
    this.planService.seedSamplePlans();
    this.toast.show('Sample plans added. Pay anytime to see allocation in action.');
  }

  async resetCurrentPlan(): Promise<void> {
    const payments = [...this.store.payments()].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const target =
      payments[0]?.planId ?? this.planService.activePlans()[0]?.id ?? null;
    if (!target) {
      this.toast.show('No plan with progress found to reset.', 'info');
      return;
    }
    const plan = this.planService.planById(target);
    const ok = await this.confirm.open({
      title: 'Reset current plan?',
      message: `Progress for “${plan?.name ?? 'this plan'}” will be cleared and its payments removed.`,
      confirmText: 'Reset plan',
      danger: true,
    });
    if (!ok) return;
    this.planService.resetPlan(target);
    this.toast.show('Current plan reset to 0.');
  }

  async deleteAllData(): Promise<void> {
    const ok = await this.confirm.open({
      title: 'Delete all local data?',
      message:
        'This permanently removes every plan, payment, profile and setting stored in this browser. This cannot be undone.',
      confirmText: 'Delete everything',
      danger: true,
    });
    if (!ok) return;
    this.store.clearSavingsData();
    this.settingsService.reset();
    this.storage.clearSavingsKeys();
    this.auth.logout();
    this.toast.show('All local data deleted.', 'info');
    void this.router.navigate(['/']);
  }
}
