/**
 * EDC Inventory — core data model
 * ---------------------------------
 * The whole app is a tree of locations that hold items:
 *
 *   Build ──> Containers (on-body, anchored to a paperdoll Zone)
 *   Stash ──> StashLocations (off-body: car, nightstand, work desk…)
 *
 * Both Containers and StashLocations are "slots that hold ItemRefs".
 * An Item is the canonical definition of a thing you own; an ItemRef is
 * a placement of that item somewhere (with a quantity). The same Item can
 * be referenced from multiple places (e.g. spare batteries in car + desk).
 */

export type Id = string;

/** A point on the paperdoll where a container can be anchored. */
export interface Zone {
  id: Id;
  /** Normalized position on the paperdoll SVG (0..1 in both axes). */
  x: number;
  y: number;
  /** Which side the container panel floats to. */
  side: 'left' | 'right';
  /** Human label, e.g. "L wrist", "R front pocket". Optional/freeform. */
  label?: string;
}

/**
 * The canonical definition of a thing you own. Lives once in the catalog
 * and is referenced by placements. Editing it updates everywhere.
 */
export interface Item {
  id: Id;
  name: string;
  brand?: string;
  /** Emoji shown as a fallback when no image icon is set. */
  emoji?: string;
  /** Resolved icon image URL (uploaded, or scraped from sourceUrl). */
  iconUrl?: string;
  /** External product/store listing used to pull the icon + metadata. */
  sourceUrl?: string;
  /** Grams. Used for loadout weight totals. */
  weightGrams?: number;
  notes?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

/** A placement of an Item in a Container or StashLocation. */
export interface ItemRef {
  id: Id;
  itemId: Id;
  quantity: number;
}

export type ContainerKind =
  | 'wallet'
  | 'keychain'
  | 'pocket'
  | 'belt'
  | 'holster'
  | 'bag'
  | 'pouch'
  | 'watch'
  | 'custom';

/**
 * An on-body container anchored to a paperdoll zone. Created when the user
 * double-clicks a dot and defines kind + capacity.
 */
export interface Container {
  id: Id;
  zoneId: Id;
  kind: ContainerKind;
  name: string;
  /** Max ItemRefs this container can hold (the grid size). */
  capacity: number;
  items: ItemRef[];
}

/** An off-body storage location inside the Stash (car, nightstand, desk…). */
export interface StashLocation {
  id: Id;
  name: string;
  /** Tabler icon name, e.g. "car", "home", "bed", "briefcase". */
  icon: string;
  items: ItemRef[];
}

/**
 * A named loadout. A build owns the set of containers active for that
 * configuration (e.g. "EDC Daily", "Travel", "Gym"). Switching builds
 * swaps which containers render on the paperdoll.
 */
export interface Build {
  id: Id;
  name: string;
  containers: Container[];
}

/** Top-level persisted state. */
export interface InventoryState {
  /** Catalog of every item the user owns, keyed by id. */
  items: Record<Id, Item>;
  /** Reusable zone anchors on the paperdoll. */
  zones: Zone[];
  /** All loadouts. */
  builds: Build[];
  /** Id of the currently displayed build. */
  activeBuildId: Id;
  /** Off-body storage, independent of the active build. */
  stash: StashLocation[];
  /** Schema version for migrations. */
  version: number;
}
