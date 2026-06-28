import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type {
  Build,
  Container,
  ContainerKind,
  Id,
  InventoryState,
  Item,
  StashLocation,
  Zone,
} from '@/types';
import { seedState } from '@/data/seed';
import {
  collectSharedBuild,
  decodeSharedBuild,
  encodeSharedBuild,
  type ExportOptions,
} from '@/lib/share';

/**
 * Central store. Holds the persisted InventoryState plus the actions that
 * mutate it. Persistence is localStorage via zustand's `persist` middleware
 * — swap the storage engine here when moving to SQLite/Tauri.
 *
 * Most actions are stubbed with the intended signature so future agents have
 * a clear contract to implement against. Implemented ones are marked DONE.
 */

interface InventoryActions {
  /** DONE — switch the displayed loadout. */
  setActiveBuild: (buildId: Id) => void;

  /** Create a container at a zone (the double-click-a-dot flow). */
  addContainer: (
    buildId: Id,
    zoneId: Id,
    kind: ContainerKind,
    name: string,
    capacity: number,
  ) => Id;

  /** Remove a container and free its zone. */
  removeContainer: (buildId: Id, containerId: Id) => void;

  /** Add a brand-new item to the catalog. Returns its id. */
  createItem: (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => Id;

  /** Patch an existing catalog item. */
  updateItem: (itemId: Id, patch: Partial<Item>) => void;

  /**
   * Move an item placement between any two holders (container or stash
   * location). This is the core drag-and-drop action. `from`/`to` reference
   * a holder by id; the resolver figures out whether it's a container or a
   * stash location.
   */
  moveItem: (refId: Id, fromHolderId: Id, toHolderId: Id, toIndex?: number) => void;

  /** Manage off-body stash locations. */
  addStashLocation: (name: string, icon: string) => Id;
  removeStashLocation: (locationId: Id) => void;

  /** Reset everything back to the seeded personal setup. */
  resetToSeed: () => void;

  /** Serialize a build into a self-contained, shareable code. Lite by default. */
  exportBuild: (buildId: Id, opts?: ExportOptions) => string | null;

  /**
   * Import a shared build code: merges its items into the catalog with fresh
   * ids, adds its zones and a new build, and makes it active. Returns the new
   * build id. Throws (ShareDecodeError) on an invalid code.
   */
  importBuildCode: (code: string) => Id;
}

type Store = InventoryState & InventoryActions;

export const useInventory = create<Store>()(
  persist(
    (set, get) => ({
      ...seedState,

      setActiveBuild: (buildId) => set({ activeBuildId: buildId }),

      addContainer: (buildId, zoneId, kind, name, capacity) => {
        const id = nanoid();
        const container: Container = { id, zoneId, kind, name, capacity, items: [] };
        set((s) => ({
          builds: s.builds.map((b) =>
            b.id === buildId ? { ...b, containers: [...b.containers, container] } : b,
          ),
        }));
        return id;
      },

      removeContainer: (buildId, containerId) =>
        set((s) => ({
          builds: s.builds.map((b) =>
            b.id === buildId
              ? { ...b, containers: b.containers.filter((c) => c.id !== containerId) }
              : b,
          ),
        })),

      createItem: (partial) => {
        const id = nanoid();
        const ts = Date.now();
        const item: Item = { ...partial, id, createdAt: ts, updatedAt: ts };
        set((s) => ({ items: { ...s.items, [id]: item } }));
        return id;
      },

      updateItem: (itemId, patch) =>
        set((s) => {
          const existing = s.items[itemId];
          if (!existing) return {};
          return {
            items: {
              ...s.items,
              [itemId]: { ...existing, ...patch, updatedAt: Date.now() },
            },
          };
        }),

      // TODO(agent): implement holder resolution + reordering. See DESIGN.md.
      moveItem: (_refId, _fromHolderId, _toHolderId, _toIndex) => {
        void get;
        throw new Error('moveItem not implemented yet — see DESIGN.md "Drag and drop".');
      },

      addStashLocation: (name, icon) => {
        const id = nanoid();
        const location: StashLocation = { id, name, icon, items: [] };
        set((s) => ({ stash: [...s.stash, location] }));
        return id;
      },

      removeStashLocation: (locationId) =>
        set((s) => ({ stash: s.stash.filter((l) => l.id !== locationId) })),

      resetToSeed: () => set({ ...seedState }),

      exportBuild: (buildId, opts) => {
        const s = get();
        const build = s.builds.find((b) => b.id === buildId);
        if (!build) return null;
        const shared = collectSharedBuild(build, s.zones, s.items);
        return encodeSharedBuild(shared, opts);
      },

      importBuildCode: (code) => {
        const shared = decodeSharedBuild(code); // throws on bad input

        // Remap every incoming id to a fresh local id so an import can never
        // clobber existing data. itemId/zoneId references are rewritten too.
        const itemIdMap = new Map<Id, Id>();
        const newItems: Record<Id, (typeof shared.items)[number]> = {};
        for (const it of shared.items) {
          const newId = nanoid();
          itemIdMap.set(it.id, newId);
          newItems[newId] = { ...it, id: newId };
        }

        const zoneIdMap = new Map<Id, Id>();
        const newZones: Zone[] = shared.zones.map((z) => {
          const newId = nanoid();
          zoneIdMap.set(z.id, newId);
          return { ...z, id: newId };
        });

        const newBuildId = nanoid();
        const newContainers: Container[] = shared.containers.map((c) => ({
          ...c,
          id: nanoid(),
          zoneId: zoneIdMap.get(c.zoneId) ?? c.zoneId,
          items: c.items.map((r) => ({
            id: nanoid(),
            itemId: itemIdMap.get(r.itemId) ?? r.itemId,
            quantity: r.quantity,
          })),
        }));

        const newBuild: Build = {
          id: newBuildId,
          name: shared.name,
          containers: newContainers,
        };

        set((s) => ({
          items: { ...s.items, ...newItems },
          zones: [...s.zones, ...newZones],
          builds: [...s.builds, newBuild],
          activeBuildId: newBuildId,
        }));

        return newBuildId;
      },
    }),
    {
      name: 'edc-inventory',
      version: 1,
    },
  ),
);

/** Convenience selector for the currently active build. */
export function useActiveBuild(): Build | undefined {
  return useInventory((s) => s.builds.find((b) => b.id === s.activeBuildId));
}
