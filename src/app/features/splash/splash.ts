import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <div class="splash">
      <div class="splash-bg" aria-hidden="true">
        <span class="orb orb-1"></span>
        <span class="orb orb-2"></span>
        <span class="orb orb-3"></span>
      </div>

      <div class="splash-inner">
        <div class="hero-badge">
          <app-icon name="flame" [size]="14" />
          Trusted by everyday savers
        </div>

        <div class="logo-ring">
          <span class="logo-num">365</span>
        </div>

        <h1 class="hero-title">365 Savings</h1>
        <p class="hero-tagline">Small Steps. Big Dreams.</p>
        <p class="hero-desc">
          Start a ready-made savings scheme, pay any amount from ₹1, and watch
          your money flow automatically into the next unpaid slot — never based
          on the calendar date.
        </p>

        <div class="hero-points">
          <div class="point">
            <span class="point-icon green"><app-icon name="target" [size]="16" /></span>
            <span>Payment-count based progress</span>
          </div>
          <div class="point">
            <span class="point-icon blue"><app-icon name="grid" [size]="16" /></span>
            <span>Auto slot allocation engine</span>
          </div>
          <div class="point">
            <span class="point-icon gold"><app-icon name="lock" [size]="16" /></span>
            <span>Data saved on your device</span>
          </div>
        </div>

        <div class="hero-actions">
          <button type="button" class="btn btn-primary btn-lg btn-block" (click)="start()">
            Get Started
            <app-icon name="arrow-right" [size]="18" />
          </button>
          @if (!isLoggedIn()) {
            <a routerLink="/login" class="btn btn-ghost btn-lg btn-block">
              I already have an account
            </a>
          }
        </div>

        <div class="sample card">
          <div class="sample-head">
            <strong>How allocation works</strong>
            <span class="badge badge-blue">365 Day Plan</span>
          </div>
          <div class="sample-row">
            <div>
              <span class="sample-label">You pay</span>
              <span class="sample-value">₹500</span>
            </div>
            <app-icon name="arrow-right" [size]="18" />
            <div>
              <span class="sample-label">Slots paid</span>
              <span class="sample-value">Day 1–31 full</span>
            </div>
            <app-icon name="arrow-right" [size]="18" />
            <div>
              <span class="sample-label">Day 32</span>
              <span class="sample-value partial">₹4 / ₹32 partial</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .splash {
        min-height: 100vh;
        min-height: 100dvh;
        position: relative;
        overflow: hidden;
        background: linear-gradient(180deg, #f0fdf9 0%, #ffffff 45%, #f8fafc 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem 1.15rem;
      }
      .splash-bg {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(60px);
        opacity: 0.55;
        animation: float 9s ease-in-out infinite;
      }
      .orb-1 {
        width: 240px;
        height: 240px;
        background: #a7f3d0;
        top: -60px;
        right: -50px;
      }
      .orb-2 {
        width: 200px;
        height: 200px;
        background: #bfdbfe;
        bottom: 10%;
        left: -70px;
        animation-delay: 1.5s;
      }
      .orb-3 {
        width: 160px;
        height: 160px;
        background: #fde68a;
        top: 40%;
        right: -40px;
        animation-delay: 3s;
        opacity: 0.4;
      }
      .splash-inner {
        position: relative;
        width: min(560px, 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.85rem;
        animation: rise 0.6s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        background: var(--gold-soft);
        color: var(--gold-deep);
        font-size: 0.78rem;
        font-weight: 800;
        padding: 0.4rem 0.85rem;
        border-radius: 999px;
        letter-spacing: 0.02em;
      }
      .logo-ring {
        width: 108px;
        height: 108px;
        border-radius: 34px;
        display: grid;
        place-items: center;
        background: linear-gradient(145deg, var(--primary-light), var(--primary-deep));
        box-shadow: 0 22px 44px rgba(4, 120, 87, 0.35);
        margin-top: 0.5rem;
        transform: rotate(-6deg);
      }
      .logo-num {
        color: #fff;
        font-size: 2.35rem;
        font-weight: 900;
        letter-spacing: -0.05em;
        transform: rotate(6deg);
      }
      .hero-title {
        margin: 0.4rem 0 0;
        font-size: clamp(2.2rem, 8vw, 3rem);
        font-weight: 900;
        color: var(--navy);
        letter-spacing: -0.03em;
      }
      .hero-tagline {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--primary);
        letter-spacing: 0.01em;
      }
      .hero-desc {
        margin: 0;
        color: var(--muted);
        font-size: 0.95rem;
        line-height: 1.6;
        max-width: 460px;
      }
      .hero-points {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
        margin-top: 0.4rem;
      }
      .point {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        background: rgba(255, 255, 255, 0.8);
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 0.65rem 0.85rem;
        font-size: 0.88rem;
        font-weight: 650;
        color: var(--navy);
        text-align: left;
      }
      .point-icon {
        width: 30px;
        height: 30px;
        border-radius: 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .point-icon.green {
        background: var(--mint-soft);
        color: var(--primary);
      }
      .point-icon.blue {
        background: var(--blue-soft);
        color: var(--blue-deep);
      }
      .point-icon.gold {
        background: var(--gold-soft);
        color: var(--gold-deep);
      }
      .hero-actions {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        margin-top: 0.6rem;
      }
      .sample {
        width: 100%;
        text-align: left;
        margin-top: 0.5rem;
      }
      .sample-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.8rem;
      }
      .sample-head strong {
        color: var(--navy);
        font-size: 0.92rem;
      }
      .sample-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.4rem;
        color: var(--muted);
      }
      .sample-row > div {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;
      }
      .sample-label {
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 700;
      }
      .sample-value {
        font-size: 0.85rem;
        font-weight: 800;
        color: var(--navy);
        font-variant-numeric: tabular-nums;
      }
      .sample-value.partial {
        color: var(--warning-deep);
      }
      @media (min-width: 640px) {
        .hero-points {
          flex-direction: row;
          flex-wrap: wrap;
          justify-content: center;
        }
        .point {
          flex: 1 1 160px;
        }
      }
      @keyframes rise {
        from {
          opacity: 0;
          transform: translateY(18px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      @keyframes float {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-18px);
        }
      }
    `,
  ],
})
export class SplashComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly isLoggedIn = this.auth.isLoggedIn;

  start(): void {
    void this.router.navigate([this.auth.isLoggedIn() ? '/dashboard' : '/register']);
  }
}
