import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { ToastService } from '../../core/services/toast.service';
import { PwaService } from '../../core/services/pwa.service';
import { IconComponent } from '../../shared/components/icon/icon';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly dashboard = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly pwa = inject(PwaService);

  readonly moreOpen = signal(false);
  readonly pageTitle = signal('Dashboard');

  readonly desktopNav: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'home', exact: true },
    { label: 'My Plans', path: '/plans', icon: 'list' },
    { label: 'Pay', path: '/pay', icon: 'rupee' },
    { label: 'Savings Grid', path: '/grid', icon: 'grid' },
    { label: 'Payment History', path: '/history', icon: 'clock' },
    { label: 'Schemes', path: '/schemes', icon: 'layers' },
    { label: 'Reports', path: '/reports', icon: 'chart' },
    { label: 'Settings', path: '/settings', icon: 'settings' },
  ];

  readonly bottomNav: NavItem[] = [
    { label: 'Home', path: '/dashboard', icon: 'home', exact: true },
    { label: 'Plans', path: '/plans', icon: 'list' },
    { label: 'Pay', path: '/pay', icon: 'rupee' },
    { label: 'History', path: '/history', icon: 'clock' },
  ];

  readonly moreItems = computed(() => [
    { label: 'Savings Grid', path: this.gridPath(), icon: 'grid' },
    { label: 'Schemes', path: '/schemes', icon: 'layers' },
    { label: 'Reports', path: '/reports', icon: 'chart' },
    { label: 'Settings', path: '/settings', icon: 'settings' },
  ]);

  readonly initials = computed(() => {
    const name = this.auth.displayName();
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  });

  readonly streak = computed(() => this.dashboard.dashboard().streak.current);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.moreOpen.set(false);
        this.pageTitle.set(this.titleForUrl(event.urlAfterRedirects));
      });
    this.pageTitle.set(this.titleForUrl(this.router.url));
  }

  gridPath(): string {
    const planId = this.dashboard.focusPlanId();
    return planId ? `/grid/${planId}` : '/plans';
  }

  openGrid(): void {
    const planId = this.dashboard.focusPlanId();
    if (!planId) {
      this.toast.show('Start a savings scheme first to view its grid.', 'info');
      void this.router.navigate(['/plans']);
      return;
    }
    void this.router.navigate(['/grid', planId]);
  }

  navClick(item: NavItem): void {
    if (item.icon === 'grid') this.openGrid();
  }

  toggleMore(): void {
    this.moreOpen.update((open) => !open);
  }

  closeMore(): void {
    this.moreOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.moreOpen.set(false);
    this.toast.show('Signed out. Your savings data stays on this device.', 'info');
    void this.router.navigate(['/']);
  }

  private titleForUrl(url: string): string {
    const path = url.split('?')[0];
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/plans')) return 'My Plans';
    if (path.startsWith('/pay')) return 'Pay';
    if (path.startsWith('/grid')) return 'Savings Grid';
    if (path.startsWith('/history')) return 'Payment History';
    if (path.startsWith('/schemes')) return 'Schemes';
    if (path.startsWith('/reports')) return 'Reports';
    if (path.startsWith('/settings')) return 'Settings';
    return '365 Savings';
  }
}
