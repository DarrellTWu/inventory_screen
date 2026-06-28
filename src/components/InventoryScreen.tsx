import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { ContainerKind, Zone } from '@/types';
import { useInventory, useActiveBuild } from '@/store/useInventory';
import { Paperdoll, STAGE_W, STAGE_H, type Connector } from './Paperdoll';
import { ContainerPanel } from './ContainerPanel';
import { StashPanel } from './StashPanel';
import { ItemDetail } from './ItemDetail';
import { CreateContainerDialog } from './CreateContainerDialog';
import { AddItemDialog, type NewItemDraft } from './AddItemDialog';
import { ShareDialog } from './ShareDialog';

// Cell/grid geometry — must track the tokens in global.css (56px cells, 2px
// gaps, 4px grid padding) so floated panels are sized/stacked accurately.
const CELL = 56;
const GAP = 2;
const PAD = 4;
const HEADER = 32; // .ch height at the larger display type
const COLS_MAX = 3; // default to 3-wide grids (6-item bags read as 3×2)

const cols = (capacity: number) => Math.min(capacity, COLS_MAX);

/** Estimate a panel's pixel height so same-side panels can stack without overlap. */
function panelHeight(capacity: number): number {
  const rows = Math.ceil(capacity / cols(capacity));
  return HEADER + rows * (CELL + GAP) + PAD * 2;
}

/** Panel pixel width: cell grid (56px cells, 2px gaps) + grid padding + border. */
function panelWidth(capacity: number): number {
  return cols(capacity) * (CELL + GAP) + PAD * 2;
}

export function InventoryScreen() {
  const build = useActiveBuild();
  const zones = useInventory((s) => s.zones);
  const stash = useInventory((s) => s.stash);
  const items = useInventory((s) => s.items);

  const addContainer = useInventory((s) => s.addContainer);
  const removeContainer = useInventory((s) => s.removeContainer);
  const createItem = useInventory((s) => s.createItem);
  const addItemRef = useInventory((s) => s.addItemRef);
  const removeItemRef = useInventory((s) => s.removeItemRef);
  const moveItem = useInventory((s) => s.moveItem);

  const [selectedRefId, setSelectedRefId] = useState<string | null>(null);
  const [createZone, setCreateZone] = useState<Zone | null>(null);
  const [addHolderId, setAddHolderId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [activeDragRef, setActiveDragRef] = useState<string | null>(null);

  // A click should select; only a deliberate drag should move. 6px activation.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const zoneById = useMemo(() => new Map(zones.map((z) => [z.id, z])), [zones]);
  const activeZoneIds = useMemo(
    () => new Set((build?.containers ?? []).map((c) => c.zoneId)),
    [build],
  );

  // refId → { holderId, itemId, quantity } across containers + stash. Powers the
  // detail panel and "which holder did this ref come from" for moves/removes.
  const refIndex = useMemo(() => {
    const map = new Map<string, { holderId: string; itemId: string; quantity: number }>();
    for (const c of build?.containers ?? []) {
      for (const r of c.items) map.set(r.id, { holderId: c.id, itemId: r.itemId, quantity: r.quantity });
    }
    for (const l of stash) {
      for (const r of l.items) map.set(r.id, { holderId: l.id, itemId: r.itemId, quantity: r.quantity });
    }
    return map;
  }, [build, stash]);

  // Lay panels out per side. Sorting by the dot's height keeps panel order
  // matching dot order so the connectors don't cross, then we stack top-to-
  // bottom (seeding each panel near its dot) so same-side panels don't overlap.
  // A connector runs from each dot to its panel's inner edge.
  const { placements, connectors } = useMemo(() => {
    const containers = build?.containers ?? [];
    const withZone = containers.map((c) => ({ c, zone: zoneById.get(c.zoneId) }));

    const bySide: Record<'left' | 'right', typeof withZone> = { left: [], right: [] };
    for (const entry of withZone) bySide[entry.zone?.side ?? 'left'].push(entry);

    const placed: {
      container: (typeof containers)[number];
      zone: (typeof withZone)[number]['zone'];
      side: 'left' | 'right';
      top: number;
      width: number;
    }[] = [];
    const lines: Connector[] = [];

    (['left', 'right'] as const).forEach((side) => {
      const list = [...bySide[side]].sort(
        (a, b) => (a.zone?.y ?? 0) - (b.zone?.y ?? 0),
      );
      let cursor = 8;
      for (const { c, zone } of list) {
        // Prefer to anchor the panel near its dot, but never above the running
        // cursor (which prevents overlap with the panel above it).
        const desired = zone ? zone.y * STAGE_H - HEADER / 2 : cursor;
        const top = Math.max(cursor, desired);
        const width = panelWidth(c.capacity);
        placed.push({ container: c, zone, side, top, width });
        if (zone) {
          lines.push({
            x1: zone.x * STAGE_W,
            y1: zone.y * STAGE_H,
            x2: side === 'left' ? width : STAGE_W - width,
            y2: top + HEADER / 2,
          });
        }
        cursor = top + panelHeight(c.capacity) + 12;
      }
    });

    return { placements: placed, connectors: lines };
  }, [build, zoneById]);

  const holderName = (id: string | null): string => {
    if (!id) return '';
    const c = build?.containers.find((x) => x.id === id);
    if (c) return c.name;
    return stash.find((l) => l.id === id)?.name ?? '';
  };

  function onDragStart(e: DragStartEvent) {
    setActiveDragRef(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveDragRef(null);
    const { active, over } = e;
    if (!over) return;
    const data = active.data.current as { fromHolderId: string } | undefined;
    const from = data?.fromHolderId;
    const to = String(over.id);
    if (!from || from === to) return;
    moveItem(String(active.id), from, to);
  }

  function handleCreateContainer(kind: ContainerKind, name: string, capacity: number) {
    if (!build || !createZone) return;
    addContainer(build.id, createZone.id, kind, name, capacity);
    setCreateZone(null);
  }

  function handleAddItem(draft: NewItemDraft) {
    if (!addHolderId) return;
    const itemId = createItem({
      name: draft.name,
      emoji: draft.emoji,
      brand: draft.brand,
      weightGrams: draft.weightGrams,
      notes: draft.notes,
    });
    addItemRef(addHolderId, itemId, 1);
    setAddHolderId(null);
  }

  const selected = selectedRefId ? refIndex.get(selectedRefId) : undefined;
  const selectedItem = selected ? items[selected.itemId] : undefined;

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="inv">
        <div className="topbar">
          <em>EDC INVENTORY</em>
          <span style={{ color: 'var(--text-faint)' }}>//</span>
          <span>daily carry</span>
          <span className="spacer" />
          <button className="topbar-btn" onClick={() => setShareOpen(true)}>
            SHARE
          </button>
          <span className="btag">● {build?.name?.toUpperCase() ?? 'NO BUILD'}</span>
        </div>

        <div className="mid">
          <div className="carry">
            <Paperdoll
              zones={zones}
              activeZoneIds={activeZoneIds}
              connectors={connectors}
              onZoneActivate={(zoneId) => setCreateZone(zoneById.get(zoneId) ?? null)}
            />

            {placements.map(({ container, zone, side, top }) => (
              <ContainerPanel
                key={container.id}
                container={container}
                zone={zone}
                items={items}
                selectedRefId={selectedRefId}
                onSelect={setSelectedRefId}
                onAddItem={setAddHolderId}
                onDelete={removeContainer.bind(null, build!.id)}
                style={{ top, [side]: 0 }}
              />
            ))}
          </div>

          <StashPanel
            stash={stash}
            items={items}
            selectedRefId={selectedRefId}
            onSelect={setSelectedRefId}
            onAddItem={setAddHolderId}
          />
        </div>

        {selectedItem && selected && (
          <ItemDetail
            item={selectedItem}
            quantity={selected.quantity}
            onClose={() => setSelectedRefId(null)}
            onRemove={() => {
              removeItemRef(selected.holderId, selectedRefId!);
              setSelectedRefId(null);
            }}
          />
        )}
      </div>

      <DragOverlay>
        {activeDragRef
          ? (() => {
              const entry = refIndex.get(activeDragRef);
              const item = entry ? items[entry.itemId] : undefined;
              return (
                <div className="ic s" style={{ cursor: 'grabbing' }}>
                  {item?.iconUrl ? <img src={item.iconUrl} alt="" /> : (item?.emoji ?? '❓')}
                </div>
              );
            })()
          : null}
      </DragOverlay>

      {createZone && (
        <CreateContainerDialog
          zone={createZone}
          onConfirm={handleCreateContainer}
          onCancel={() => setCreateZone(null)}
        />
      )}

      {addHolderId && (
        <AddItemDialog
          holderName={holderName(addHolderId)}
          onSubmit={handleAddItem}
          onCancel={() => setAddHolderId(null)}
        />
      )}

      {shareOpen && <ShareDialog onClose={() => setShareOpen(false)} />}
    </DndContext>
  );
}
