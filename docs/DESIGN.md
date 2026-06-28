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
2. `emoji` — always kept as a durable fallback (see "Adding items").

The wireframe uses emoji throughout as the fallback tier.

## Adding items

Two ways to add an item. The user picks the mode in the "add item" flow.

### 1. Manual

The user enters the item by hand:

- **name** (required)
- **emoji** icon, chosen from a picker (required — this is the visual)
- **brand**, **weight**, **description/notes** (optional)

No network involved. This is the baseline path and always works offline.

### 2. From a URL (store listing) — Reddit-style link preview

The user pastes a product URL — **Amazon listings supported first** — and the
app scrapes the page and presents a **gallery of candidate thumbnails to choose
from** (like submitting a link on Reddit), plus a suggested name. The user picks
the image they want; they can still override with their own image or an emoji
afterward. **This is not a manual flow** — paste a link, pick a picture, done.

- The scrape returns *multiple* candidate images (product gallery, `og:image`,
  `twitter:image`). The chosen one is stored as `iconUrl`; `sourceUrl` keeps the
  listing link (see "Click-through & affiliate links").
- Always auto-assign a fallback `emoji` too, so the item still renders if the
  image ever fails to load.
- Manual image entry exists only as a *fallback* if a scrape returns nothing.

#### This commits us to a scrape service

A "pick from several thumbnails" experience can't be done client-side: a browser
fetch of an Amazon page is **blocked by CORS**, and we need *all* candidate
images, not just one tag. That rules out the manual options and most thin
metadata APIs (which typically return a single `og:image`). The realistic paths:

| Approach | Multi-thumbnail? | Notes |
| --- | --- | --- |
| **Own serverless function** (Cloudflare Worker / Vercel fn) — *recommended* | yes | Fetch the page, extract all candidate images, return the list. Full control over candidates, caching, and affiliate rewriting. It's a small backend, but a single stateless endpoint. |
| **Rich scrape API** (Microlink "prerender", Iframely, ScrapingBee…) | partial | Some return multiple images; coverage/quotas vary. Sends the user's URL to a third party. Possible per-call cost. |
| **Amazon Product Advertising API** | yes (clean) | Most reliable for Amazon specifically (real gallery + price), but requires an Associates account + request signing — natural once affiliate is live. |

Recommendation: a **single Cloudflare Worker** (`/api/preview?url=`) that returns
`{ title, images[] }`. This is the same serverless door the short-link backend
opens — one tiny service can host link previews, short links, and (later)
affiliate rewriting together. Cache responses (by URL) to stay within limits.

**Display vs. scrape — a key distinction:** showing a remote image via
`<img src="…">` works cross-origin with no CORS. Only *reading* a page or image
pixels needs CORS. So once we have an `iconUrl`, every client (including someone
who imported a shared build) can display it; the CORS problem is confined to the
one-time scrape at import.

### Click-through & affiliate links

If an item has a `sourceUrl`, it's **clickable in the loadout** — clicking opens
the store page in a new tab. This is both a convenience (jump to the product)
and the **future revenue hook**: those outbound links can carry affiliate tags
(Amazon Associates, etc.).

Design rules to keep that door open cleanly:

- **Store the *clean* product URL**, not a pre-tagged one. Apply the affiliate
  tag at *click time* from a single app-level config (e.g. append Amazon's
  `?tag=` / canonicalize to the product ASIN). That way the tag can change
  globally, isn't baked into saved or shared data, and never embeds one user's
  tag into another user's build.
- **Whose tag on a shared build?** The viewer's app applies the **app owner's**
  global tag at click time — not the original sharer's. Decided here so it's
  unambiguous; revisit if creators ever get their own tags.
- **Affiliate rewriting lives in the same Worker** as link previews / short
  links — a natural single place to canonicalize + tag outbound URLs.
- Mind program terms (Amazon Associates has rules about where affiliate links
  may appear and disclosure); worth a compliance pass before monetizing.

### Implications for the save / share system

The big one: **a self-contained share link can carry an image *reference*, never
image *bytes*.**

- **Never embed image data in a share code.** A base64 data-URL for a single
  product image is 20–100KB+; one of those blows past URL limits. Share codes
  stay reference-only.
- **Lite shares (default) drop `iconUrl`** and fall back to emoji — already the
  behavior. So URL-imported items show as their fallback emoji to recipients of
  a lite share. This is why every item keeps an emoji.
- **Full shares include `iconUrl`** (a short remote URL string). Recipients
  display it via `<img>` cross-origin — fine. Caveat: remote URLs **rot**
  (Amazon changes/removes images), so a shared build's images aren't guaranteed
  forever; the emoji fallback is the durable layer.
- **`sourceUrl` should travel in shares — reconsider lite dropping it.**
  Click-through is now a feature *and* the affiliate revenue path, so recipients
  of a shared build clicking items is exactly when monetization happens. Since
  we store the *clean* URL (tag applied at click time), there's no personal-tag
  leak. Proposed: **keep `sourceUrl` in the payload even for lite**, and drop
  only `iconUrl`/`notes` for size. This makes lite ≈ "structure + names + emoji
  **+ clickable store links**, minus heavy images and private notes." It grows
  the code modestly (~80–150 chars/URL, compresses well); revisit if size bites.
- **localStorage caching is optional and local-only.** If we cache the actual
  image bytes (data URL) for offline/robustness, keep it in localStorage **and
  out of the share payload**, and mind the ~5MB localStorage quota — dozens of
  cached images add up. Default to storing the URL, not the bytes.
- **Data model already supports this** — `Item` has `emoji`, `iconUrl`, and
  `sourceUrl`. No new fields strictly required; we may add a small
  `iconType`/preference flag so a user who *chose* emoji over a scraped image
  isn't overridden by icon-resolution priority.

## Visual language

Lifted into [`src/styles/global.css`](../src/styles/global.css) as tokens.

- Near-black background (`#0b0b0f`), panels a touch lighter (`#121218`).
- Monospace UI chrome for the "game terminal" feel.
- Indigo accent (`#5050cc`) for active/selected; muted red (`#7a3535`) when a
  container is at capacity.
- Uniform **28px** item cells everywhere. Containers size to their contents —
  a 1-item container is exactly one cell wide, no dead space.
- Zone dots: dim when inactive, indigo-ringed when active.

## Sharing & persistence

Two layers, deliberately staged so the no-backend version ships first.

### Today — local save + self-contained share codes (no backend)

- **Save** is automatic: the whole `InventoryState` persists to `localStorage`
  via zustand's `persist` middleware. Nothing to host.
- **Share** is self-contained. A build (its zones, containers, and the catalog
  items they reference) serializes to a compact positional-array form, gets
  compressed with `lz-string`, and becomes a URL-safe **share code**. The code
  *is* the build — paste it and the app reconstructs everything. See
  [`src/lib/share.ts`](../src/lib/share.ts).
- Codes ride in the URL **hash** (`#build=<code>`), so they never hit a server
  and dodge server URL-length limits. See
  [`src/lib/shareUrl.ts`](../src/lib/shareUrl.ts).
- **Lite by default**: shared builds drop `notes`, `sourceUrl`, and `iconUrl`,
  keeping name, brand, emoji, and weight. Keeps codes small and avoids leaking
  personal annotations. `exportBuild(id, { lite: false })` shares everything.
- **Import is non-destructive**: `importBuildCode` remaps every incoming id to a
  fresh local id, so importing can never clobber existing data. It adds a new
  build and makes it active.

Measured sizes (worst case, 45 items): ~1.2KB code lite, ~1.7KB full — both
well within URL limits. Realistic builds are smaller.

### Future — backend phase

When pretty short links (`/build/darrells-edc`) and accounts are wanted:

- **Short-link / share store → Upstash Redis.** A share is just
  `SET build:<key> <json>` (optionally with a TTL). Serverless, HTTP-based
  (works from a Worker/edge function), pay-per-request. This is the natural home
  for *public, ephemeral* share keys, plus caching and rate-limiting the share
  endpoint. The `/build/:key` route resolves a long code locally or a short slug
  via the API — the build data format is identical either way, so this is purely
  additive.
- **Accounts + multiple saved builds → Postgres, not Redis.** "All builds for
  user X", auth, and a possible browse/gallery are relational; Redis as the
  primary store there means hand-rolling indexes. Use Postgres as the
  system-of-record ([Supabase](https://supabase.com) bundles Postgres + Auth +
  storage for uploaded icons), and keep Upstash Redis alongside for share keys
  and caching. Don't force account data into Redis.

## Open questions / future work

- **Builds UI** — switching, creating, duplicating loadouts (data model +
  export/import codes exist; the picker UI does not).
- **Share UI** — replace the placeholder export/import buttons with a real
  dialog (lite/full toggle, copy button, QR code).
- **Weight totals** — per-container and per-build, from `weightGrams`.
- **Item catalog browser** — manage items independent of placement.
- **Item catalog dedupe on import** — imports currently insert fresh item
  copies every time; dedupe by identity (name+brand) later.
- **URL item import** — build the Reddit-style link-preview flow: a Cloudflare
  Worker `/api/preview?url=` returning `{ title, images[] }`, Amazon first. See
  "Adding items". Shares the serverless door with short links + affiliate.
- **Affiliate rewriting** — append the app-level affiliate tag to outbound
  `sourceUrl` clicks at click time (clean URLs stored). Compliance pass before
  monetizing. See "Click-through & affiliate links".
- **Lite payload redefinition** — currently `share.ts` lite drops `sourceUrl`;
  per the click-through decision, lite should *keep* `sourceUrl` and drop only
  `iconUrl`/`notes`. Update `toWire`/`fromWire` when implementing.
- **Dot ↔ paperdoll alignment** — dot positions are hand-placed and slightly
  off the silhouette in the wireframe; needs tuning when ported to React with
  normalized (0..1) zone coordinates.
