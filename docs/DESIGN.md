# EDC Inventory — design notes

The pitch: cross a **video-game inventory screen** with the **real-world EDC
(everyday carry) hobby**. You see a paperdoll, define containers on your body
(wallet, keychain, pockets, holster, bag…), and fill them with the gear you
carry. Moving an item from your pocket to your bag should feel as satisfying as
re-speccing a character build in an RPG.

The canonical visual is [`wireframe.html`](./wireframe.html) — open it in a
browser. This document explains the concepts behind it.

## Core mental model

```
Build ("EDC Daily")
  └─ Containers, each anchored to a Zone (a dot on the paperdoll)
       └─ ItemRefs (a placement of an Item, with a quantity)

Stash (off-body, build-independent)
  └─ StashLocations (Home base, Car, Nightstand, Work desk…)
       └─ ItemRefs

Item catalog (canonical definitions, referenced by every ItemRef)
```

See [`src/types/index.ts`](../src/types/index.ts) for the typed model.

- **Item** — the canonical definition of a thing you own (name, brand, icon,
  weight, product URL). Lives once; referenced everywhere.
- **ItemRef** — a placement of an item somewhere, with a quantity. The same
  item can appear in multiple holders (spare batteries in car + desk).
- **Container** — an on-body holder anchored to a paperdoll **Zone**. Has a
  `kind` (wallet, holster, bag…) and a `capacity` (grid size).
- **StashLocation** — an off-body holder grouped under the Stash panel.
- **Build** — a named loadout owning a set of containers. Switching builds
  swaps what's shown on the paperdoll (Daily / Travel / Gym…).

## Layout

- **Left 2/3** — the paperdoll silhouette with carry-zone **dots**. Containers
  float to the left/right of the body and connect to their dot with a thin
  line. On-body, build-specific.
- **Right 1/3** — the **Stash**, a scrollable panel of off-body locations,
  each with its own sub-grid. Build-independent.
- **Responsive** — below ~680px the two columns stack vertically (stash under
  the paperdoll).

## Key interactions

### Double-click a dot → create a container

The defining interaction. Dots mark every plausible carry point (wrist, neck,
shoulders, chest, waist, belt ×2, pockets, hips). Two states:

- **Inactive** dot — dim, no container yet.
- **Active** dot — brighter, has a container, drawn with a connector line.

Double-clicking a dot opens a small dialog where the user defines:

1. **Kind** — wallet, keychain, pocket, belt, holster, bag, pouch, watch, custom.
2. **Name** — freeform (defaults from kind).
3. **Capacity** — number of slots. The same waist dot could become a 1-slot
   *belt* or an 8-slot *fanny pack*; a pocket dot could become a *holster*.

On confirm, a container panel animates in next to the dot.

### Drag and drop (the satisfying part)

Items drag between any two holders — container↔container, container↔stash,
stash↔stash — using `@dnd-kit`. The store action is:

```ts
moveItem(refId, fromHolderId, toHolderId, toIndex?)
```

Implementation notes for whoever wires this up:

- A "holder" is either a `Container` or a `StashLocation`; resolve by id across
  the active build's containers and the stash. A shared
  `findHolder(id): { kind, ref }` helper keeps `moveItem` clean.
- Respect `capacity` on containers — reject (or bounce back) a drop that would
  overflow. Stash locations are uncapped.
- Reordering within a holder uses `toIndex`; cross-holder moves splice out of
  `from.items` and insert into `to.items`.
- Lean into game feel: snap-to-grid, a soft “thunk” on drop, a brief glow on
  the receiving cell, capacity counter ticking up. Keep it tasteful.

### Item detail & icons

Selecting a cell surfaces the item's detail (name, brand, weight, notes, and a
link out to the source listing). Icon resolution priority:

1. `iconUrl` — uploaded image or scraped product image.
2. Open Graph image scraped from `sourceUrl` on paste.
3. `emoji` fallback.

The wireframe uses emoji throughout as the fallback tier.

## Visual language

Lifted into [`src/styles/global.css`](../src/styles/global.css) as tokens.

- Near-black background (`#0b0b0f`), panels a touch lighter (`#121218`).
- Monospace UI chrome for the "game terminal" feel.
- Indigo accent (`#5050cc`) for active/selected; muted red (`#7a3535`) when a
  container is at capacity.
- Uniform **28px** item cells everywhere. Containers size to their contents —
  a 1-item container is exactly one cell wide, no dead space.
- Zone dots: dim when inactive, indigo-ringed when active.

## Open questions / future work

- **Builds UI** — switching, creating, duplicating loadouts (only the data
  model exists today).
- **Weight totals** — per-container and per-build, from `weightGrams`.
- **Item catalog browser** — manage items independent of placement.
- **Import/export** — JSON now; consider sharing builds with the community.
- **Persistence** — localStorage today; SQLite via Tauri for a desktop app.
- **Dot ↔ paperdoll alignment** — dot positions are hand-placed and slightly
  off the silhouette in the wireframe; needs tuning when ported to React with
  normalized (0..1) zone coordinates.
