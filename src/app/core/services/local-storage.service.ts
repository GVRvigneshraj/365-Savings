import { Injectable } from '@angular/core';

export const STORAGE_KEYS = {
  user: 'savings_user',
  plans: 'savings_plans',
  slots: 'savings_slots',
  payments: 'savings_payments',
  settings: 'savings_settings',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  get<T>(key: StorageKey, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  set<T>(key: StorageKey, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('[365 Savings] Unable to persist data', key, error);
    }
  }

  remove(key: StorageKey): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }

  clearSavingsKeys(): void {
    Object.values(STORAGE_KEYS).forEach((key) => this.remove(key));
  }

  has(key: StorageKey): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }
}
