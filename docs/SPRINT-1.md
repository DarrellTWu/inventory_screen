# Sprint 1 — Interactive MVP

Goal: replace the placeholder `App.tsx` with the real, fully interactive
inventory screen from [`wireframe.html`](./wireframe.html) — create containers,
fill them, drag items around, add items manually, and share a build. Entirely
client-side; no backend.

Read [`DESIGN.md`](./DESIGN.md) and open the wireframe before starting.

## In scope

- Paperdoll with carry-zone dots (active/inactive) + connector lines.
- Double-click a dot → create a container (kind, name, capacity).
- Floating container panels + stash panel, rendered from store state.
- Drag-and-drop items between any holders (containers ↔ stash), capacity-aware.
- Item selection + detail panel, with a clickable `sourceUrl` link-out.
- Add item — **manual mode only** (emoji + name + details).
- Share/import a build via the existing code system (real dialog, not the
  placeholder buttons).
- Persistence across reload (already handled by zustand `persist`).

## Out of scope (later sprints)

- URL item import / Reddit-style scrape (needs the `/api/preview` Worker).
- Affiliate tag rewriting; short-link backend; accounts.
- Intra-container reordering with animation (holder-to-holder moves are enough
  for MVP — see DnD notes).
- Multi-build switching UI (data model supports it; stretch goal below).

## Definition of done

- [ ] `npm run typecheck` clean.
- [ ] `npm run test` green (incl. new `moveItem` tests).
- [ ] `npm run build` succeeds.
- [ ] Dev app reproduces the wireframe layout and the QA checklist passes.
- [ ] No hardcoded hexes in components — use tokens from `global.css`.

---

## Step 0 — Store foundations (logic before UI)

Do this first; it's UI-independent and unblocks everything.

1. **Expand the zone set.** The wireframe shows ~11 dots but `seed.ts` only
   defines the 5 active ones. Add the full candidate set to `seedState.zones`
   with normalized `x`/`y` in `0..1` and a `side`, so inactive dots render too.
   An inactive dot = a zone with no container pointing at it.
2. **Implement `moveItem`** in [`useInventory.ts`](../src/store/useInventory.ts)
   (currently throws). Add a private `findHolder(id)` that resolves a holder by
   id across the active build's containers **and** the stash. Then:
   - splice the `ItemRef` out of `from.items`, insert into `to.items` at
     `toIndex` (default: append);
   - if `from === to`, treat it as a reorder;
   - **reject overflow**: if `to` is a container and adding would exceed
     `capacity`, no-op (return unchanged). Stash locations are uncapped.
3. **Add an `addItemRef(holderId, itemId, quantity)` action** — there's no way
   today to place an item into a holder (needed by "add item"). Respect capacity.
   Consider a matching `removeItemRef(holderId, refId)`.
4. **Tests** (`useInventory.test.ts` or extend `share.test.ts` pattern): cross-
   holder move, reorder within a holder, capacity rejection, add/remove ref.

**Check:** `npm run test` green; `moveItem` no longer throws.

## Step 1 — Component skeleton + static render

Build under `src/components/`. Render from seed state; no interaction yet.

5. `InventoryScreen.tsx` — top bar + `2fr / 1fr` grid (carry / stash), per the
   wireframe. Stacks vertically under ~680px.
6. `Paperdoll.tsx` — the SVG silhouette + a dot per zone. Active zones (have a
   container) use the bright ring; inactive use the dim style. Draw a connector
   line from each active dot to its panel. Position dots from `zone.x/y`.
7. `ContainerPanel.tsx` — header (`zone label · name · used/capacity`, red tint
   when full) + a grid sized to `capacity`. Float left/right by `zone.side`.
8. `ItemCell.tsx` — 28px cell; `iconUrl` `<img>` if present else `emoji`; qty
   badge when `quantity > 1`; empty/selected states.
9. `StashPanel.tsx` — each `StashLocation` as a labeled sub-grid (Tabler icon
   from `location.icon`).

**Check:** screen matches the wireframe with seed data; `typecheck` clean.

## Step 2 — Selection + detail

10. Selection state (local `useState` or a store field) for the active `ItemRef`.
11. `ItemDetail.tsx` — name, brand, weight, notes; if `sourceUrl` present render
    a clickable link that opens the store page in a new tab
    (`target="_blank" rel="noopener"`).

**Check:** clicking a cell highlights it and shows detail; source link opens.

## Step 3 — Drag and drop (the core)

12. Wrap the screen in `@dnd-kit` `DndContext`. Make `ItemCell` draggable
    (`useDraggable`, id = `refId`) and each holder droppable (`useDroppable`,
    id = `holderId`). Use a `DragOverlay` for the lifted cell.
13. `onDragEnd`: resolve the destination holder from `over.id`, call
    `moveItem(refId, fromHolderId, toHolderId)`. Block drops on a full container
    (visual + the store no-op already guards it).
14. Use a `PointerSensor` with a small activation distance so a *click* (select)
    is distinguishable from a *drag*.

**Check:** drag an item container→container and container→stash; it persists
after reload; dropping on a full container is refused.

## Step 4 — Create container

15. `CreateContainerDialog.tsx` — opened by double-clicking a dot. Fields: kind
    (wallet/keychain/pocket/belt/holster/bag/pouch/watch/custom), name (defaults
    from kind), capacity. Confirm → `addContainer(activeBuildId, zoneId, …)`.

**Check:** double-click an inactive dot, make a holster (4) on a pocket and a
belt (1) on the waist; panels appear and connect.

## Step 5 — Add item (manual)

16. `AddItemDialog.tsx` with two tabs. **Manual** tab: emoji picker + name +
    optional brand/weight/notes → `createItem` then `addItemRef(holderId, …)`.
    **From URL** tab: present but disabled with a "coming in a later sprint"
    note (keeps the seam visible without the Worker).

**Check:** add a manual item with an emoji into a container; it renders + saves.

## Step 6 — Share UI

17. `ShareDialog.tsx` — replace the placeholder buttons. Export with a lite/full
    toggle (calls `exportBuild`), show the `#build=` URL with a copy button;
    import field (calls `importBuildCode`, catches `ShareDecodeError`). The boot-
    time hash import in `App.tsx` already works — keep it.

**Check:** export a link, open it in a new tab/profile, build imports.

## Step 7 — Game feel + cleanup

18. Drop glow on the receiving cell, capacity counter tick, empty-cell
    placeholders, full-container red tint. Keep it tasteful (DESIGN.md "Drag and
    drop").
19. Remove/edit affordances: delete a container, remove an item from a holder,
    edit an item.

**Check:** full QA pass below.

---

## Component contracts (suggested)

```
InventoryScreen
├─ TopBar (build name/tag)
├─ CarryArea (2/3)
│   ├─ Paperdoll (zones → dots + connectors)
│   └─ ContainerPanel[]  → ItemCell[]
├─ StashPanel (1/3)      → StashLocation[] → ItemCell[]
├─ ItemDetail (selected ref)
├─ CreateContainerDialog   (double-click a dot)
├─ AddItemDialog           (manual now; URL tab disabled)
└─ ShareDialog
```

Keep components small and typed; lean on store actions, not local copies of
state. Reuse `global.css` tokens — no new hardcoded colors.

## DnD notes

- MVP = **holder-to-holder moves** (drop appends to the destination). Precise
  intra-holder reordering with `toIndex` and sortable animation is a stretch;
  `moveItem` already accepts `toIndex` so it's additive later.
- Holder ids are container ids and stash-location ids — both flow through
  `findHolder`. Don't special-case stash in the component; let the store resolve.

## QA checklist

- [ ] Seed loads; layout matches the wireframe (left 2/3 carry, right 1/3 stash).
- [ ] Active vs inactive dots render correctly; connectors point to panels.
- [ ] Double-click a dot → create container → panel appears anchored to it.
- [ ] Drag item between two containers, and container ↔ stash; persists on reload.
- [ ] Dropping onto a full container is refused.
- [ ] Select an item → detail shows; `sourceUrl` opens the store page.
- [ ] Add a manual item (emoji + name) into a container.
- [ ] Export a share link, import it in a fresh session — build restores.
- [ ] Resize below 680px → columns stack.

## Risks / watch-outs

- **Click vs drag** ambiguity — tune the `PointerSensor` activation distance.
- **Dot ↔ paperdoll alignment** — positions are hand-tuned in the wireframe;
  expect to nudge normalized zone coords against the real SVG (DESIGN.md open
  question).
- **Capacity** must be enforced in the store, not just the UI, so imports/edits
  can't overflow.
- Don't let "add item" create orphan catalog items with no placement on cancel.

## Stretch (only if time remains)

- Minimal build switcher (the tag in the top bar) — `setActiveBuild` exists.
- Weight totals per container/build from `weightGrams`.
- Intra-container drag reordering with animation.
