# Repository Guidelines

## Project Structure & Module Organization

This frontend visualizes the USSH/HUS campus at 334–336 Nguyễn Trãi, Hanoi, using Vite, TypeScript, and Three.js. It has no backend.

- `src/main.ts` initializes the scene, controls and gameplay and emits events on `core/events.ts`; it does not write interface DOM. `motion.ts`, `minimap.ts`, `sky.ts`, and `surfaces.ts` contain focused features.
- `src/ui/` holds the interface (title, HUD, screen stack, settings, achievements, share) and talks to the game only through `GameControls` and bus events. `src/config.ts` holds static config, feature flags and key bindings; `src/core/storage.ts` is the versioned save layer; `src/i18n.ts` holds interface strings.
- `src/style.css` styles the interface; `index.html` supplies the page markup and the `<dialog>` screens.
- How to add a setting, achievement, screen or event: see "Cấu trúc giao diện và nền để mở rộng" in `README.md`.
- `public/assets/` contains local GLB, JSON, and SVG assets copied from the parent kit.
- `scripts/` contains asset synchronization, motion checks, and browser captures. `dist/` is generated build output.

## Build, Test, and Development Commands

Run these commands from `web/`:

- `npm ci`: install dependencies from the lockfile.
- `npm run dev`: synchronize assets and start Vite at `http://127.0.0.1:5173/`.
- `npm run build`: synchronize assets, check TypeScript, and build into `dist/`.
- `npm run preview`: serve the build at `http://127.0.0.1:4173/`.
- `npm run check:motion`: check orientation, wall sliding, and floor-aware collisions.
- `node scripts/capture.mjs`: run browser checks and save screenshots to `../output/shots/`; start preview first. Set `CHROME_PATH` for a nondefault Chrome/Chromium executable.

## Coding Style & Naming Conventions

Follow existing code: two-space indentation, double quotes, semicolons, and ES modules. Use camelCase for functions and variables, PascalCase for classes and interfaces, and uppercase constants where appropriate. Keep TypeScript strict and define explicit data interfaces. No formatter or linter is configured. Resolve runtime asset URLs through `import.meta.env.BASE_URL` to support subdirectory hosting.

## Interface rules

Keep the design direction in `src/style.css` (header comment): true-neutral dark panels, one typeface, one accent (deadline yellow) for deadline data and rewards only, no gradients, glass, glows or emoji. Every icon-only button has `aria-label`, `data-tip` and, when it has one, `data-kbd`. Entrance animations move but never start at opacity 0. New screens go on the screen stack, not as ad-hoc overlays. Agent skills for this work live in `../.claude/skills/` (and `../.agents/skills/`): start with `game-ui-ux`, `design-taste-frontend` (app-screen rules), `save-systems`, `input-systems`, `threejs-*`.

## Testing Guidelines

There is no dedicated test framework or coverage threshold. Extend the descriptive assertions in `scripts/motion-check.mjs` for movement changes. Run motion checks and the build before submitting code. For visual or control changes, also use browser captures and manually check walking, floor selection, and narrow-screen controls. Report checks performed and remaining limitations.

## Commit & Pull Request Guidelines

Git history is unavailable in this checkout, so existing commit conventions cannot be verified. Use concise imperative subjects, such as `Fix floor collision handling`. PRs should describe behavior changes, link relevant issues, list validation, and include screenshots for visual changes.

## Asset & Scope Guidelines

Preserve the parent kit’s source data and regeneration scripts; synchronized assets may be overwritten. Keep runtime resources local. Treat campus geometry as approximate and assign real building names only with supporting evidence. Follow the parent `../AGENTS.md` instructions.
