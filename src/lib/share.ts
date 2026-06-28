import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';
import type { Build, Container, ContainerKind, Item, Zone } from '@/types';

/**
 * Self-contained build sharing.
 *
 * A build (its zones, containers, and the catalog items they reference) is
 * serialized into a compact array form, compressed with lz-string, and emitted
 * as a URL-safe string — the "share code". No backend required: the code IS
 * the build. Paste it into `#build=<code>` and the app reconstructs everything.
 *
 * Measured size: a large 45-item build encodes to ~1.2KB (lite) / ~1.7KB
 * (full), comfortably within URL limits. See docs/DESIGN.md "Sharing".
 *
 * The wire format uses positional arrays + one-letter keys to stay small.
 * Bump SHARE_VERSION and branch on it if the shape ever changes.
 */

export const SHARE_VERSION = 1;

/** Everything needed to reconstruct a build, decoupled from store ids. */
export interface SharedBuild {
  name: string;
  zones: Zone[];
  containers: Container[];
  /** Catalog items referenced by the containers (deduped). */
  items: Item[];
}

export interface ExportOptions {
  /**
   * Lite (default) drops personal/heavy fields — notes, sourceUrl, iconUrl —
   * keeping name, brand, emoji, and weight. Full keeps everything.
   */
  lite?: boolean;
}

interface Wire {
  v: number;
  n: string;
  /** [id, x, y, side(0=left,1=right), label] */
  z: [string, number, number, 0 | 1, string][];
  /** [id, zoneId, kind, name, capacity, [[itemId, qty], ...]] */
  c: [string, string, string, string, number, [string, number][]][];
  /** [id, name, brand, emoji, weight, notes, sourceUrl, iconUrl] */
  i: [string, string, string, string, number, string, string, string][];
}

function toWire(shared: SharedBuild, lite: boolean): Wire {
  return {
    v: SHARE_VERSION,
    n: shared.name,
    z: shared.zones.map((z) => [z.id, z.x, z.y, z.side === 'left' ? 0 : 1, z.label ?? '']),
    c: shared.containers.map((c) => [
      c.id,
      c.zoneId,
      c.kind,
      c.name,
      c.capacity,
      c.items.map((r) => [r.itemId, r.quantity] as [string, number]),
    ]),
    i: shared.items.map((it) => [
      it.id,
      it.name,
      it.brand ?? '',
      it.emoji ?? '',
      it.weightGrams ?? 0,
      lite ? '' : (it.notes ?? ''),
      lite ? '' : (it.sourceUrl ?? ''),
      lite ? '' : (it.iconUrl ?? ''),
    ]),
  };
}

function fromWire(w: Wire): SharedBuild {
  const now = Date.now();
  return {
    name: w.n,
    zones: w.z.map(([id, x, y, side, label]) => ({
      id,
      x,
      y,
      side: side === 0 ? 'left' : 'right',
      ...(label ? { label } : {}),
    })),
    containers: w.c.map(([id, zoneId, kind, name, capacity, items]) => ({
      id,
      zoneId,
      kind: kind as ContainerKind,
      name,
      capacity,
      items: items.map(([itemId, quantity], idx) => ({
        id: `${id}:${idx}`,
        itemId,
        quantity,
      })),
    })),
    items: w.i.map(([id, name, brand, emoji, weight, notes, sourceUrl, iconUrl]) => ({
      id,
      name,
      ...(brand ? { brand } : {}),
      ...(emoji ? { emoji } : {}),
      ...(weight ? { weightGrams: weight } : {}),
      ...(notes ? { notes } : {}),
      ...(sourceUrl ? { sourceUrl } : {}),
      ...(iconUrl ? { iconUrl } : {}),
      createdAt: now,
      updatedAt: now,
    })),
  };
}

/** Collect a build's zones + referenced catalog items into a SharedBuild. */
export function collectSharedBuild(
  build: Build,
  allZones: Zone[],
  catalog: Record<string, Item>,
): SharedBuild {
  const usedZoneIds = new Set(build.containers.map((c) => c.zoneId));
  const usedItemIds = new Set<string>();
  for (const c of build.containers) {
    for (const r of c.items) usedItemIds.add(r.itemId);
  }
  return {
    name: build.name,
    zones: allZones.filter((z) => usedZoneIds.has(z.id)),
    containers: build.containers,
    items: [...usedItemIds].map((id) => catalog[id]).filter((it): it is Item => Boolean(it)),
  };
}

/** Serialize → compress → URL-safe code. */
export function encodeSharedBuild(shared: SharedBuild, opts: ExportOptions = {}): string {
  const wire = toWire(shared, opts.lite ?? true);
  return compressToEncodedURIComponent(JSON.stringify(wire));
}

export class ShareDecodeError extends Error {}

/** Decompress + parse a share code back into a SharedBuild. Throws on garbage. */
export function decodeSharedBuild(code: string): SharedBuild {
  let json: string | null;
  try {
    json = decompressFromEncodedURIComponent(code);
  } catch {
    throw new ShareDecodeError('Could not decompress share code.');
  }
  if (!json) throw new ShareDecodeError('Empty or invalid share code.');

  let wire: Wire;
  try {
    wire = JSON.parse(json) as Wire;
  } catch {
    throw new ShareDecodeError('Share code is not valid JSON.');
  }
  if (wire.v !== SHARE_VERSION) {
    throw new ShareDecodeError(`Unsupported share version: ${wire.v}.`);
  }
  if (!Array.isArray(wire.c) || !Array.isArray(wire.i) || !Array.isArray(wire.z)) {
    throw new ShareDecodeError('Malformed share payload.');
  }
  return fromWire(wire);
}
