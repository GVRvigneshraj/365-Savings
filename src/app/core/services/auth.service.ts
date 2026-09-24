import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthUser } from '../models/savings.models';
import { createId, hashPassword } from '../utils/ids';
import { LocalStorageService, STORAGE_KEYS } from './local-storage.service';

export interface AuthResponse {
  ok: boolean;
  error?: string;
}

const MOBILE_PATTERN = /^[6-9]\d{9}$/;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storage = inject(LocalStorageService);

  private readonly userState = signal<AuthUser | null>(
    this.storage.get<AuthUser | null>(STORAGE_KEYS.user, null),
  );

  readonly user = this.userState.asReadonly();
  readonly isLoggedIn = computed(() => this.userState() !== null);
  readonly displayName = computed(() => this.userState()?.fullName ?? 'User');
  readonly mobile = computed(() => this.userState()?.mobile ?? '');

  register(fullName: string, mobile: string, password: string, confirmPassword: string): AuthResponse {
    const name = fullName.trim();
    if (name.length < 2) return { ok: false, error: 'Please enter your full name.' };
    if (!MOBILE_PATTERN.test(mobile.trim()))
      return { ok: false, error: 'Enter a valid 10-digit Indian mobile number.' };
    if (password.length < 6)
      return { ok: false, error: 'Password must be at least 6 characters.' };
    if (password !== confirmPassword)
      return { ok: false, error: 'Passwords do not match.' };

    const existing = this.userState();
    if (existing && existing.mobile === mobile.trim())
      return { ok: false, error: 'An account with this mobile number already exists.' };

    const user: AuthUser = {
      fullName: name,
      mobile: mobile.trim(),
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    this.userState.set(user);
    this.storage.set(STORAGE_KEYS.user, user);
    return { ok: true };
  }

  login(mobile: string, password: string): AuthResponse {
    if (!MOBILE_PATTERN.test(mobile.trim()))
      return { ok: false, error: 'Enter a valid 10-digit mobile number.' };
    if (!password) return { ok: false, error: 'Enter your password.' };

    const existing = this.userState();
    if (!existing)
      return { ok: false, error: 'No account found on this device. Please create one.' };
    if (existing.mobile !== mobile.trim())
      return { ok: false, error: 'Mobile number not found on this device.' };
    if (existing.passwordHash !== hashPassword(password))
      return { ok: false, error: 'Incorrect password. Please try again.' };
    return { ok: true };
  }

  updateProfile(fullName: string): AuthResponse {
    const name = fullName.trim();
    if (name.length < 2) return { ok: false, error: 'Please enter your full name.' };
    const current = this.userState();
    if (!current) return { ok: false, error: 'No active session.' };
    const updated: AuthUser = { ...current, fullName: name };
    this.userState.set(updated);
    this.storage.set(STORAGE_KEYS.user, updated);
    return { ok: true };
  }

  logout(): void {
    this.userState.set(null);
    this.storage.remove(STORAGE_KEYS.user);
  }

  restoreUser(user: AuthUser | null): void {
    this.userState.set(user);
    if (user) this.storage.set(STORAGE_KEYS.user, user);
    else this.storage.remove(STORAGE_KEYS.user);
  }

  /** Demo helper: creates the default local profile used by sample data. */
  ensureDemoUser(): void {
    if (this.userState()) return;
    const user: AuthUser = {
      fullName: 'Demo Saver',
      mobile: '9876543210',
      passwordHash: hashPassword('demo123'),
      createdAt: new Date().toISOString(),
    };
    this.userState.set(user);
    this.storage.set(STORAGE_KEYS.user, user);
  }
}

export { createId };
