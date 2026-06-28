import type { InventoryState, Item, Id } from '@/types';

/**
 * Seed data — the owner's personal EDC setup, preloaded on first run.
 *
 * This is placeholder/sample content mirroring the wireframe. Replace the
 * items, containers, and stash with the real personal loadout. Keep ids
 * stable and human-readable so they're easy to reference while editing.
 */

const now = Date.now();

function item(partial: Omit<Item, 'createdAt' | 'updatedAt'>): Item {
  return { ...partial, createdAt: now, updatedAt: now };
}

const items: Item[] = [
  item({ id: 'watch-skx', name: 'Seiko SKX007', brand: 'Seiko', emoji: '⌚', weightGrams: 118 }),
  item({ id: 'phone', name: 'iPhone 15 Pro', brand: 'Apple', emoji: '📱', weightGrams: 187 }),
  item({ id: 'knife', name: 'Pocket knife', emoji: '🔪', weightGrams: 60 }),
  item({ id: 'pen', name: 'Zebra F-701', brand: 'Zebra', emoji: '✏️', weightGrams: 27 }),
  item({ id: 'flashlight', name: 'Pocket flashlight', emoji: '💡', weightGrams: 40 }),
  item({ id: 'cards', name: 'Cards', emoji: '💳' }),
  item({ id: 'id', name: 'ID', emoji: '🪪' }),
  item({ id: 'cash', name: 'Cash', emoji: '💵' }),
  item({ id: 'transit', name: 'Transit card', emoji: '🏧' }),
  item({ id: 'keys', name: 'Keys', emoji: '🔑' }),
  item({ id: 'key-light', name: 'Keychain light', emoji: '🔦', weightGrams: 15 }),
  item({ id: 'multitool', name: 'Multitool', emoji: '🔧', weightGrams: 140 }),
  item({ id: 'meds', name: 'Meds', emoji: '💊' }),
  item({ id: 'tag', name: 'AirTag', emoji: '🆔', weightGrams: 11 }),
  item({ id: 'laptop', name: 'Laptop', emoji: '💻', weightGrams: 1400 }),
  item({ id: 'battery', name: 'Power bank', emoji: '🔋', weightGrams: 210 }),
  item({ id: 'earbuds', name: 'Earbuds', emoji: '🎧', weightGrams: 50 }),
  item({ id: 'notebook', name: 'Notebook', emoji: '📓', weightGrams: 120 }),
  item({ id: 'sanitizer', name: 'Hand sanitizer', emoji: '🧴' }),
  item({ id: 'cable', name: 'Charging cable', emoji: '🔌', weightGrams: 30 }),
  item({ id: 'spare-key', name: 'Spare key', emoji: '🗝️' }),
];

const itemsById = items.reduce<Record<Id, Item>>((acc, it) => {
  acc[it.id] = it;
  return acc;
}, {});

export const seedState: InventoryState = {
  version: 1,
  items: itemsById,
  activeBuildId: 'build-daily',
  // Full candidate carry-zone set. Coordinates are normalized (0..1) over the
  // 600×430 paperdoll stage, placed to sit directly on the silhouette (which is
  // drawn centered in that same stage — see Paperdoll.tsx). A zone with no
  // container pointing at it renders as an inactive dot. The 5 ids referenced
  // by seed containers below stay stable.
  zones: [
    // — active in the seed build —
    { id: 'z-l-wrist', x: 0.413, y: 0.423, side: 'left', label: 'L wrist' },
    { id: 'z-l-pocket', x: 0.472, y: 0.442, side: 'left', label: 'L front pocket' },
    { id: 'z-l-belt', x: 0.475, y: 0.402, side: 'left', label: 'Waist / belt' },
    { id: 'z-back', x: 0.5, y: 0.153, side: 'right', label: 'Upper back' },
    { id: 'z-r-pocket', x: 0.528, y: 0.442, side: 'right', label: 'R front pocket' },
    // — inactive candidates —
    { id: 'z-head', x: 0.5, y: 0.1, side: 'right', label: 'Head' },
    { id: 'z-l-chest', x: 0.462, y: 0.186, side: 'left', label: 'L chest' },
    { id: 'z-r-chest', x: 0.538, y: 0.186, side: 'right', label: 'R chest' },
    { id: 'z-r-wrist', x: 0.587, y: 0.423, side: 'right', label: 'R wrist' },
    { id: 'z-r-hand', x: 0.587, y: 0.449, side: 'right', label: 'R hand' },
    { id: 'z-r-thigh', x: 0.53, y: 0.558, side: 'right', label: 'R thigh' },
  ],
  builds: [
    {
      id: 'build-daily',
      name: 'EDC Daily',
      containers: [
        {
          id: 'c-watch',
          zoneId: 'z-l-wrist',
          kind: 'watch',
          name: 'Watch',
          capacity: 1,
          items: [{ id: 'r1', itemId: 'watch-skx', quantity: 1 }],
        },
        {
          id: 'c-wallet',
          zoneId: 'z-l-pocket',
          kind: 'wallet',
          name: 'Wallet',
          capacity: 8,
          items: [
            { id: 'r2', itemId: 'cards', quantity: 4 },
            { id: 'r3', itemId: 'id', quantity: 1 },
            { id: 'r4', itemId: 'cash', quantity: 1 },
            { id: 'r5', itemId: 'transit', quantity: 1 },
          ],
        },
        {
          id: 'c-keys',
          zoneId: 'z-l-belt',
          kind: 'keychain',
          name: 'Keys',
          capacity: 8,
          items: [
            { id: 'r6', itemId: 'keys', quantity: 3 },
            { id: 'r7', itemId: 'key-light', quantity: 1 },
            { id: 'r8', itemId: 'multitool', quantity: 1 },
            { id: 'r9', itemId: 'meds', quantity: 1 },
            { id: 'r10', itemId: 'tag', quantity: 1 },
          ],
        },
        {
          id: 'c-backpack',
          zoneId: 'z-back',
          kind: 'bag',
          name: 'Backpack',
          capacity: 8,
          items: [
            { id: 'r11', itemId: 'laptop', quantity: 1 },
            { id: 'r12', itemId: 'battery', quantity: 1 },
            { id: 'r13', itemId: 'earbuds', quantity: 1 },
            { id: 'r14', itemId: 'notebook', quantity: 1 },
            { id: 'r15', itemId: 'meds', quantity: 1 },
            { id: 'r16', itemId: 'sanitizer', quantity: 1 },
            { id: 'r17', itemId: 'cable', quantity: 1 },
            { id: 'r18', itemId: 'spare-key', quantity: 1 },
          ],
        },
        {
          id: 'c-pocket',
          zoneId: 'z-r-pocket',
          kind: 'pocket',
          name: 'Pocket carry',
          capacity: 4,
          items: [
            { id: 'r19', itemId: 'phone', quantity: 1 },
            { id: 'r20', itemId: 'knife', quantity: 1 },
            { id: 'r21', itemId: 'pen', quantity: 1 },
            { id: 'r22', itemId: 'flashlight', quantity: 1 },
          ],
        },
      ],
    },
  ],
  stash: [
    {
      id: 's-home',
      name: 'Home base',
      icon: 'home',
      items: [
        { id: 'sr1', itemId: 'flashlight', quantity: 1 },
        { id: 'sr2', itemId: 'multitool', quantity: 1 },
        { id: 'sr3', itemId: 'battery', quantity: 1 },
      ],
    },
    {
      id: 's-car',
      name: 'Car',
      icon: 'car',
      items: [{ id: 'sr4', itemId: 'meds', quantity: 1 }],
    },
    {
      id: 's-nightstand',
      name: 'Nightstand',
      icon: 'bed',
      items: [{ id: 'sr5', itemId: 'meds', quantity: 1 }],
    },
    {
      id: 's-desk',
      name: 'Work desk',
      icon: 'briefcase',
      items: [
        { id: 'sr6', itemId: 'battery', quantity: 1 },
        { id: 'sr7', itemId: 'pen', quantity: 1 },
      ],
    },
  ],
};
