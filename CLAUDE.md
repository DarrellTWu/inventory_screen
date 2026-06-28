# CLAUDE.md

Guidance for AI agents working in this repo.

## What this is

EDC Inventory Screen — a video-game-style inventory UI for tracking everyday
carry. A paperdoll with carry-zone "dots"; double-click a dot to create a
container (wallet, holster, bag…); fill containers with items; drag items
between containers and an off-body "stash". The feel target is RPG loadout
tuning: tactile, satisfying, game-like.

Read [`docs/DESIGN.md`](docs/DESIGN.md) first, and open
[`docs/wireframe.html`](docs/wireframe.html) in a browser — it is the visual
source of truth. Match it.

## Stack & conventions

- React 18 + TypeScript (strict) + Vite. State in **zustand** with `persist`
  (localStorage). Drag-and-drop with **@dnd-kit**. Ids via **nanoid**.
  Build sharing compresses with **lz-string**. Tests via **vitest**.
- Import alias: `@/` → `src/`.
- The data model lives in [`src/types/index.ts`](src/types/index.ts) — treat it
  as the contract. If you change a type, update the seed, store, and DESIGN.md
  to match.
- Visual tokens are in [`src/styles/global.css`](src/styles/global.css), lifted
  from the wireframe. Reuse them; don't reintroduce hardcoded hexes in
  components.
- Monospace UI, near-black background, indigo accent, uniform 28px cells.
  Containers size to their contents (a 1-item container is one cell wide).

## Architecture in one breath

`Build → Containers (anchored to Zones) → ItemRefs`, plus a build-independent
`Stash → StashLocations → ItemRefs`, with every ItemRef pointing at a canonical
`Item` in the catalog. One item, many placements.

## Build it out under `src/components/`

The plan to MVP is [`docs/SPRINT-1.md`](docs/SPRINT-1.md) — follow its ordered
steps and checks. Nothing is built yet beyond a placeholder `App.tsx`. Pieces:

- `Paperdoll` — SVG silhouette + zone dots (active/inactive states).
- `ContainerPanel` — a floating per-zone grid with a header + connector line.
- `StashPanel` — off-body locations, each a collapsible sub-grid.
- `ItemCell` — one 28px cell (emoji/icon, quantity badge, selectable, draggable).
- `CreateContainerDialog` — the double-click-a-dot flow (kind, name, capacity).
- `ItemDetail` — selected-item panel with the external link-out.
- `AddItemDialog` — two modes: manual (emoji + name + details) or from a store
  URL (Amazon first). The URL mode is a **Reddit-style link preview**: paste a
  link, pick from scraped candidate thumbnails — not manual. Needs a scrape
  service (a Cloudflare Worker `/api/preview` returning `{title, images[]}`;
  CORS blocks client-side fetch). Emoji always kept as fallback; share codes
  carry image *URLs*, never image *bytes*. See DESIGN.md "Adding items".
- Items with a `sourceUrl` are **clickable** → open the store page. Affiliate
  tags are applied at click time from app config (store clean URLs). See
  DESIGN.md "Click-through & affiliate links".

## The one unimplemented core action

`moveItem(refId, fromHolderId, toHolderId, toIndex?)` in
[`src/store/useInventory.ts`](src/store/useInventory.ts) currently throws. It is
the heart of the drag-and-drop. Implement it to splice an ItemRef between
holders (containers or stash locations), respecting container `capacity`. See
the "Drag and drop" section of DESIGN.md.

## Sharing (built)

Builds save locally (zustand `persist`) and export to self-contained,
URL-safe **share codes** — no backend. `exportBuild` / `importBuildCode` in the
store wrap [`src/lib/share.ts`](src/lib/share.ts); codes ride the URL hash
(`#build=<code>`) via [`src/lib/shareUrl.ts`](src/lib/shareUrl.ts). Lite (no
notes/URLs) is the default payload. A future Upstash-Redis short-link backend is
designed but not built — see DESIGN.md "Sharing". Keep the share data format
stable; bump `SHARE_VERSION` and branch if you must change it.

## House rules

- Keep new code in the style of what's there: small, typed, commented where the
  intent isn't obvious.
- Run `npm run typecheck` before claiming something works. There's no test
  suite yet — if you add meaningful logic (e.g. `moveItem`), add tests.
- Don't commit or push unless asked.
- This is a personal project preloaded with the owner's real setup; the seed in
  [`src/data/seed.ts`](src/data/seed.ts) is placeholder data to be replaced.
