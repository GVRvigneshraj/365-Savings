import { Component, input } from '@angular/core';

export type IconName =
  | 'home'
  | 'list'
  | 'wallet'
  | 'rupee'
  | 'grid'
  | 'clock'
  | 'layers'
  | 'chart'
  | 'settings'
  | 'plus'
  | 'search'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'check'
  | 'check-circle'
  | 'x'
  | 'more'
  | 'user'
  | 'logout'
  | 'download'
  | 'upload'
  | 'trash'
  | 'flame'
  | 'award'
  | 'target'
  | 'calendar'
  | 'moon'
  | 'sun'
  | 'bell'
  | 'phone'
  | 'lock'
  | 'eye'
  | 'arrow-right'
  | 'arrow-left'
  | 'info'
  | 'alert'
  | 'pause'
  | 'play'
  | 'refresh'
  | 'filter'
  | 'zap'
  | 'gift'
  | 'menu'
  | 'pie'
  | 'plus-circle'
  | 'bookmark';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="stroke()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class="icon"
    >
      @switch (name()) {
        @case ('home') {
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.8V21h14V9.8" />
          <path d="M9.5 21v-6h5v6" />
        }
        @case ('list') {
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3.5" y1="6" x2="3.51" y2="6" />
          <line x1="3.5" y1="12" x2="3.51" y2="12" />
          <line x1="3.5" y1="18" x2="3.51" y2="18" />
        }
        @case ('wallet') {
          <rect x="2.5" y="5.5" width="19" height="14" rx="2.5" />
          <path d="M2.5 10h19" />
          <path d="M17 15h2" />
        }
        @case ('rupee') {
          <path d="M7 4h10" />
          <path d="M7 9h10" />
          <path d="M7 4h3a5 5 0 0 1 0 10H7l8 6" />
        }
        @case ('grid') {
          <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7.5 12 12 15 14" />
        }
        @case ('layers') {
          <polygon points="12 2.5 2.5 7.5 12 12.5 21.5 7.5 12 2.5" />
          <polyline points="2.5 16.5 12 21.5 21.5 16.5" />
          <polyline points="2.5 12 12 17 21.5 12" />
        }
        @case ('chart') {
          <line x1="4" y1="20" x2="4" y2="11" />
          <line x1="10" y1="20" x2="10" y2="4" />
          <line x1="16" y1="20" x2="16" y2="14" />
          <line x1="22" y1="20" x2="2" y2="20" />
        }
        @case ('settings') {
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1.5" y1="14" x2="6.5" y2="14" />
          <line x1="9.5" y1="8" x2="14.5" y2="8" />
          <line x1="17.5" y1="16" x2="22.5" y2="16" />
        }
        @case ('plus') {
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        }
        @case ('plus-circle') {
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.2" y2="16.2" />
        }
        @case ('chevron-left') {
          <polyline points="15 18 9 12 15 6" />
        }
        @case ('chevron-right') {
          <polyline points="9 18 15 12 9 6" />
        }
        @case ('chevron-down') {
          <polyline points="6 9 12 15 18 9" />
        }
        @case ('check') {
          <polyline points="20 6 9 17 4 12" />
        }
        @case ('check-circle') {
          <circle cx="12" cy="12" r="9" />
          <polyline points="8.2 12.4 10.8 15 16 9.4" />
        }
        @case ('x') {
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        }
        @case ('more') {
          <circle cx="5" cy="12" r="1.4" />
          <circle cx="12" cy="12" r="1.4" />
          <circle cx="19" cy="12" r="1.4" />
        }
        @case ('user') {
          <path d="M20 21v-1.8A4.2 4.2 0 0 0 15.8 15H8.2A4.2 4.2 0 0 0 4 19.2V21" />
          <circle cx="12" cy="7.5" r="4" />
        }
        @case ('logout') {
          <path d="M9 21H5.5A2.5 2.5 0 0 1 3 18.5v-13A2.5 2.5 0 0 1 5.5 3H9" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        }
        @case ('download') {
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        }
        @case ('upload') {
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        }
        @case ('trash') {
          <polyline points="3.5 6 5.5 6 20.5 6" />
          <path d="M18.5 6l-.9 13.1A2 2 0 0 1 15.6 21H8.4a2 2 0 0 1-2-1.9L5.5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M8.5 6V4.6A1.6 1.6 0 0 1 10.1 3h3.8a1.6 1.6 0 0 1 1.6 1.6V6" />
        }
        @case ('flame') {
          <path d="M12 21.5c3.6 0 6.5-2.7 6.5-6.4 0-4.6-3.8-7.6-5.7-12.1-1 2.7-2.7 4.6-4.6 6.4-1.2 1.1-2.7 2.7-2.7 5.4 0 3.5 2.9 6.7 6.5 6.7z" />
          <path d="M12 21.5c-1.8 0-3.2-1.3-3.2-3.1 0-1.7 1.3-2.7 2.6-4.1.2 1.4 1.5 1.9 1.5 3.3 0 1.4-1 2.1-1 3.9z" />
        }
        @case ('award') {
          <circle cx="12" cy="8.5" r="5.5" />
          <polyline points="8.6 13.2 7.5 21 12 18.7 16.5 21 15.4 13.2" />
        }
        @case ('target') {
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.4" />
        }
        @case ('calendar') {
          <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
          <line x1="16" y1="2.5" x2="16" y2="6.5" />
          <line x1="8" y1="2.5" x2="8" y2="6.5" />
          <line x1="3" y1="10" x2="21" y2="10" />
        }
        @case ('moon') {
          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
        }
        @case ('sun') {
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="4.5" />
          <line x1="12" y1="19.5" x2="12" y2="22" />
          <line x1="4.2" y1="4.2" x2="6" y2="6" />
          <line x1="18" y1="18" x2="19.8" y2="19.8" />
          <line x1="2" y1="12" x2="4.5" y2="12" />
          <line x1="19.5" y1="12" x2="22" y2="12" />
          <line x1="4.2" y1="19.8" x2="6" y2="18" />
          <line x1="18" y1="6" x2="19.8" y2="4.2" />
        }
        @case ('bell') {
          <path d="M18 8.5a6 6 0 0 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5" />
          <path d="M13.7 20.5a2 2 0 0 1-3.4 0" />
        }
        @case ('phone') {
          <path d="M21.5 16.9v2.8a2 2 0 0 1-2.2 2 19.6 19.6 0 0 1-8.5-3 19.3 19.3 0 0 1-6-6 19.6 19.6 0 0 1-3-8.6 2 2 0 0 1 2-2.2h2.8a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.7 9.6a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2z" />
        }
        @case ('lock') {
          <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.2" />
          <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
        }
        @case ('eye') {
          <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
          <circle cx="12" cy="12" r="3" />
        }
        @case ('arrow-right') {
          <line x1="4" y1="12" x2="19" y2="12" />
          <polyline points="13 6 19 12 13 18" />
        }
        @case ('arrow-left') {
          <line x1="20" y1="12" x2="5" y2="12" />
          <polyline points="11 6 5 12 11 18" />
        }
        @case ('info') {
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="11" x2="12" y2="16.5" />
          <line x1="12" y1="7.8" x2="12.01" y2="7.8" />
        }
        @case ('alert') {
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="7.5" x2="12" y2="13" />
          <line x1="12" y1="16.5" x2="12.01" y2="16.5" />
        }
        @case ('pause') {
          <rect x="6" y="4.5" width="4" height="15" rx="1.2" />
          <rect x="14" y="4.5" width="4" height="15" rx="1.2" />
        }
        @case ('play') {
          <polygon points="7 3.5 19 12 7 20.5 7 3.5" />
        }
        @case ('refresh') {
          <polyline points="20.5 4.5 20.5 10 15 10" />
          <path d="M18.4 15.5a8.5 8.5 0 1 1 1.5-8.2L20.5 10" />
        }
        @case ('filter') {
          <polygon points="21.5 3.5 2.5 3.5 10 12.7 10 19 14 21 14 12.7 21.5 3.5" />
        }
        @case ('zap') {
          <polygon points="13 2.5 3.5 14 11.5 14 10.5 21.5 20 10 12 10 13 2.5" />
        }
        @case ('gift') {
          <polyline points="20 12 20 21 4 21 4 12" />
          <rect x="2.5" y="7.5" width="19" height="4.5" />
          <line x1="12" y1="21" x2="12" y2="7.5" />
          <path d="M12 7.5H7.7a2.35 2.35 0 0 1 0-4.7C11 2.8 12 7.5 12 7.5z" />
          <path d="M12 7.5h4.3a2.35 2.35 0 0 0 0-4.7C13 2.8 12 7.5 12 7.5z" />
        }
        @case ('menu') {
          <line x1="3.5" y1="7" x2="20.5" y2="7" />
          <line x1="3.5" y1="12" x2="20.5" y2="12" />
          <line x1="3.5" y1="17" x2="20.5" y2="17" />
        }
        @case ('pie') {
          <path d="M21.2 15.9A9.5 9.5 0 1 1 8.1 2.8" />
          <path d="M22 12A10 10 0 0 0 12 2v10z" />
        }
        @case ('bookmark') {
          <path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.2L5 21V4.5a1 1 0 0 1 1-1z" />
        }
        @default {
          <circle cx="12" cy="12" r="9" />
        }
      }
    </svg>
  `,
  styles: `
    :host { display: inline-flex; line-height: 0; }
    .icon { display: block; }
  `,
})
export class IconComponent {
  readonly name = input<string>('info');
  readonly size = input<number>(20);
  readonly stroke = input<number>(1.8);
}
