import { describe, it, expect, beforeEach } from 'vitest';
import { useInventory } from './useInventory';

/**
 * Store tests for the holder-mutation actions added in Sprint 1:
 * moveItem (cross-holder + reorder + capacity), addItemRef, removeItemRef.
 *
 * Each test resets to the seeded state first so cases stay independent.
 */

const s = () => useInventory.getState();

// Seed holders we lean on (see src/data/seed.ts).
const POCKET = 'c-pocket'; // capacity 4, full (phone/knife/pen/flashlight)
const WALLET = 'c-wallet'; // capacity 8, 4 refs
const HOME = 's-home'; // stash, uncapped, 3 refs

beforeEach(() => {
  useInventory.getState().resetToSeed();
});

function holderItems(holderId: string) {
  const st = s();
  const build = st.builds.find((b) => b.id === st.activeBuildId)!;
  const container = build.containers.find((c) => c.id === holderId);
  if (container) return container.items;
  return st.stash.find((l) => l.id === holderId)!.items;
}

describe('moveItem', () => {
  it('moves a ref from one container to a stash location', () => {
    const ref = holderItems(WALLET)[0]; // cards
    const fromBefore = holderItems(WALLET).length;
    const toBefore = holderItems(HOME).length;

    s().moveItem(ref.id, WALLET, HOME);

    expect(holderItems(WALLET)).toHaveLength(fromBefore - 1);
    expect(holderItems(HOME)).toHaveLength(toBefore + 1);
    expect(holderItems(HOME).at(-1)!.id).toBe(ref.id);
    expect(holderItems(WALLET).find((r) => r.id === ref.id)).toBeUndefined();
  });

  it('rejects a move that would overflow a full container (no-op)', () => {
    // POCKET is at capacity (4/4); WALLET has room. Move wallet → pocket.
    const ref = holderItems(WALLET)[0];
    const pocketBefore = [...holderItems(POCKET)];
    const walletBefore = [...holderItems(WALLET)];

    s().moveItem(ref.id, WALLET, POCKET);

    expect(holderItems(POCKET)).toEqual(pocketBefore);
    expect(holderItems(WALLET)).toEqual(walletBefore);
  });

  it('reorders within a holder when from === to', () => {
    const before = holderItems(WALLET).map((r) => r.id);
    const moving = before[0];
    s().moveItem(moving, WALLET, WALLET, 2);
    const after = holderItems(WALLET).map((r) => r.id);

    expect(after).toHaveLength(before.length);
    expect(after[2]).toBe(moving);
    expect([...after].sort()).toEqual([...before].sort());
  });

  it('inserts at an explicit toIndex on a cross-holder move', () => {
    const ref = holderItems(WALLET)[0];
    s().moveItem(ref.id, WALLET, HOME, 1);
    expect(holderItems(HOME)[1].id).toBe(ref.id);
  });

  it('is a no-op for an unknown ref or holder', () => {
    const before = [...holderItems(WALLET)];
    s().moveItem('does-not-exist', WALLET, HOME);
    s().moveItem(before[0].id, 'no-holder', HOME);
    expect(holderItems(WALLET)).toEqual(before);
  });
});

describe('addItemRef / removeItemRef', () => {
  it('adds a ref to a holder and returns its id', () => {
    const before = holderItems(HOME).length;
    const id = s().addItemRef(HOME, 'pen', 2);
    expect(id).toBeTruthy();
    expect(holderItems(HOME)).toHaveLength(before + 1);
    const added = holderItems(HOME).find((r) => r.id === id)!;
    expect(added.itemId).toBe('pen');
    expect(added.quantity).toBe(2);
  });

  it('defaults quantity to 1', () => {
    const id = s().addItemRef(HOME, 'pen');
    expect(holderItems(HOME).find((r) => r.id === id)!.quantity).toBe(1);
  });

  it('refuses to add into a full container and returns null', () => {
    const before = [...holderItems(POCKET)];
    const id = s().addItemRef(POCKET, 'pen');
    expect(id).toBeNull();
    expect(holderItems(POCKET)).toEqual(before);
  });

  it('removes a ref from a holder', () => {
    const ref = holderItems(WALLET)[0];
    s().removeItemRef(WALLET, ref.id);
    expect(holderItems(WALLET).find((r) => r.id === ref.id)).toBeUndefined();
  });
});
