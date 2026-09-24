import { Injectable, computed, inject, signal } from "@angular/core";
import { SwUpdate, VersionReadyEvent } from "@angular/service-worker";
import { filter } from "rxjs";
import { ToastService } from "./toast.service";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

@Injectable({ providedIn: "root" })
export class PwaService {
  private readonly sw = inject(SwUpdate);
  private readonly toast = inject(ToastService);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  readonly updateReady = signal(false);
  readonly canInstall = signal(false);
  readonly installing = signal(false);
  readonly standalone = signal(false);
  readonly swReady = signal(false);

  readonly statusText = computed(() => {
    if (this.updateReady()) return "New version ready";
    if (this.canInstall()) return "Install available";
    if (this.standalone()) return "Installed · up to date";
    if (this.swReady()) return "PWA · offline ready";
    return "PWA · preparing offline mode…";
  });

  readonly installHelp = computed(() => {
    if (this.canInstall()) {
      return "Tap Download to install 365 Savings as an app.";
    }
    if (this.standalone()) {
      return "Already installed as an app on this device.";
    }
    const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    if (isIOS) {
      return "Open Share → Add to Home Screen in Safari.";
    }
    return (
      "Chrome desktop: ⋮ → Cast, save and share → Install page as app. " +
      "Chrome Android: ⋮ → Install app / Add to Home screen. " +
      "Reload once after the first visit so the service worker can activate."
    );
  });

  constructor() {
    if (typeof window === "undefined") return;

    this.standalone.set(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean })
          .standalone === true,
    );

    void this.trackServiceWorker();

    if (this.sw.isEnabled) {
      this.sw.versionUpdates
        .pipe(
          filter(
            (evt): evt is VersionReadyEvent => evt.type === "VERSION_READY",
          ),
        )
        .subscribe(() => {
          this.updateReady.set(true);
          this.toast.show(
            "Update available — tap the banner (or Settings → App Update) to refresh.",
            "info",
            6000,
          );
        });
    }

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.canInstall.set(true);
      console.info("[PWA] beforeinstallprompt received — installable");
    });

    window.addEventListener("appinstalled", () => {
      this.deferredPrompt = null;
      this.canInstall.set(false);
      this.standalone.set(true);
      this.toast.show("365 Savings installed to your device.");
    });

    window
      .matchMedia("(display-mode: standalone)")
      .addEventListener("change", (event) => {
        this.standalone.set(event.matches);
      });

    window.addEventListener("load", () => {
      window.setTimeout(() => void this.trackServiceWorker(), 1500);
    });
  }

  private async trackServiceWorker(): Promise<void> {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      console.warn(
        "[PWA] Service workers not supported in this browser context",
      );
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.active || navigator.serviceWorker.controller) {
        this.swReady.set(true);
        console.info(
          "[PWA] Service worker active — page is installable (HTTPS + manifest required)",
        );
      }

      navigator.serviceWorker.ready.then(() => this.swReady.set(true));
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        this.swReady.set(true);
      });
    } catch (error) {
      console.warn("[PWA] Service worker check failed", error);
    }
  }

  async applyUpdate(): Promise<void> {
    if (!this.sw.isEnabled || !this.updateReady()) return;
    this.toast.show("Applying update…", "info", 2000);
    try {
      await this.sw.activateUpdate();
    } catch {
      document.location.reload();
      return;
    }
    document.location.reload();
  }

  async install(): Promise<void> {
    if (this.installing()) return;

    if (!this.deferredPrompt) {
      this.toast.show(this.installHelp(), "info", 8000);
      return;
    }

    this.installing.set(true);
    try {
      await this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        this.canInstall.set(false);
      }
    } finally {
      this.deferredPrompt = null;
      this.installing.set(false);
    }
  }
}
