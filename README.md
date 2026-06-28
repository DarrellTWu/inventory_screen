# EDC Inventory Screen

A video-game inventory screen for your **everyday carry (EDC)**.

See a paperdoll of yourself, define the containers you carry — wallet, keychain,
pockets, holster, backpack — and fill them with your gear. Track what's on your
body, what's stashed in the car or on the nightstand, and what's sitting at
home. Each item links out to a store listing so its icon and details fill in
automatically. The goal: make organizing your carry as satisfying as tuning a
character build in an RPG.

> **Status: scaffold.** The data model, store, seed data, local save, build
> sharing (self-contained codes, no backend), and the visual wireframe are in
> place. The interactive screen is not built yet — see
> [`docs/DESIGN.md`](docs/DESIGN.md) and [`docs/wireframe.html`](docs/wireframe.html).

## Quick look

Open [`docs/wireframe.html`](docs/wireframe.html) in a browser for the visual
source of truth (paperdoll + floating containers + stash).

## Getting started

```bash
npm install
npm run dev
```

The dev app currently renders a status view confirming the store and seed data
are wired up. Build the real UI under `src/components/` against the wireframe.

Other scripts: `npm run build`, `npm run typecheck`, `npm run lint`,
`npm run format`.

## Concept in one diagram

```
Build ("EDC Daily")
  └─ Containers, anchored to Zones (dots on the paperdoll)
       └─ ItemRefs (placement + quantity) ──┐
                                             ├─> Item catalog
Stash (off-body)                            │   (canonical defs)
  └─ StashLocations (Car, Nightstand…)       │
       └─ ItemRefs ─────────────────────────┘
```

## Tech stack

- **React + TypeScript + Vite**
- **zustand** (`persist` → localStorage) for state + local save
- **@dnd-kit** for drag-and-drop between containers and stash
- **lz-string** for compressing builds into shareable URL codes
- **nanoid** for ids
- **vitest** for tests

## Saving & sharing

Your loadout saves automatically in the browser (localStorage). Export any
build as a self-contained **share link** — the build is compressed into the URL
itself (`#build=<code>`), so anyone who opens the link gets your build, no
account or server required. Shared builds are "lite" by default (no personal
notes or store URLs). A future backend phase adds short links + accounts; see
[`docs/DESIGN.md`](docs/DESIGN.md).

## Project layout

```
docs/
  wireframe.html     visual source of truth — open in a browser
  DESIGN.md          concepts, interactions, open questions
src/
  types/index.ts     the data model (start here)
  data/seed.ts       preloaded personal setup (placeholder)
  store/useInventory.ts   zustand store + actions (incl. export/import)
  lib/share.ts       build ⇄ share-code serialization (+ share.test.ts)
  lib/shareUrl.ts    #build=<code> URL hash helpers
  components/        (to build) Paperdoll, ContainerPanel, StashPanel…
  styles/global.css  design tokens lifted from the wireframe
CLAUDE.md            guidance for AI coding agents
```

## Where to start building

1. Read [`docs/DESIGN.md`](docs/DESIGN.md) and open the wireframe.
2. Implement `moveItem` in the store (the core drag-and-drop action).
3. Build `<Paperdoll>` (SVG + zone dots), `<ContainerPanel>`, `<StashPanel>`.
4. Wire the double-click-a-dot → create-container dialog.
5. Replace the placeholder seed with the real personal loadout.
