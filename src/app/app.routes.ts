import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { ShellComponent } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/splash/splash').then((m) => m.SplashComponent),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'plans',
        loadComponent: () =>
          import('./features/plans/plans-list/plans-list').then((m) => m.PlansListComponent),
      },
      {
        path: 'plans/:id',
        loadComponent: () =>
          import('./features/plans/plan-detail/plan-detail').then((m) => m.PlanDetailComponent),
      },
      {
        path: 'pay',
        loadComponent: () => import('./features/pay/pay').then((m) => m.PayComponent),
      },
      {
        path: 'pay/success',
        loadComponent: () =>
          import('./features/pay/payment-success/payment-success').then(
            (m) => m.PaymentSuccessComponent,
          ),
      },
      {
        path: 'grid/:planId',
        loadComponent: () =>
          import('./features/grid/grid-page').then((m) => m.GridPageComponent),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/history/history').then((m) => m.PaymentHistoryComponent),
      },
      {
        path: 'schemes',
        loadComponent: () =>
          import('./features/schemes/schemes').then((m) => m.SchemesComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports').then((m) => m.ReportsComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings').then((m) => m.SettingsComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
