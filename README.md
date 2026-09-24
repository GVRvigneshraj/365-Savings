# 365Savings

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.0.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## PWA / install

Production builds include the Angular service worker. Chrome only shows **Install app** when the site is live over HTTPS with a valid manifest + active service worker (not on `ng serve`, and not on a GitHub Pages 404).

1. Enable Pages once: **Repo → Settings → Pages → Source: Deploy from a branch → `gh-pages` → `/ (root)`**.
2. Live URL: `https://gvrigneshraj.github.io/365-Savings/`
3. In Chrome, open that URL → reload once → **⋮ → Cast, save and share → Install page as app** (or the install icon in the address bar).

Local install check:

```bash
npm run build:pages
npx serve dist/365-savings/browser -l 4200
# open http://localhost:4200/ over localhost (secure) and check DevTools → Application → Manifest
```
